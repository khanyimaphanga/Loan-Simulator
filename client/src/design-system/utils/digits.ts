const groupFormatter = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** Thousands-grouped digits for numeric inputs: "25000" -> "25 000" (plain spaces, South African style). */
export const formatDigits = (raw: string) => (raw === '' ? '' : groupFormatter.format(Number(raw)).replace(/\s/g, ' '));

/** Strips anything that isn't a digit so pasted values like "R25,000.00" become "25000". */
export function parseDigits(input: string): string {
  const [whole] = input.split('.');
  return whole.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 9);
}
