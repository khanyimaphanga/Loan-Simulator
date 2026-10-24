import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { callsTo, eligibilityResponse, mockApi } from './test/fixtures';

async function completeAboutYou(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('How old are you?'), '35');
  await user.click(screen.getByRole('radio', { name: /Employed/ }));
  fireEvent.change(screen.getByRole('slider', { name: 'How long have you been with your employer?' }), { target: { value: '24' } });
  await user.click(screen.getByRole('button', { name: /Continue/ }));
}

async function completeMoney(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Monthly take-home income'), '25000');
  await user.type(screen.getByLabelText('Total monthly expenses'), '15000');
  await user.type(screen.getByLabelText(/how much goes to debt/), '5000');
  await user.click(screen.getByRole('radio', { name: /^Good/ }));
  await user.click(screen.getByRole('button', { name: /Continue/ }));
}

describe('Loan simulator flow', () => {
  it('walks through all three steps and shows an explained result', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    render(<App />);

    await completeAboutYou(user);
    expect(await screen.findByRole('heading', { name: 'Your monthly budget' })).toHaveFocus();

    await completeMoney(user);
    expect(await screen.findByRole('heading', { name: 'What would you like to borrow?' })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Home improvement' }));
    await user.click(screen.getByRole('button', { name: /Check my eligibility/ }));

    expect(await screen.findByRole('heading', { name: /you're likely to qualify/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Approval likelihood 64%/ })).toBeInTheDocument();
    expect(screen.getByText('Why you got this result')).toBeInTheDocument();

    // Earlier calls are the live estimate; the last one is the submission.
    expect(callsTo(fetchMock, '/eligibility').at(-1)).toEqual({
      personalInfo: { age: 35, employmentStatus: 'employed', employmentDuration: 24 },
      financialInfo: { monthlyIncome: 25000, monthlyExpenses: 15000, existingDebt: 5000, creditScore: 700 },
      loanDetails: { requestedAmount: 50000, loanTerm: 24, loanPurpose: 'home_improvement' },
    });
  });

  it('blocks progress with inline errors and focuses the first invalid field', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByLabelText('How old are you?'), '16');
    await user.click(screen.getByRole('button', { name: /Continue/ }));

    expect(screen.getByText('Age must be between 18 and 65')).toBeInTheDocument();
    expect(screen.getByText('Please select your employment status')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('How old are you?')).toHaveFocus());
    expect(screen.getByRole('heading', { name: 'First, a little about you' })).toBeInTheDocument();
  });

  it('clears an error as soon as the field is corrected', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: /Continue/ }));
    expect(screen.getByText('Age must be between 18 and 65')).toBeInTheDocument();
    await user.type(screen.getByLabelText('How old are you?'), '3');
    expect(screen.queryByText('Age must be between 18 and 65')).not.toBeInTheDocument();
  });

  it('shows what is left over as soon as income and expenses are known', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await completeAboutYou(user);
    await user.type(await screen.findByLabelText('Monthly take-home income'), '25000');
    await user.type(screen.getByLabelText('Total monthly expenses'), '15000');
    expect(screen.getByRole('status')).toHaveTextContent('You have R 10 000 left each month');
  });

  it('routes server validation errors back to the right step', async () => {
    mockApi({
      eligibility: () => ({ status: 422, body: { errors: { 'financialInfo.monthlyIncome': 'Minimum monthly income of R5,000 required' } } }),
    });
    const user = userEvent.setup();
    render(<App />);
    await completeAboutYou(user);
    await completeMoney(user);
    await user.click(await screen.findByRole('radio', { name: 'Education' }));
    await user.click(screen.getByRole('button', { name: /Check my eligibility/ }));

    expect(await screen.findByText('Minimum monthly income of R5,000 required')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your monthly budget' })).toBeInTheDocument();
  });

  it('re-runs the simulation when a "boost your chances" lever is tried', async () => {
    const fetchMock = mockApi({
      eligibility: (body) => {
        const amount = (body as { loanDetails: { requestedAmount: number } }).loanDetails.requestedAmount;
        return { body: amount === 110000 ? eligibilityResponse({ approvalLikelihood: 76, riskCategory: 'low' }) : eligibilityResponse() };
      },
    });
    const user = userEvent.setup();
    render(<App />);
    await completeAboutYou(user);
    await completeMoney(user);
    await user.click(await screen.findByRole('radio', { name: 'Medical' }));
    await user.click(screen.getByRole('button', { name: /Check my eligibility/ }));

    await user.click(await screen.findByRole('button', { name: /Try this.*Borrow R 110 000/ }));

    expect(await screen.findByRole('img', { name: /Approval likelihood 76%: Strong chance/ }, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText(/\+12% vs your original/)).toBeInTheDocument();
    expect(callsTo(fetchMock, '/eligibility').at(-1).loanDetails.requestedAmount).toBe(110000);

    await user.click(screen.getByRole('button', { name: /Reset/ }));
    await waitFor(() => expect(screen.queryByText(/exploring a what-if/)).not.toBeInTheDocument());
  });

  it('shows a retry when the API is unreachable', async () => {
    const { vi } = await import('vitest');
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('offline'))));
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't reach the simulator");
    mockApi();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('How old are you?')).toBeInTheDocument();
  });

  it('remembers progress for the session', async () => {
    mockApi();
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(await screen.findByLabelText('How old are you?'), '41');
    unmount();
    render(<App />);
    expect(await screen.findByLabelText('How old are you?')).toHaveValue('41');
  });
});

async function reachResults(user: ReturnType<typeof userEvent.setup>) {
  await completeAboutYou(user);
  await completeMoney(user);
  await user.click(await screen.findByRole('radio', { name: 'Home improvement' }));
  await user.click(screen.getByRole('button', { name: /Check my eligibility/ }));
  await screen.findByRole('heading', { level: 1 });
}

describe('Staying in the loop', () => {
  it('unlocks a live chance estimate once the money step is done', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Finish “Your money” to see your chances/)).toBeInTheDocument();

    await completeAboutYou(user);
    await completeMoney(user);

    expect(await screen.findByText(/Your budget fits a loan of up to/)).toHaveTextContent('Your budget fits a loan of up to R 158 000.');
    expect(screen.getByRole('meter', { name: 'Approval likelihood so far' })).toHaveAttribute('aria-valuenow', '64');
  });

  it('picks the loan type from the purpose and keeps the amount in range', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await completeAboutYou(user);
    await completeMoney(user);

    expect(screen.queryByRole('radio', { name: /Personal Loan/ })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('radio', { name: 'New vehicle' }));
    expect(screen.getByText(/Vehicle Finance: R 50 000 to R 1 500 000/)).toBeInTheDocument();
    expect(screen.getByLabelText('How much would you like to borrow?')).toHaveValue('50 000');
  });

  it('flags an amount over budget before submitting and offers a one-tap fix', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await completeAboutYou(user);
    await completeMoney(user);

    expect(await screen.findByText(/This fits your budget/)).toBeInTheDocument();
    const amount = screen.getByLabelText('How much would you like to borrow?');
    await user.clear(amount);
    await user.type(amount, '200000');
    expect(await screen.findByText(/R 42 000/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use R 158 000' }));
    expect(amount).toHaveValue('158 000');
  });

  it('saves options to compare and loads one back', async () => {
    mockApi({
      eligibility: (body) => {
        const amount = (body as { loanDetails: { requestedAmount: number } }).loanDetails.requestedAmount;
        return { body: amount === 110000 ? eligibilityResponse({ approvalLikelihood: 76, riskCategory: 'low' }) : eligibilityResponse() };
      },
    });
    const user = userEvent.setup();
    render(<App />);
    await reachResults(user);

    await user.click(await screen.findByRole('button', { name: 'Save this option' }));
    const compare = await screen.findByRole('region', { name: 'Compare your options' });
    expect(compare).toHaveTextContent('Option 1');
    expect(screen.getAllByRole('button', { name: 'Saved' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Try this.*Borrow R 110 000/ }));
    await screen.findByRole('img', { name: /Approval likelihood 76%/ }, { timeout: 2000 });
    await user.click(screen.getByRole('button', { name: 'Save this option' }));

    expect(await screen.findByText('Best chance')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load this option' }));
    expect(await screen.findByRole('img', { name: /Approval likelihood 64%/ }, { timeout: 2000 })).toBeInTheDocument();
  });

  it('celebrates when a what-if turns a "not yet" into a likely yes', async () => {
    mockApi({
      eligibility: (body) => {
        const amount = (body as { loanDetails: { requestedAmount: number } }).loanDetails.requestedAmount;
        return {
          body:
            amount === 110000
              ? eligibilityResponse({ approvalLikelihood: 76, riskCategory: 'low', isEligible: true })
              : eligibilityResponse({ approvalLikelihood: 46, riskCategory: 'high', isEligible: false }),
        };
      },
    });
    const user = userEvent.setup();
    render(<App />);
    await reachResults(user);

    await user.click(await screen.findByRole('button', { name: /Try this.*Borrow R 110 000/ }));
    expect(await screen.findByText(/You've found a loan you're likely to qualify for/, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it('tracks documents to get ready, tailored to employment', async () => {
    mockApi();
    const user = userEvent.setup();
    render(<App />);
    await reachResults(user);

    const checklist = screen.getByRole('region', { name: 'Get ready to apply' });
    expect(checklist).toHaveTextContent('Your latest payslip');
    await user.click(screen.getByRole('checkbox', { name: /ID book or smart ID card/ }));
    expect(checklist).toHaveTextContent('1 of 4 ready');
  });

  it('welcomes a returning customer back to the step they left off at', async () => {
    mockApi();
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await completeAboutYou(user);
    unmount();

    render(<App />);
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pick up where I left off' }));
    expect(await screen.findByRole('heading', { name: 'Your monthly budget' })).toBeInTheDocument();
  });
});
