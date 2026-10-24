import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { specRequest } from './fixtures.js';

const app = createApp();

describe('GET /api/loans/products', () => {
  it('lists personal and vehicle products', async () => {
    const res = await request(app).get('/api/loans/products').expect(200);
    expect(res.body.products.map((p: { id: string }) => p.id)).toEqual(['personal_loan', 'vehicle_loan']);
  });
});

describe('GET /api/loans/validation-rules', () => {
  it('returns the rule set from the spec', async () => {
    const res = await request(app).get('/api/loans/validation-rules').expect(200);
    expect(res.body.personalInfo.age).toMatchObject({ min: 18, max: 65, required: true });
    expect(res.body.loanDetails.loanTerm).toMatchObject({ min: 6, max: 60 });
  });
});

describe('POST /api/loans/eligibility', () => {
  it('evaluates a valid application', async () => {
    const res = await request(app).post('/api/loans/eligibility').send(specRequest).expect(200);
    expect(res.body.eligibilityResult.isEligible).toBe(true);
    expect(res.body.recommendedLoan.interestRate).toBe(12.5);
  });

  it('returns 422 with field errors for invalid input', async () => {
    const res = await request(app)
      .post('/api/loans/eligibility')
      .send({ ...specRequest, personalInfo: { ...specRequest.personalInfo, age: 70 } })
      .expect(422);
    expect(res.body.errors['personalInfo.age']).toBe('Age must be between 18 and 65');
  });

  it('returns 400 for malformed JSON', async () => {
    await request(app).post('/api/loans/eligibility').set('Content-Type', 'application/json').send('{bad').expect(400);
  });
});

describe('POST /api/loans/calculate-rate', () => {
  it('returns a full amortisation schedule', async () => {
    const res = await request(app)
      .post('/api/loans/calculate-rate')
      .send({ loanAmount: 150000, loanTerm: 24, creditScore: 650, loanType: 'personal_loan' })
      .expect(200);
    expect(res.body.interestRate).toBe(12.5);
    expect(res.body.paymentSchedule).toHaveLength(24);
    expect(res.body.totalRepayment).toBeCloseTo(res.body.totalInterest + 150000, 2);
  });

  it('rejects out-of-range amounts', async () => {
    await request(app)
      .post('/api/loans/calculate-rate')
      .send({ loanAmount: 1000, loanTerm: 24, loanType: 'personal_loan' })
      .expect(422);
  });
});

it('returns JSON 404 for unknown API routes', async () => {
  const res = await request(app).get('/api/nope').expect(404);
  expect(res.body.error).toBe('not_found');
});
