import { useEffect, useState } from 'react';
import { readStored, writeStored } from '../lib/storage';

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * useState that survives a refresh within the tab. sessionStorage (not localStorage) on purpose:
 * financial details are cleared when the tab closes.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = readStored<T>('session', key);
    if (stored == null) return initial;
    // Merge objects over the defaults so fields added since the last visit still get a value.
    return isPlainObject(initial) && isPlainObject(stored) ? { ...initial, ...stored } : stored;
  });

  useEffect(() => writeStored('session', key, value), [key, value]);

  return [value, setValue] as const;
}
