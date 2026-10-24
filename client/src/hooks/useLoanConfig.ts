import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { LoanProduct, ValidationRules } from '../types';

type ConfigState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: LoanProduct[]; rules: ValidationRules };

/** Loads products + validation rules once; the form is driven entirely by this server config. */
export function useLoanConfig() {
  const [state, setState] = useState<ConfigState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    Promise.all([api.products(), api.validationRules()])
      .then(([products, rules]) => active && setState({ status: 'ready', products, rules }))
      .catch((err: Error) => active && setState({ status: 'error', message: err.message }));
    return () => {
      active = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
