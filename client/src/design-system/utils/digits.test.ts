import { describe, expect, it } from 'vitest';
import { formatDigits, parseDigits } from './digits';

describe('parseDigits', () => {
  it('cleans pasted currency values', () => {
    expect(parseDigits('R25,000.00')).toBe('25000');
    expect(parseDigits('25 000')).toBe('25000');
    expect(parseDigits('abc')).toBe('');
  });

  it('drops leading zeros but keeps a lone zero', () => {
    expect(parseDigits('00500')).toBe('500');
    expect(parseDigits('0')).toBe('0');
  });
});

describe('formatDigits', () => {
  it('groups thousands for display', () => {
    expect(formatDigits('25000')).toBe('25 000');
    expect(formatDigits('1500000')).toBe('1 500 000');
    expect(formatDigits('')).toBe('');
  });
});
