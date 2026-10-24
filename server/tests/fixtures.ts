import type { EligibilityRequest } from '../src/domain/types.js';

/** The example request from the API spec. */
export const specRequest: EligibilityRequest = {
  personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
  financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 650 },
  loanDetails: { requestedAmount: 150000, loanTerm: 24, loanPurpose: 'home_improvement' },
};

export function makeRequest(overrides: {
  personalInfo?: Partial<EligibilityRequest['personalInfo']>;
  financialInfo?: Partial<EligibilityRequest['financialInfo']>;
  loanDetails?: Partial<EligibilityRequest['loanDetails']>;
} = {}): EligibilityRequest {
  return {
    personalInfo: { ...specRequest.personalInfo, ...overrides.personalInfo },
    financialInfo: { ...specRequest.financialInfo, ...overrides.financialInfo },
    loanDetails: { ...specRequest.loanDetails, ...overrides.loanDetails },
  };
}
