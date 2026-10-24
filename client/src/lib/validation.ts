import type { LoanProduct, ValidationRules } from '../types';
import { formatRand } from './format';
import { needsEmploymentDuration, type FormState } from './formState';

export type FormErrors = Partial<Record<keyof FormState, string>>;
export type StepId = 'about' | 'money' | 'loan';

const inRange = (raw: string, min?: number, max?: number) => {
  if (raw.trim() === '') return false;
  const n = Number(raw);
  return Number.isFinite(n) && (min == null || n >= min) && (max == null || n <= max);
};

/** Client-side mirror of the server rules, driven by GET /validation-rules so the two can't drift. */
export function validateStep(step: StepId, form: FormState, rules: ValidationRules, product?: LoanProduct): FormErrors {
  const e: FormErrors = {};
  if (step === 'about') {
    const { age, employmentStatus, employmentDuration } = rules.personalInfo;
    if (!inRange(form.age, age.min, age.max)) e.age = age.errorMessage;
    if (!form.employmentStatus) e.employmentStatus = employmentStatus.errorMessage;
    if (needsEmploymentDuration(form.employmentStatus) && !inRange(form.employmentDuration, employmentDuration.min)) {
      e.employmentDuration = employmentDuration.errorMessage;
    }
  }

  if (step === 'money') {
    const { monthlyIncome, monthlyExpenses } = rules.financialInfo;
    if (!inRange(form.monthlyIncome, monthlyIncome.min)) e.monthlyIncome = monthlyIncome.errorMessage;
    if (!inRange(form.monthlyExpenses, monthlyExpenses.min)) e.monthlyExpenses = monthlyExpenses.errorMessage;
    if (form.existingDebt !== '' && form.monthlyExpenses !== '' && Number(form.existingDebt) > Number(form.monthlyExpenses)) {
      e.existingDebt = 'This should be part of your total expenses above';
    }
  }

  if (step === 'loan') {
    if (!form.loanPurpose) e.loanPurpose = 'Please choose what the loan is for';
    const min = product?.minAmount ?? rules.loanDetails.requestedAmount.min!;
    const max = product?.maxAmount ?? rules.loanDetails.requestedAmount.max!;
    if (form.requestedAmount < min || form.requestedAmount > max) {
      e.requestedAmount = `Loan amount must be between ${formatRand(min)} and ${formatRand(max)}`;
    }
  }
  return e;
}

/** Maps server field paths (e.g. "financialInfo.monthlyIncome") back onto form fields. */
export function mapServerErrors(errors: Record<string, string>): FormErrors {
  const out: FormErrors = {};
  for (const [path, message] of Object.entries(errors)) {
    const field = path.split('.').pop();
    // The form asks for a credit band; the API speaks in scores.
    out[(field === 'creditScore' ? 'creditBand' : field) as keyof FormState] = message;
  }
  return out;
}

/** The first step with something left to answer, which is where a returning customer picks up. */
export function firstIncompleteStep(form: FormState, rules: ValidationRules, product: LoanProduct): StepId | null {
  const steps: StepId[] = ['about', 'money', 'loan'];
  return steps.find((step) => Object.keys(validateStep(step, form, rules, product)).length > 0) ?? null;
}

export const stepForField = (field: keyof FormState): StepId =>
  ['age', 'employmentStatus', 'employmentDuration'].includes(field)
    ? 'about'
    : ['monthlyIncome', 'monthlyExpenses', 'existingDebt', 'creditScore', 'creditBand'].includes(field)
      ? 'money'
      : 'loan';
