import { useEffect, useState } from 'react';
import { readStored, STORAGE_KEYS, writeStored } from '../lib/storage';
import { tokens } from '../styles/tokens';

type Theme = 'light' | 'dark';

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

/** The theme the visitor explicitly picked with the toggle, if any. */
function savedTheme(): Theme | null {
  const saved = readStored<string>('local', STORAGE_KEYS.theme);
  return saved === 'light' || saved === 'dark' ? saved : null;
}

const systemTheme = (): Theme => (darkQuery()?.matches ? 'dark' : 'light');

/**
 * Follows the operating system until the visitor presses the toggle; only that explicit
 * choice is remembered, so a later OS switch to dark mode isn't masked by a stale default.
 */
export function useTheme() {
  const [choice, setChoice] = useState<Theme | null>(savedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme = choice ?? system;

  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const onChange = () => setSystem(query.matches ? 'dark' : 'light');
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens[theme]['color.surface']);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setChoice(next);
    writeStored('local', STORAGE_KEYS.theme, next);
  };

  return { theme, toggleTheme };
}
