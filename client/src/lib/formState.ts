import type { EligibilityRequest, EmploymentStatus, LoanProduct, LoanPurpose, ProductId } from '../types';
import { toNumber } from './format';

/** Raw form state. Numeric inputs are kept as digit strings so "empty" is distinguishable from 0. */
export interface FormState {
  age: string;
  employmentStatus: EmploymentStatus | '';
  employmentDuration: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  existingDebt: string;
  /** A band, not an exact score: few people know their number, and a band is enough for an estimate. */
  creditBand: CreditBand | '';
  productId: ProductId;
  loanPurpose: LoanPurpose | '';
  requestedAmount: number;
  loanTerm: number;
}

export const initialForm: FormState = {
  age: '',
  employmentStatus: '',
  employmentDuration: '',
  monthlyIncome: '',
  monthlyExpenses: '',
  existingDebt: '',
  creditBand: '',
  productId: 'personal_loan',
  loanPurpose: '',
  requestedAmount: 50000,
  loanTerm: 24,
};

export type CreditBand = 'excellent' | 'good' | 'fair' | 'poor' | 'unsure';

/** Each band is sent as a representative score inside its range; "Not sure" sends none, so an average is assumed. */
export const CREDIT_BANDS: Record<CreditBand, { label: string; hint: string; score: number | null }> = {
  excellent: { label: 'Excellent', hint: '750+', score: 780 },
  good: { label: 'Good', hint: '650–749', score: 700 },
  fair: { label: 'Fair', hint: '580–649', score: 615 },
  poor: { label: 'Poor', hint: 'Below 580', score: 540 },
  unsure: { label: 'Not sure', hint: "We'll assume average", score: null },
};

export const creditScoreFor = (band: FormState['creditBand']) => (band ? CREDIT_BANDS[band].score : null);

/** The loan purpose decides the product, so customers answer one question instead of two. */
export const productForPurpose = (products: LoanProduct[], purpose: LoanPurpose) =>
  products.find((p) => p.purposes.includes(purpose)) ?? products[0];

export const needsEmploymentDuration = (status: FormState['employmentStatus']) =>
  status === 'employed' || status === 'self_employed';

export function toEligibilityRequest(form: FormState): EligibilityRequest {
  return {
    personalInfo: {
      age: Number(form.age),
      employmentStatus: form.employmentStatus as EmploymentStatus,
      employmentDuration: needsEmploymentDuration(form.employmentStatus) ? Number(form.employmentDuration) : undefined,
    },
    financialInfo: {
      monthlyIncome: Number(form.monthlyIncome),
      monthlyExpenses: Number(form.monthlyExpenses),
      existingDebt: toNumber(form.existingDebt) ?? 0,
      creditScore: creditScoreFor(form.creditBand),
    },
    loanDetails: {
      requestedAmount: form.requestedAmount,
      loanTerm: form.loanTerm,
      loanPurpose: form.loanPurpose as LoanPurpose,
    },
  };
}

/** Keeps amount/term inside the product's limits when the user switches product. */
export function clampToProduct(form: FormState, product: LoanProduct): FormState {
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  return {
    ...form,
    productId: product.id,
    loanPurpose: product.purposes.includes(form.loanPurpose as LoanPurpose) ? form.loanPurpose : '',
    requestedAmount: clamp(form.requestedAmount, product.minAmount, product.maxAmount),
    loanTerm: clamp(form.loanTerm, product.minTerm, product.maxTerm),
  };
}

export const PURPOSE_LABELS: Record<LoanPurpose, string> = {
  debt_consolidation: 'Consolidate debt',
  home_improvement: 'Home improvement',
  education: 'Education',
  medical: 'Medical',
  other: 'Something else',
  new_vehicle: 'New vehicle',
  used_vehicle: 'Used vehicle',
};

export const EMPLOYMENT_LABELS: Record<EmploymentStatus, { label: string; hint: string }> = {
  employed: { label: 'Employed', hint: 'I earn a salary' },
  self_employed: { label: 'Self-employed', hint: 'I run my own business' },
  retired: { label: 'Retired', hint: 'I receive a pension' },
  unemployed: { label: 'Not working', hint: 'No regular income right now' },
};
