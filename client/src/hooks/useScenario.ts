import { useState } from 'react';
import { api } from '../api/client';
import type { EligibilityRequest, EligibilityResponse, ImprovementLever, LoanProduct } from '../types';
import { useSettledQuery } from './useSettledQuery';

async function fetchScenario(request: EligibilityRequest, loanType: LoanProduct['id'], signal: AbortSignal) {
  const { requestedAmount: loanAmount, loanTerm } = request.loanDetails;
  const [eligibility, rate] = await Promise.all([
    api.eligibility(request, signal),
    api.calculateRate({ loanAmount, loanTerm, loanType, creditScore: request.financialInfo.creditScore }, signal),
  ]);
  return { eligibility, rate };
}

/**
 * The what-if sandbox on the results page: the scenario being explored and its re-run result.
 * The original result shows until the first re-run comes back.
 */
export function useScenario(initialRequest: EligibilityRequest, initialResult: EligibilityResponse, product: LoanProduct) {
  const [scenario, setScenario] = useState(initialRequest);
  const key = JSON.stringify(scenario);
  const { data, error, pending } = useSettledQuery(key, (k, signal) => fetchScenario(JSON.parse(k), product.id, signal));

  const setLoan = (patch: Partial<EligibilityRequest['loanDetails']>) =>
    setScenario((s) => ({ ...s, loanDetails: { ...s.loanDetails, ...patch } }));

  const applyLever = ({ changes }: ImprovementLever) =>
    setScenario((s) => ({
      ...s,
      financialInfo: { ...s.financialInfo, ...changes.financialInfo },
      loanDetails: { ...s.loanDetails, ...changes.loanDetails },
    }));

  return {
    scenario,
    key,
    setScenario,
    setLoan,
    applyLever,
    reset: () => setScenario(initialRequest),
    isModified: key !== JSON.stringify(initialRequest),
    result: data?.eligibility ?? initialResult,
    rate: data?.rate ?? null,
    error,
    updating: pending,
  };
}
