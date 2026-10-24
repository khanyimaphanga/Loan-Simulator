import { describe, expect, it } from 'vitest';
import { validateEligibilityRequest, validateRateRequest } from '../src/domain/validate.js';
import { makeRequest, specRequest } from './fixtures.js';

describe('validateEligibilityRequest', () => {
  it('accepts the spec example', () => {
    expect(validateEligibilityRequest(specRequest)).toEqual({});
  });

  it('uses the spec error messages', () => {
    const errors = validateEligibilityRequest(
      makeRequest({
        personalInfo: { age: 17, employmentDuration: 1 },
        financialInfo: { monthlyIncome: 4000, creditScore: 900 },
        loanDetails: { requestedAmount: 400000, loanTerm: 3 },
      }),
    );
    expect(errors).toEqual({
      'personalInfo.age': 'Age must be between 18 and 65',
      'personalInfo.employmentDuration': 'Minimum 3 months employment required',
      'financialInfo.monthlyIncome': 'Minimum monthly income of R5,000 required',
      'financialInfo.creditScore': 'Credit score must be between 300 and 850',
      'loanDetails.requestedAmount': 'Loan amount must be between R5,000 and R300,000',
      'loanDetails.loanTerm': 'Loan term must be between 6 and 60 months',
    });
  });

  it('does not require employment duration for retirees', () => {
    const errors = validateEligibilityRequest(makeRequest({ personalInfo: { employmentStatus: 'retired', employmentDuration: undefined } }));
    expect(errors).toEqual({});
  });

  it('applies vehicle finance limits for vehicle purposes', () => {
    const ok = makeRequest({ loanDetails: { loanPurpose: 'new_vehicle', requestedAmount: 900000, loanTerm: 72 } });
    expect(validateEligibilityRequest(ok)).toEqual({});
    const tooSmall = makeRequest({ loanDetails: { loanPurpose: 'new_vehicle', requestedAmount: 20000 } });
    expect(validateEligibilityRequest(tooSmall)['loanDetails.requestedAmount']).toMatch(/R50,000 and R1,500,000/);
  });

  it('rejects debt repayments larger than total expenses', () => {
    const errors = validateEligibilityRequest(makeRequest({ financialInfo: { existingDebt: 20000 } }));
    expect(errors['financialInfo.existingDebt']).toBeDefined();
  });

  it('survives an empty body', () => {
    expect(Object.keys(validateEligibilityRequest(undefined)).length).toBeGreaterThan(4);
  });
});

describe('validateRateRequest', () => {
  it('accepts the spec example', () => {
    expect(validateRateRequest({ loanAmount: 150000, loanTerm: 24, creditScore: 650, loanType: 'personal_loan' })).toEqual({});
  });

  it('flags an unknown loan type', () => {
    expect(validateRateRequest({ loanAmount: 150000, loanTerm: 24, loanType: 'boat' }).loanType).toBeDefined();
  });
});
