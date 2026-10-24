import { describe, expect, it } from 'vitest';
import { evaluateEligibility, maxAffordablePayment } from '../src/domain/eligibility.js';
import { makeRequest, specRequest } from './fixtures.js';

describe('maxAffordablePayment', () => {
  it('keeps a buffer on disposable income and caps total debt service at 50% of income', () => {
    // disposable 10 000 × 0.8 = 8 000; debt cap 12 500 − 5 000 = 7 500
    expect(maxAffordablePayment(25000, 15000, 5000)).toBe(7500);
    expect(maxAffordablePayment(25000, 20000, 0)).toBe(4000);
  });

  it('never goes negative', () => {
    expect(maxAffordablePayment(10000, 12000, 0)).toBe(0);
  });
});

describe('evaluateEligibility', () => {
  it('returns every field from the API spec', () => {
    const res = evaluateEligibility(specRequest);
    expect(res.eligibilityResult).toEqual(
      expect.objectContaining({
        isEligible: expect.any(Boolean),
        approvalLikelihood: expect.any(Number),
        riskCategory: expect.stringMatching(/low|medium|high/),
        decisionReason: expect.any(String),
      }),
    );
    expect(res.recommendedLoan).toEqual(
      expect.objectContaining({
        maxAmount: expect.any(Number),
        recommendedAmount: expect.any(Number),
        interestRate: 12.5,
        monthlyPayment: expect.any(Number),
        totalRepayment: expect.any(Number),
      }),
    );
    expect(res.affordabilityAnalysis).toEqual(
      expect.objectContaining({ disposableIncome: 10000, debtToIncomeRatio: 20, loanToIncomeRatio: 50 }),
    );
  });

  it('approves the spec example with medium risk', () => {
    const { eligibilityResult, recommendedLoan } = evaluateEligibility(specRequest);
    expect(eligibilityResult.isEligible).toBe(true);
    expect(eligibilityResult.riskCategory).toBe('medium');
    expect(recommendedLoan.recommendedAmount).toBe(150000);
    expect(recommendedLoan.maxAmount).toBeGreaterThanOrEqual(150000);
  });

  it('rates a strong applicant as low risk with no levers needed', () => {
    const res = evaluateEligibility(
      makeRequest({
        financialInfo: { monthlyIncome: 60000, monthlyExpenses: 20000, existingDebt: 0, creditScore: 780 },
        loanDetails: { requestedAmount: 50000 },
      }),
    );
    expect(res.eligibilityResult.riskCategory).toBe('low');
    expect(res.eligibilityResult.approvalLikelihood).toBeLessThanOrEqual(97);
    expect(res.affordabilityAnalysis.affordabilityScore).toBe('excellent');
    expect(res.improvementLevers).toEqual([]);
  });

  it('declines unemployed applicants with a clear reason', () => {
    const res = evaluateEligibility(makeRequest({ personalInfo: { employmentStatus: 'unemployed' } }));
    expect(res.eligibilityResult.isEligible).toBe(false);
    expect(res.eligibilityResult.approvalLikelihood).toBeLessThanOrEqual(15);
    expect(res.eligibilityResult.decisionReason).toMatch(/regular source of income/);
  });

  it('declines when expenses exceed income', () => {
    const res = evaluateEligibility(makeRequest({ financialInfo: { monthlyIncome: 10000, monthlyExpenses: 12000, existingDebt: 0 } }));
    expect(res.eligibilityResult.isEligible).toBe(false);
    expect(res.recommendedLoan.maxAmount).toBe(0);
    expect(res.affordabilityAnalysis.affordabilityScore).toBe('poor');
  });

  it('caps the recommended amount at what is affordable', () => {
    const res = evaluateEligibility(makeRequest({ loanDetails: { requestedAmount: 300000 } }));
    expect(res.recommendedLoan.recommendedAmount).toBe(res.recommendedLoan.maxAmount);
    expect(res.recommendedLoan.recommendedAmount).toBeLessThan(300000);
  });

  it('explains the score with factors that add up to the likelihood', () => {
    const res = evaluateEligibility(specRequest);
    const total = res.factors.reduce((s, f) => s + f.points, 0);
    expect(res.factors.map((f) => f.id)).toEqual(['affordability', 'debt_load', 'credit', 'employment']);
    expect(total).toBe(res.eligibilityResult.approvalLikelihood);
  });

  it('suggests levers that genuinely improve the outcome, best first', () => {
    const res = evaluateEligibility(makeRequest({ loanDetails: { requestedAmount: 220000 } }));
    expect(res.improvementLevers.length).toBeGreaterThan(0);
    expect(res.improvementLevers.length).toBeLessThanOrEqual(3);
    const deltas = res.improvementLevers.map((l) => l.delta);
    expect(deltas).toEqual([...deltas].sort((a, b) => b - a));
    for (const lever of res.improvementLevers) {
      const applied = evaluateEligibility(
        makeRequest({
          financialInfo: lever.changes.financialInfo,
          loanDetails: { requestedAmount: 220000, ...lever.changes.loanDetails },
        }),
      );
      expect(applied.eligibilityResult.approvalLikelihood).toBe(lever.newLikelihood);
      expect(lever.newLikelihood).toBeGreaterThan(res.eligibilityResult.approvalLikelihood);
    }
  });

  it('treats an unknown credit score as neutral, not negative', () => {
    const res = evaluateEligibility(makeRequest({ financialInfo: { creditScore: null } }));
    const credit = res.factors.find((f) => f.id === 'credit')!;
    expect(credit.impact).toBe('neutral');
  });

  it('prices vehicle finance with the vehicle product', () => {
    const res = evaluateEligibility(makeRequest({ loanDetails: { loanPurpose: 'used_vehicle', requestedAmount: 120000, loanTerm: 48 } }));
    expect(res.recommendedLoan.productId).toBe('vehicle_loan');
  });
});
