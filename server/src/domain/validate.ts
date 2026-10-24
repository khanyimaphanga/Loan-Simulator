import { getProduct, productForPurpose, products } from './products.js';
import type { EligibilityRequest, RateRequest } from './types.js';
import { validationRules as rules } from './validationRules.js';

export type FieldErrors = Record<string, string>;

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const allPurposes = products.flatMap((p) => p.purposes) as string[];
const rand = (n: number) => `R${n.toLocaleString('en-ZA').replace(/\s|,/g, ',')}`;

/** Amount/term bounds come from the product: the spec rules describe personal loans, vehicle finance has its own range. */
function loanBoundsErrors(
  amount: unknown,
  term: unknown,
  productId: string | undefined,
  errors: FieldErrors,
  keys: { amount: string; term: string },
) {
  const product = productId ? getProduct(productId as never) : undefined;
  const amountRule = rules.loanDetails.requestedAmount;
  const termRule = rules.loanDetails.loanTerm;
  const [minA, maxA] = product ? [product.minAmount, product.maxAmount] : [amountRule.min, amountRule.max];
  const [minT, maxT] = product ? [product.minTerm, product.maxTerm] : [termRule.min, termRule.max];

  if (!isNum(amount) || amount < minA || amount > maxA) {
    errors[keys.amount] =
      product?.id === 'personal_loan' || !product ? amountRule.errorMessage : `Loan amount must be between ${rand(minA)} and ${rand(maxA)}`;
  }
  if (!isNum(term) || !Number.isInteger(term) || term < minT || term > maxT) {
    errors[keys.term] =
      product?.id === 'personal_loan' || !product ? termRule.errorMessage : `Loan term must be between ${minT} and ${maxT} months`;
  }
}

export function validateEligibilityRequest(body: unknown): FieldErrors {
  const errors: FieldErrors = {};
  const req = (body ?? {}) as Partial<EligibilityRequest>;
  const p = req.personalInfo ?? ({} as Partial<EligibilityRequest['personalInfo']>);
  const f = req.financialInfo ?? ({} as Partial<EligibilityRequest['financialInfo']>);
  const l = req.loanDetails ?? ({} as Partial<EligibilityRequest['loanDetails']>);
  const r = rules;

  if (!isNum(p.age) || p.age < r.personalInfo.age.min || p.age > r.personalInfo.age.max) {
    errors['personalInfo.age'] = r.personalInfo.age.errorMessage;
  }
  if (!r.personalInfo.employmentStatus.options.includes(p.employmentStatus as never)) {
    errors['personalInfo.employmentStatus'] = r.personalInfo.employmentStatus.errorMessage;
  }
  // Duration only applies to people currently earning from work.
  if (p.employmentStatus === 'employed' || p.employmentStatus === 'self_employed') {
    if (!isNum(p.employmentDuration) || p.employmentDuration < r.personalInfo.employmentDuration.min) {
      errors['personalInfo.employmentDuration'] = r.personalInfo.employmentDuration.errorMessage;
    }
  }

  if (!isNum(f.monthlyIncome) || f.monthlyIncome < r.financialInfo.monthlyIncome.min) {
    errors['financialInfo.monthlyIncome'] = r.financialInfo.monthlyIncome.errorMessage;
  }
  if (!isNum(f.monthlyExpenses) || f.monthlyExpenses < r.financialInfo.monthlyExpenses.min) {
    errors['financialInfo.monthlyExpenses'] = r.financialInfo.monthlyExpenses.errorMessage;
  }
  if (f.existingDebt != null) {
    if (!isNum(f.existingDebt) || f.existingDebt < 0) {
      errors['financialInfo.existingDebt'] = 'Debt repayments cannot be negative';
    } else if (isNum(f.monthlyExpenses) && f.existingDebt > f.monthlyExpenses) {
      errors['financialInfo.existingDebt'] = 'Debt repayments should be included in your total expenses';
    }
  }
  if (f.creditScore != null) {
    const cs = r.financialInfo.creditScore;
    if (!isNum(f.creditScore) || f.creditScore < cs.min || f.creditScore > cs.max) {
      errors['financialInfo.creditScore'] = cs.errorMessage;
    }
  }

  if (!allPurposes.includes(l.loanPurpose as string)) {
    errors['loanDetails.loanPurpose'] = 'Please choose what the loan is for';
  }
  const product = l.loanPurpose ? productForPurpose(l.loanPurpose) : undefined;
  loanBoundsErrors(l.requestedAmount, l.loanTerm, product?.id, errors, {
    amount: 'loanDetails.requestedAmount',
    term: 'loanDetails.loanTerm',
  });
  return errors;
}

export function validateRateRequest(body: unknown): FieldErrors {
  const errors: FieldErrors = {};
  const req = (body ?? {}) as Partial<RateRequest>;
  if (!getProduct(req.loanType as never)) errors.loanType = 'Unknown loan type';
  loanBoundsErrors(req.loanAmount, req.loanTerm, req.loanType, errors, { amount: 'loanAmount', term: 'loanTerm' });
  if (req.creditScore != null) {
    const cs = rules.financialInfo.creditScore;
    if (!isNum(req.creditScore) || req.creditScore < cs.min || req.creditScore > cs.max) errors.creditScore = cs.errorMessage;
  }
  return errors;
}
