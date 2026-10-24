import { interestRateFor, monthlyPayment, principalForPayment, roundCents } from './finance.js';
import { productForPurpose, type LoanProduct } from './products.js';
import type {
  AffordabilityScore,
  EligibilityRequest,
  EligibilityResponse,
  ImprovementLever,
  RiskCategory,
  ScoreFactor,
} from './types.js';

/** Share of disposable income a new repayment may use. The rest is a buffer for unexpected costs. */
const DISPOSABLE_BUFFER = 0.8;
/** Total debt repayments (existing + new) may not exceed this share of gross income. */
const MAX_DEBT_SERVICE_RATIO = 0.5;
const ELIGIBLE_THRESHOLD = 50;

interface Assessment {
  product: LoanProduct;
  likelihood: number;
  factors: ScoreFactor[];
  hardStop: string | null;
  rate: number;
  payment: number;
  maxPayment: number;
  disposable: number;
}

const pct = (n: number) => Math.round(n * 1000) / 10;
const rand = (n: number) => `R ${Math.round(n).toLocaleString('en-ZA').replace(/[\s,\u00A0\u202F]/g, ' ')}`;
const floorTo = (n: number, step: number) => Math.floor(n / step) * step;

export function maxAffordablePayment(income: number, expenses: number, existingDebt: number): number {
  const disposable = income - expenses;
  return Math.max(0, Math.min(disposable * DISPOSABLE_BUFFER, income * MAX_DEBT_SERVICE_RATIO - existingDebt));
}

function impactOf(points: number, max: number): ScoreFactor['impact'] {
  const share = points / max;
  return share >= 0.7 ? 'positive' : share >= 0.45 ? 'neutral' : 'negative';
}

function affordabilityFactor(ratio: number): ScoreFactor {
  const points = ratio <= 0.5 ? 40 : ratio <= 0.7 ? 34 : ratio <= 0.85 ? 28 : ratio <= 1 ? 22 : ratio <= 1.15 ? 10 : 0;
  const detail =
    ratio <= 1
      ? `The repayment uses ${Math.round(ratio * 100)}% of what we estimate you can comfortably afford.`
      : `The repayment is ${Math.round((ratio - 1) * 100)}% more than we estimate you can comfortably afford.`;
  return { id: 'affordability', label: 'Affordability', points, maxPoints: 40, impact: impactOf(points, 40), detail };
}

function debtLoadFactor(postLoanDti: number): ScoreFactor {
  const points = postLoanDti <= 0.3 ? 20 : postLoanDti <= 0.4 ? 15 : postLoanDti <= 0.5 ? 9 : postLoanDti <= 0.6 ? 3 : 0;
  return {
    id: 'debt_load',
    label: 'Debt load',
    points,
    maxPoints: 20,
    impact: impactOf(points, 20),
    detail: `All debt repayments, including this loan, would take ${Math.round(postLoanDti * 100)}% of your income.`,
  };
}

function creditFactor(score?: number | null): ScoreFactor {
  const base = { id: 'credit' as const, label: 'Credit profile', maxPoints: 25 };
  if (score == null) {
    return { ...base, points: 13, impact: 'neutral', detail: 'No score provided, so we assumed an average credit profile.' };
  }
  const points = score >= 750 ? 25 : score >= 700 ? 22 : score >= 650 ? 18 : score >= 600 ? 13 : score >= 550 ? 8 : 3;
  const band = score >= 700 ? 'strong' : score >= 650 ? 'good' : score >= 600 ? 'fair' : 'below average';
  return { ...base, points, impact: impactOf(points, 25), detail: `A score of ${score} is ${band}.` };
}

function employmentFactor(status: EligibilityRequest['personalInfo']['employmentStatus'], months = 0): ScoreFactor {
  const base = { id: 'employment' as const, label: 'Income stability', maxPoints: 15 };
  let points: number;
  let detail: string;
  switch (status) {
    case 'employed':
      points = months >= 24 ? 15 : months >= 12 ? 12 : months >= 6 ? 9 : 6;
      detail = `${months} months with your current employer.`;
      break;
    case 'self_employed':
      points = months >= 24 ? 12 : months >= 12 ? 9 : 5;
      detail = `${months} months self-employed. Income can vary more than a salary does.`;
      break;
    case 'retired':
      points = 8;
      detail = 'Retirement income is steady but usually fixed.';
      break;
    default:
      points = 0;
      detail = 'A regular income is needed to repay a loan.';
  }
  return { ...base, points, impact: impactOf(points, 15), detail };
}

function assess(req: EligibilityRequest): Assessment {
  const { personalInfo, financialInfo, loanDetails } = req;
  const product = productForPurpose(loanDetails.loanPurpose);
  if (!product) throw new Error(`No product for purpose ${loanDetails.loanPurpose}`);

  const income = financialInfo.monthlyIncome;
  const debt = financialInfo.existingDebt ?? 0;
  const disposable = income - financialInfo.monthlyExpenses;
  const rate = interestRateFor(product.id, financialInfo.creditScore, loanDetails.loanTerm);
  const payment = monthlyPayment(loanDetails.requestedAmount, rate, loanDetails.loanTerm);
  const maxPayment = maxAffordablePayment(income, financialInfo.monthlyExpenses, debt);
  const ratio = maxPayment > 0 ? payment / maxPayment : Infinity;

  const factors = [
    affordabilityFactor(ratio),
    debtLoadFactor((debt + payment) / income),
    creditFactor(financialInfo.creditScore),
    employmentFactor(personalInfo.employmentStatus, personalInfo.employmentDuration),
  ];

  let hardStop: string | null = null;
  if (personalInfo.employmentStatus === 'unemployed') {
    hardStop = 'A regular source of income is needed before we can offer a loan.';
  } else if (disposable <= 0) {
    hardStop = 'Your monthly expenses currently match or exceed your income, so there is no room for a repayment.';
  } else if (payment > disposable) {
    hardStop = `The repayment of ${rand(payment)} is more than the ${rand(disposable)} you have left each month.`;
  }

  const raw = factors.reduce((sum, f) => sum + f.points, 0);
  // Never promise certainty either way: it's a simulation, not a credit decision.
  const likelihood = Math.round(Math.min(97, Math.max(3, hardStop ? Math.min(raw, 15) : raw)));

  return { product, likelihood, factors, hardStop, rate, payment, maxPayment, disposable };
}

const PHRASES: Record<ScoreFactor['id'], { positive: string; negative: string }> = {
  affordability: {
    positive: 'the repayment fits comfortably in your budget',
    negative: 'the repayment would stretch your monthly budget',
  },
  debt_load: {
    positive: 'your total debt stays at a healthy level',
    negative: 'your total debt repayments would be high relative to your income',
  },
  credit: { positive: 'your credit profile is in good shape', negative: 'your credit score is on the low side' },
  employment: { positive: 'your income is stable', negative: 'your income history is still short' },
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const joinAnd = (parts: string[]) =>
  parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;

function decisionReason(a: Assessment, eligible: boolean): string {
  if (a.hardStop) return a.hardStop;
  const strengths = a.factors.filter((f) => f.impact === 'positive').map((f) => PHRASES[f.id].positive);
  const concerns = a.factors.filter((f) => f.impact === 'negative').map((f) => PHRASES[f.id].negative);
  if (eligible) {
    const lead = strengths.length ? `${capitalise(joinAnd(strengths))}.` : 'Your application meets our affordability criteria.';
    return concerns.length ? `${lead} One thing to watch: ${concerns[0]}.` : lead;
  }
  return concerns.length
    ? `${capitalise(joinAnd(concerns.slice(0, 2)))}.`
    : 'Your profile is borderline. Small changes could tip the result in your favour.';
}

const riskFor = (likelihood: number): RiskCategory => (likelihood >= 75 ? 'low' : likelihood >= ELIGIBLE_THRESHOLD ? 'medium' : 'high');

function affordabilityScoreFor(payment: number, maxPayment: number): AffordabilityScore {
  const ratio = maxPayment > 0 ? payment / maxPayment : Infinity;
  return ratio <= 0.5 ? 'excellent' : ratio <= 0.8 ? 'good' : ratio <= 1 ? 'fair' : 'poor';
}

function withChanges(req: EligibilityRequest, changes: ImprovementLever['changes']): EligibilityRequest {
  return {
    personalInfo: req.personalInfo,
    financialInfo: { ...req.financialInfo, ...changes.financialInfo },
    loanDetails: { ...req.loanDetails, ...changes.loanDetails },
  };
}

/** Simulates realistic changes the applicant could make and reports the ones that move the needle. */
function improvementLevers(req: EligibilityRequest, base: Assessment): ImprovementLever[] {
  if (base.likelihood >= 90 || req.personalInfo.employmentStatus === 'unemployed') return [];
  const { financialInfo: fin, loanDetails: loan } = req;
  const debt = fin.existingDebt ?? 0;
  const candidates: Omit<ImprovementLever, 'newLikelihood' | 'delta'>[] = [];

  const comfortable = floorTo(principalForPayment(base.maxPayment * 0.7, base.rate, loan.loanTerm), 1000);
  if (comfortable >= base.product.minAmount && comfortable < loan.requestedAmount) {
    const newPayment = monthlyPayment(comfortable, base.rate, loan.loanTerm);
    candidates.push({
      id: 'borrow_less',
      title: `Borrow ${rand(comfortable)}`,
      description: `Repayments drop to ${rand(newPayment)} a month, leaving more breathing room.`,
      changes: { loanDetails: { requestedAmount: comfortable } },
    });
  }

  if (loan.loanTerm < base.product.maxTerm) {
    const term = Math.min(base.product.maxTerm, loan.loanTerm + 12);
    const rate = interestRateFor(base.product.id, fin.creditScore, term);
    const extraInterest = monthlyPayment(loan.requestedAmount, rate, term) * term - base.payment * loan.loanTerm;
    candidates.push({
      id: 'longer_term',
      title: `Spread it over ${term} months`,
      description: `Smaller instalments, but you'd pay about ${rand(extraInterest)} more interest overall.`,
      changes: { loanDetails: { loanTerm: term } },
    });
  }

  if (debt > 0) {
    const settle = Math.round(debt / 2);
    candidates.push({
      id: 'reduce_debt',
      title: `Settle ${rand(settle)}/month of debt`,
      description: 'Paying off a store card or small loan first frees up monthly cash.',
      changes: { financialInfo: { existingDebt: debt - settle, monthlyExpenses: fin.monthlyExpenses - settle } },
    });
  }

  const living = fin.monthlyExpenses - debt;
  if (living > 0) {
    const trim = Math.round(living * 0.1);
    candidates.push({
      id: 'reduce_expenses',
      title: `Trim living costs by ${rand(trim)}`,
      description: 'A 10% cut, from things like subscriptions, takeaways or a cheaper data plan.',
      changes: { financialInfo: { monthlyExpenses: fin.monthlyExpenses - trim } },
    });
  }

  if (fin.creditScore != null && fin.creditScore < 750) {
    const score = Math.min(850, fin.creditScore + 50);
    candidates.push({
      id: 'improve_credit',
      title: `Lift your credit score to ${score}`,
      description: 'Paying every account on time for 6 to 12 months usually helps, and unlocks a better rate.',
      changes: { financialInfo: { creditScore: score } },
    });
  }

  return candidates
    .map((c) => {
      const newLikelihood = assess(withChanges(req, c.changes)).likelihood;
      return { ...c, newLikelihood, delta: newLikelihood - base.likelihood };
    })
    .filter((l) => l.delta >= 1)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
}

export function evaluateEligibility(req: EligibilityRequest): EligibilityResponse {
  const a = assess(req);
  const { financialInfo: fin, loanDetails: loan } = req;
  const isEligible = !a.hardStop && a.likelihood >= ELIGIBLE_THRESHOLD;

  const affordableAmount = floorTo(principalForPayment(a.maxPayment, a.rate, loan.loanTerm), 1000);
  const maxAmount = affordableAmount >= a.product.minAmount ? Math.min(affordableAmount, a.product.maxAmount) : 0;
  const recommendedAmount = Math.min(loan.requestedAmount, maxAmount);
  const recommendedPayment = monthlyPayment(recommendedAmount, a.rate, loan.loanTerm);

  return {
    eligibilityResult: {
      isEligible,
      approvalLikelihood: a.likelihood,
      riskCategory: riskFor(a.likelihood),
      decisionReason: decisionReason(a, isEligible),
    },
    recommendedLoan: {
      productId: a.product.id,
      maxAmount,
      recommendedAmount,
      interestRate: a.rate,
      monthlyPayment: recommendedPayment,
      totalRepayment: roundCents(recommendedPayment * loan.loanTerm),
    },
    affordabilityAnalysis: {
      disposableIncome: roundCents(a.disposable),
      debtToIncomeRatio: pct((fin.existingDebt ?? 0) / fin.monthlyIncome),
      loanToIncomeRatio: pct(loan.requestedAmount / (fin.monthlyIncome * 12)),
      affordabilityScore: affordabilityScoreFor(a.payment, a.maxPayment),
      newRepayment: a.payment,
      remainingAfterLoan: roundCents(a.disposable - a.payment),
    },
    factors: a.factors,
    improvementLevers: improvementLevers(req, a),
  };
}
