/** GET /api/loans/validation-rules from the API spec. The client reads these too, so both sides share one set of limits. */
export const validationRules = {
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
    requestedAmount: {
      min: 5000,
      max: 300000,
      required: true,
      errorMessage: 'Loan amount must be between R5,000 and R300,000',
    },
    loanTerm: { min: 6, max: 60, required: true, errorMessage: 'Loan term must be between 6 and 60 months' },
  },
} as const;

export type ValidationRules = typeof validationRules;
