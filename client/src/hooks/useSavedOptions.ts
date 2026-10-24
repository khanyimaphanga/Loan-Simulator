import { STORAGE_KEYS } from '../lib/storage';
import type { EligibilityRequest, EligibilityResponse, RateResponse, RiskCategory } from '../types';
import { useSessionState } from './useSessionState';

export interface SavedOption {
  id: string;
  request: EligibilityRequest;
  likelihood: number;
  risk: RiskCategory;
  monthly: number;
  totalRepayment: number;
}

export const MAX_SAVED = 3;

/** What-ifs saved for side-by-side comparison, kept for the session. */
export function useSavedOptions(scenarioKey: string) {
  const [saved, setSaved] = useSessionState<SavedOption[]>(STORAGE_KEYS.saved, []);
  const current = saved.find((o) => JSON.stringify(o.request) === scenarioKey) ?? null;

  const save = (request: EligibilityRequest, result: EligibilityResponse, rate: RateResponse) =>
    setSaved((list) => [
      ...list,
      {
        id: `${Date.now().toString(36)}-${list.length}`,
        request,
        likelihood: result.eligibilityResult.approvalLikelihood,
        risk: result.eligibilityResult.riskCategory,
        monthly: result.affordabilityAnalysis.newRepayment,
        totalRepayment: rate.totalRepayment,
      },
    ]);

  return {
    saved,
    current,
    isFull: saved.length >= MAX_SAVED,
    save,
    remove: (id: string) => setSaved((list) => list.filter((o) => o.id !== id)),
  };
}
