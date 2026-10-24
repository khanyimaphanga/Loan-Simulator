export type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired';

export type LoanPurpose =
  | 'debt_consolidation'
  | 'home_improvement'
  | 'education'
  | 'medical'
  | 'other'
  | 'new_vehicle'
  | 'used_vehicle';

export type ProductId = 'personal_loan' | 'vehicle_loan';

export interface EligibilityRequest {
  personalInfo: {
    age: number;
    employmentStatus: EmploymentStatus;
    /** Months in current employment. Not required for retired/unemployed applicants. */
    employmentDuration?: number;
  };
  financialInfo: {
    monthlyIncome: number;
    /** Total monthly expenses, including existing debt repayments. */
    monthlyExpenses: number;
    /** Portion of monthly expenses that goes to existing debt repayments. */
    existingDebt?: number;
    /** Optional. Applicants who don't know their score get a neutral assumption. */
    creditScore?: number | null;
  };
  loanDetails: {
    requestedAmount: number;
    loanTerm: number;
    loanPurpose: LoanPurpose;
  };
}

export type RiskCategory = 'low' | 'medium' | 'high';
export type AffordabilityScore = 'excellent' | 'good' | 'fair' | 'poor';

export interface ScoreFactor {
  id: 'affordability' | 'debt_load' | 'credit' | 'employment';
  label: string;
  points: number;
  maxPoints: number;
  impact: 'positive' | 'neutral' | 'negative';
  detail: string;
}

export interface ImprovementLever {
  id: 'borrow_less' | 'longer_term' | 'reduce_expenses' | 'reduce_debt' | 'improve_credit';
  title: string;
  description: string;
  newLikelihood: number;
  delta: number;
  /** Fields to merge into the request to simulate this lever. */
  changes: {
    financialInfo?: Partial<EligibilityRequest['financialInfo']>;
    loanDetails?: Partial<EligibilityRequest['loanDetails']>;
  };
}

export interface EligibilityResponse {
  eligibilityResult: {
    isEligible: boolean;
    approvalLikelihood: number;
    riskCategory: RiskCategory;
    decisionReason: string;
  };
  recommendedLoan: {
    productId: ProductId;
    maxAmount: number;
    recommendedAmount: number;
    interestRate: number;
    monthlyPayment: number;
    totalRepayment: number;
  };
  affordabilityAnalysis: {
    disposableIncome: number;
    debtToIncomeRatio: number;
    loanToIncomeRatio: number;
    affordabilityScore: AffordabilityScore;
    /** Monthly repayment on the amount requested. */
    newRepayment: number;
    /** Money left each month after the new repayment. */
    remainingAfterLoan: number;
  };
  /** Extension: explainable scoring breakdown ("why this result"). */
  factors: ScoreFactor[];
  /** Extension: simulated changes that would raise approval likelihood ("path to yes"). */
  improvementLevers: ImprovementLever[];
}

export interface RateRequest {
  loanAmount: number;
  loanTerm: number;
  creditScore?: number | null;
  loanType: ProductId;
}

export interface PaymentRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface RateResponse {
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  paymentSchedule: PaymentRow[];
}
