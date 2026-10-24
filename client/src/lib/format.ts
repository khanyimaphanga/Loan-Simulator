import type { LoanProduct } from '../types';

const randFormatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });
const randCentsFormatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 });

/** R 12 500, the South African convention. Normalised to plain spaces so output is predictable in tests and copy. */
const normalise = (s: string) => s.replace(/ | /g, ' ').replace(/^R\s?/, 'R ');

export const formatRand = (n: number) => normalise(randFormatter.format(Math.round(n)));
export const formatRandCents = (n: number) => normalise(randCentsFormatter.format(n));

export const formatPercent = (n: number, digits = 1) => `${n.toFixed(digits).replace(/\.0+$/, '')}%`;

export function formatMonths(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = `${years} year${years === 1 ? '' : 's'}`;
  return rest ? `${y} ${rest} month${rest === 1 ? '' : 's'}` : y;
}

export const toNumber = (raw: string): number | undefined => (raw.trim() === '' ? undefined : Number(raw));

/** "Personal Loan: R 5 000 to R 300 000, from 10.5% a year." */
export function describeProduct({ name, minAmount, maxAmount, interestRateRange }: LoanProduct) {
  return `${name}: ${formatRand(minAmount)} to ${formatRand(maxAmount)}, from ${formatPercent(interestRateRange.min)} a year.`;
}
