import { describe, expect, it } from 'vitest';
import { products, rules } from '../test/fixtures';
import { clampToProduct, initialForm, productForPurpose, toEligibilityRequest, type FormState } from './formState';
import { firstIncompleteStep, mapServerErrors, stepForField, validateStep } from './validation';

const complete: FormState = {
  ...initialForm,
  age: '35',
  employmentStatus: 'employed',
  employmentDuration: '24',
  monthlyIncome: '25000',
  monthlyExpenses: '15000',
  existingDebt: '5000',
  creditBand: 'good',
  loanPurpose: 'home_improvement',
  requestedAmount: 150000,
  loanTerm: 24,
};

describe('validateStep', () => {
  it('passes a complete application on every step', () => {
    for (const step of ['about', 'money', 'loan'] as const) {
      expect(validateStep(step, complete, rules, products[0])).toEqual({});
    }
  });

  it('uses the server-provided messages', () => {
    const errors = validateStep('about', { ...complete, age: '70', employmentDuration: '1' }, rules);
    expect(errors).toEqual({
      age: 'Age must be between 18 and 65',
      employmentDuration: 'Minimum 3 months employment required',
    });
  });

  it('skips employment duration for retirees', () => {
    expect(validateStep('about', { ...complete, employmentStatus: 'retired', employmentDuration: '' }, rules)).toEqual({});
  });

  it('catches debt larger than total expenses', () => {
    expect(validateStep('money', { ...complete, existingDebt: '20000' }, rules).existingDebt).toBeDefined();
  });

  it('validates amount against the selected product', () => {
    const errors = validateStep('loan', { ...complete, requestedAmount: 20000 }, rules, products[1]);
    expect(errors.requestedAmount).toBe('Loan amount must be between R 50 000 and R 1 500 000');
  });
});

describe('toEligibilityRequest', () => {
  it('builds the API payload from form state', () => {
    expect(toEligibilityRequest(complete)).toEqual({
      personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
      financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 700 },
      loanDetails: { requestedAmount: 150000, loanTerm: 24, loanPurpose: 'home_improvement' },
    });
  });

  it('sends a score inside each credit band, and none when unsure or unanswered', () => {
    expect(toEligibilityRequest({ ...complete, creditBand: 'excellent' }).financialInfo.creditScore).toBeGreaterThanOrEqual(750);
    expect(toEligibilityRequest({ ...complete, creditBand: 'poor' }).financialInfo.creditScore).toBeLessThan(580);
    expect(toEligibilityRequest({ ...complete, creditBand: 'unsure' }).financialInfo.creditScore).toBeNull();
    expect(toEligibilityRequest({ ...complete, creditBand: '' }).financialInfo.creditScore).toBeNull();
  });

  it('omits employment duration for retirees', () => {
    expect(toEligibilityRequest({ ...complete, employmentStatus: 'retired' }).personalInfo.employmentDuration).toBeUndefined();
  });
});

describe('clampToProduct', () => {
  it('pulls amount and term into the new product range and clears an invalid purpose', () => {
    const next = clampToProduct({ ...complete, requestedAmount: 10000, loanTerm: 6 }, products[1]);
    expect(next).toMatchObject({ productId: 'vehicle_loan', requestedAmount: 50000, loanTerm: 12, loanPurpose: '' });
  });
});

describe('productForPurpose', () => {
  it('picks the product from what the loan is for', () => {
    expect(productForPurpose(products, 'used_vehicle').id).toBe('vehicle_loan');
    expect(productForPurpose(products, 'education').id).toBe('personal_loan');
  });
});

describe('firstIncompleteStep', () => {
  it('finds where a returning customer should pick up', () => {
    expect(firstIncompleteStep({ ...complete, monthlyIncome: '' }, rules, products[0])).toBe('money');
    expect(firstIncompleteStep({ ...complete, loanPurpose: '' }, rules, products[0])).toBe('loan');
    expect(firstIncompleteStep(complete, rules, products[0])).toBeNull();
  });
});

describe('server error mapping', () => {
  it('maps API field paths to form fields and steps', () => {
    const mapped = mapServerErrors({ 'financialInfo.monthlyIncome': 'Too low', 'financialInfo.creditScore': 'Out of range' });
    expect(mapped).toEqual({ monthlyIncome: 'Too low', creditBand: 'Out of range' });
    expect(stepForField('monthlyIncome')).toBe('money');
    expect(stepForField('age')).toBe('about');
    expect(stepForField('loanPurpose')).toBe('loan');
  });
});
