import { Router } from 'express';
import { evaluateEligibility } from '../domain/eligibility.js';
import { amortisationSchedule, interestRateFor, roundCents } from '../domain/finance.js';
import { products } from '../domain/products.js';
import type { EligibilityRequest, RateRequest, RateResponse } from '../domain/types.js';
import { validateEligibilityRequest, validateRateRequest } from '../domain/validate.js';
import { validationRules } from '../domain/validationRules.js';

export const loansRouter = Router();

loansRouter.get('/products', (_req, res) => {
  res.json({ products });
});

loansRouter.get('/validation-rules', (_req, res) => {
  res.json(validationRules);
});

loansRouter.post('/eligibility', (req, res) => {
  const errors = validateEligibilityRequest(req.body);
  if (Object.keys(errors).length) {
    res.status(422).json({ error: 'validation_failed', errors });
    return;
  }
  res.json(evaluateEligibility(req.body as EligibilityRequest));
});

loansRouter.post('/calculate-rate', (req, res) => {
  const errors = validateRateRequest(req.body);
  if (Object.keys(errors).length) {
    res.status(422).json({ error: 'validation_failed', errors });
    return;
  }
  const { loanAmount, loanTerm, creditScore, loanType } = req.body as RateRequest;
  const interestRate = interestRateFor(loanType, creditScore, loanTerm);
  const paymentSchedule = amortisationSchedule(loanAmount, interestRate, loanTerm);
  const totalRepayment = roundCents(paymentSchedule.reduce((sum, row) => sum + row.payment, 0));

  const body: RateResponse = {
    interestRate,
    monthlyPayment: paymentSchedule[0]?.payment ?? 0,
    totalInterest: roundCents(totalRepayment - loanAmount),
    totalRepayment,
    paymentSchedule,
  };
  res.json(body);
});
