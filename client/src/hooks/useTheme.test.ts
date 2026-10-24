import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { readStored, STORAGE_KEYS } from '../lib/storage';
import { useTheme } from './useTheme';

/** A controllable prefers-color-scheme query, so tests can flip the OS setting mid-session. */
function stubSystemTheme(dark: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  const original = window.matchMedia;
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia;
  return {
    set(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => fn());
    },
    restore: () => (window.matchMedia = original),
  };
}

describe('useTheme', () => {
  let system: ReturnType<typeof stubSystemTheme>;
  afterEach(() => system.restore());

  it('follows the operating system and does not pin that default', () => {
    system = stubSystemTheme(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(readStored('local', STORAGE_KEYS.theme)).toBeNull();

    act(() => system.set(true));
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('remembers an explicit toggle over the system setting', () => {
    system = stubSystemTheme(true);
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(readStored('local', STORAGE_KEYS.theme)).toBe('light');

    act(() => system.set(false));
    act(() => system.set(true));
    expect(result.current.theme).toBe('light');
  });
});
