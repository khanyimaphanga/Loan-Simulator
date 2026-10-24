import { describe, expect, it } from 'vitest';
import {
  amortisationSchedule,
  creditRatePosition,
  interestRateFor,
  monthlyPayment,
  principalForPayment,
} from '../src/domain/finance.js';

describe('interestRateFor', () => {
  it('prices the spec example (score 650, 24 months) at 12.5%', () => {
    expect(interestRateFor('personal_loan', 650, 24)).toBe(12.5);
  });

  it('gives the best rate to excellent credit and caps at the product maximum', () => {
    expect(interestRateFor('personal_loan', 800, 12)).toBe(10.5);
    expect(interestRateFor('personal_loan', 400, 60)).toBe(18.5);
  });

  it('adds a premium for longer terms', () => {
    expect(interestRateFor('personal_loan', 650, 36)).toBe(12.75);
    expect(interestRateFor('personal_loan', 650, 60)).toBe(13);
  });

  it('uses vehicle finance rate range', () => {
    expect(interestRateFor('vehicle_loan', 800, 12)).toBe(8.5);
  });

  it('assumes an average profile when no score is given', () => {
    expect(creditRatePosition(null)).toBe(0.5);
    expect(creditRatePosition(undefined)).toBe(0.5);
  });

  it('rejects unknown products', () => {
    expect(() => interestRateFor('boat_loan' as never, 700, 12)).toThrow(/Unknown product/);
  });
});

describe('monthlyPayment', () => {
  it('matches the standard amortisation formula', () => {
    expect(monthlyPayment(150000, 12.5, 24)).toBe(7096.1);
  });

  it('handles zero interest and zero principal', () => {
    expect(monthlyPayment(12000, 0, 12)).toBe(1000);
    expect(monthlyPayment(0, 12, 12)).toBe(0);
  });

  it('is the inverse of principalForPayment', () => {
    const payment = monthlyPayment(80000, 14, 36);
    expect(principalForPayment(payment, 14, 36)).toBeCloseTo(80000, -1);
  });
});

describe('amortisationSchedule', () => {
  const schedule = amortisationSchedule(150000, 12.5, 24);

  it('has one row per month and ends on a zero balance', () => {
    expect(schedule).toHaveLength(24);
    expect(schedule.at(-1)!.balance).toBe(0);
  });

  it('charges first-month interest on the full balance', () => {
    expect(schedule[0].interest).toBeCloseTo(1562.5, 2);
  });

  it('repays exactly the principal', () => {
    const principal = schedule.reduce((s, r) => s + r.principal, 0);
    expect(principal).toBeCloseTo(150000, 2);
  });

  it('shifts each payment from interest towards principal over time', () => {
    expect(schedule[10].interest).toBeLessThan(schedule[0].interest);
    expect(schedule[10].principal).toBeGreaterThan(schedule[0].principal);
  });
});
