import { describe, expect, it } from 'vitest';
import { formatMonths, formatPercent, formatRand } from './format';

describe('formatRand', () => {
  it('uses South African grouping with plain spaces', () => {
    expect(formatRand(150000)).toBe('R 150 000');
    expect(formatRand(7096.1)).toBe('R 7 096');
  });
});

describe('formatMonths', () => {
  it('speaks in years and months', () => {
    expect(formatMonths(1)).toBe('1 month');
    expect(formatMonths(12)).toBe('1 year');
    expect(formatMonths(30)).toBe('2 years 6 months');
  });
});

describe('formatPercent', () => {
  it('trims needless decimals', () => {
    expect(formatPercent(12.5)).toBe('12.5%');
    expect(formatPercent(20)).toBe('20%');
    expect(formatPercent(12.75, 2)).toBe('12.75%');
  });
});
