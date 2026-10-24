import { api } from '../api/client';
import { toEligibilityRequest, type FormState } from '../lib/formState';
import type { EligibilityRequest, LoanProduct } from '../types';
import { useSettledQuery } from './useSettledQuery';

/**
 * A running eligibility estimate while the form is still being filled in. Until a purpose is chosen it
 * assumes the product's first one; the purpose only picks the product, so the estimate doesn't change.
 */
export function useLiveEligibility(form: FormState, product: LoanProduct | null, ready: boolean) {
  const request = toEligibilityRequest({ ...form, loanPurpose: form.loanPurpose || product?.purposes[0] || 'other' });
  const { data } = useSettledQuery(ready ? JSON.stringify(request) : null, (key, signal) =>
    api.eligibility(JSON.parse(key) as EligibilityRequest, signal),
  );
  return ready ? data : null;
}
