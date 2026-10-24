/** Every key the app keeps in browser storage. Session keys hold financial answers, so they go when the tab closes. */
export const STORAGE_KEYS = {
  form: 'loan-sim:form',
  saved: 'loan-sim:saved',
  checklist: 'loan-sim:checklist',
  theme: 'loan-sim:theme',
} as const;

type Store = 'local' | 'session';

// Storage can throw (private mode, blocked cookies), so every access goes through these and fails quietly.
const store = (type: Store) => (type === 'local' ? localStorage : sessionStorage);

export function readStored<T>(type: Store, key: string): T | null {
  try {
    const raw = store(type).getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeStored(type: Store, key: string, value: unknown) {
  try {
    store(type).setItem(key, JSON.stringify(value));
  } catch {
    // Not fatal: state still works in memory for this visit.
  }
}

export function clearStored(type: Store, ...keys: string[]) {
  try {
    for (const key of keys) store(type).removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
