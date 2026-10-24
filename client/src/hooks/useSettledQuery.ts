import { useEffect, useRef, useState } from 'react';
import { isAbortError } from '../api/client';
import { useDebouncedValue } from './useDebouncedValue';

interface QueryState<T> {
  data: T | null;
  error: string | null;
}

/**
 * Fetches for `key` once it has stopped changing for `delay` ms, cancelling any request a newer key replaces.
 * The key is a string (usually JSON) so an equal-but-new object doesn't refetch; `null` means "nothing to fetch".
 * The last good data is kept while a newer request is in flight, so the UI doesn't flicker.
 */
export function useSettledQuery<T>(key: string | null, fetcher: (key: string, signal: AbortSignal) => Promise<T>, delay = 300) {
  const settledKey = useDebouncedValue(key, delay);
  const [state, setState] = useState<QueryState<T>>({ data: null, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (settledKey == null) {
      setState({ data: null, error: null });
      return;
    }
    const controller = new AbortController();
    fetcherRef
      .current(settledKey, controller.signal)
      .then((data) => setState({ data, error: null }))
      .catch((err: Error) => {
        if (!isAbortError(err)) setState((s) => ({ ...s, error: err.message }));
      });
    return () => controller.abort();
  }, [settledKey]);

  return { ...state, pending: key !== settledKey };
}
