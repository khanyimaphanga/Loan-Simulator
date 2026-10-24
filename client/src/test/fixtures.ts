import { vi } from 'vitest';
import type { EligibilityRequest, EligibilityResponse, LoanProduct, RateResponse, ValidationRules } from '../types';

export const products: LoanProduct[] = [
  {
    id: 'personal_loan',
    name: 'Personal Loan',
    description: 'Flexible personal financing for various needs',
    minAmount: 5000,
    maxAmount: 300000,
    minTerm: 6,
    maxTerm: 60,
    interestRateRange: { min: 10.5, max: 18.5 },
    purposes: ['debt_consolidation', 'home_improvement', 'education', 'medical', 'other'],
  },
  {
    id: 'vehicle_loan',
    name: 'Vehicle Finance',
    description: 'Financing for new and used vehicles',
    minAmount: 50000,
    maxAmount: 1500000,
    minTerm: 12,
    maxTerm: 72,
    interestRateRange: { min: 8.5, max: 15 },
    purposes: ['new_vehicle', 'used_vehicle'],
  },
];

export const rules: ValidationRules = {
  personalInfo: {
    age: { min: 18, max: 65, required: true, errorMessage: 'Age must be between 18 and 65' },
    employmentStatus: {
      required: true,
      options: ['employed', 'self_employed', 'unemployed', 'retired'],
      errorMessage: 'Please select your employment status',
    },
    employmentDuration: { min: 3, required: true, errorMessage: 'Minimum 3 months employment required' },
  },
  financialInfo: {
    monthlyIncome: { min: 5000, required: true, errorMessage: 'Minimum monthly income of R5,000 required' },
    monthlyExpenses: { min: 0, required: true, errorMessage: 'Please enter your monthly expenses' },
    creditScore: { min: 300, max: 850, required: false, errorMessage: 'Credit score must be between 300 and 850' },
  },
  loanDetails: {
    requestedAmount: { min: 5000, max: 300000, required: true, errorMessage: 'Loan amount must be between R5,000 and R300,000' },
    loanTerm: { min: 6, max: 60, required: true, errorMessage: 'Loan term must be between 6 and 60 months' },
  },
};

export const eligibilityRequest: EligibilityRequest = {
  personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
  financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 650 },
  loanDetails: { requestedAmount: 150000, loanTerm: 24, loanPurpose: 'home_improvement' },
};

export function eligibilityResponse(overrides: Partial<EligibilityResponse['eligibilityResult']> = {}): EligibilityResponse {
  return {
    eligibilityResult: {
      isEligible: true,
      approvalLikelihood: 64,
      riskCategory: 'medium',
      decisionReason: 'Your credit profile is in good shape and your income is stable.',
      ...overrides,
    },
    recommendedLoan: {
      productId: 'personal_loan',
      maxAmount: 158000,
      recommendedAmount: 150000,
      interestRate: 12.5,
      monthlyPayment: 7096.1,
      totalRepayment: 170306.4,
    },
    affordabilityAnalysis: {
      disposableIncome: 10000,
      debtToIncomeRatio: 20,
      loanToIncomeRatio: 50,
      affordabilityScore: 'fair',
      newRepayment: 7096.1,
      remainingAfterLoan: 2903.9,
    },
    factors: [
      { id: 'affordability', label: 'Affordability', points: 22, maxPoints: 40, impact: 'neutral', detail: 'Uses 95% of what you can afford.' },
      { id: 'debt_load', label: 'Debt load', points: 9, maxPoints: 20, impact: 'neutral', detail: 'Debt would take 48% of income.' },
      { id: 'credit', label: 'Credit profile', points: 18, maxPoints: 25, impact: 'positive', detail: 'A score of 650 is good.' },
      { id: 'employment', label: 'Income stability', points: 15, maxPoints: 15, impact: 'positive', detail: '24 months.' },
    ],
    improvementLevers: [
      {
        id: 'borrow_less',
        title: 'Borrow R 110 000',
        description: 'Repayments drop to R 5 204 a month.',
        newLikelihood: 76,
        delta: 12,
        changes: { loanDetails: { requestedAmount: 110000 } },
      },
    ],
  };
}

export const rateResponse: RateResponse = {
  interestRate: 12.5,
  monthlyPayment: 7096.1,
  totalInterest: 20306.4,
  totalRepayment: 170306.4,
  paymentSchedule: Array.from({ length: 24 }, (_, i) => ({
    month: i + 1,
    payment: 7096.1,
    principal: 5533.6 + i * 50,
    interest: 1562.5 - i * 50,
    balance: Math.max(0, 150000 - (i + 1) * 6250),
  })),
};

type Handler = (body: unknown) => { status?: number; body: unknown };

/** Stubs global fetch with a tiny router over the four API endpoints. Returns the mock for assertions. */
export function mockApi(overrides: Partial<Record<'eligibility' | 'calculate-rate', Handler>> = {}) {
  const json = (status: number, body: unknown) =>
    Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (url.endsWith('/products')) return json(200, { products });
    if (url.endsWith('/validation-rules')) return json(200, rules);
    for (const route of ['eligibility', 'calculate-rate'] as const) {
      if (url.endsWith(`/${route}`)) {
        const handler = overrides[route];
        if (handler) {
          const res = handler(body);
          return json(res.status ?? 200, res.body);
        }
        return json(200, route === 'eligibility' ? eligibilityResponse() : rateResponse);
      }
    }
    return json(404, { error: 'not_found' });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export const callsTo = (fetchMock: ReturnType<typeof mockApi>, path: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).endsWith(path)).map(([, init]) => JSON.parse(String(init?.body)));

/** A do-nothing 2D context, so the animation can run in jsdom (which has no canvas). */
export function stubCanvas() {
  const ctx = new Proxy({}, { get: () => () => {} });
  return vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
}
