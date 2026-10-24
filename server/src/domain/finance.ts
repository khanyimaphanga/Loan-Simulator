import { getProduct } from './products.js';
import type { PaymentRow, ProductId } from './types.js';

export const roundCents = (n: number) => Math.round(n * 100) / 100;

/**
 * Where a credit score sits within a product's rate range (0 = best rate, 1 = worst).
 * Unknown scores get a neutral mid-range assumption rather than a penalty.
 */
export function creditRatePosition(creditScore?: number | null): number {
  if (creditScore == null) return 0.5;
  if (creditScore >= 750) return 0;
  if (creditScore >= 700) return 0.125;
  if (creditScore >= 650) return 0.25;
  if (creditScore >= 600) return 0.5;
  if (creditScore >= 550) return 0.75;
  return 1;
}

/** Annual interest rate (%) for a product, priced on credit risk plus a small premium for long terms. */
export function interestRateFor(productId: ProductId, creditScore: number | null | undefined, term: number): number {
  const product = getProduct(productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const { min, max } = product.interestRateRange;
  const termPremium = term > 48 ? 0.5 : term > 24 ? 0.25 : 0;
  const rate = min + (max - min) * creditRatePosition(creditScore) + termPremium;
  return roundCents(Math.min(rate, max));
}

/** Standard amortising instalment: P·r / (1 − (1 + r)^−n). */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return roundCents(principal / months);
  return roundCents((principal * r) / (1 - Math.pow(1 + r, -months)));
}

/** Inverse of monthlyPayment: how much principal a given instalment can service. */
export function principalForPayment(payment: number, annualRatePct: number, months: number): number {
  if (payment <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return payment * months;
  return (payment * (1 - Math.pow(1 + r, -months))) / r;
}

export function amortisationSchedule(principal: number, annualRatePct: number, months: number): PaymentRow[] {
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, months);
  const rows: PaymentRow[] = [];
  let balance = principal;

  for (let month = 1; month <= months; month++) {
    const interest = roundCents(balance * r);
    // Final instalment absorbs rounding drift so the balance lands exactly on zero.
    const isLast = month === months;
    const principalPart = isLast ? roundCents(balance) : roundCents(payment - interest);
    balance = roundCents(balance - principalPart);
    rows.push({
      month,
      payment: roundCents(principalPart + interest),
      principal: principalPart,
      interest,
      balance: Math.max(balance, 0),
    });
  }
  return rows;
}
