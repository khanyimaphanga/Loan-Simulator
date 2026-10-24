import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { eligibilityRequest, eligibilityResponse, mockApi, products, rateResponse, stubCanvas } from '../../test/fixtures';
import { ResultsView } from './ResultsView';
import { BudgetBreakdown } from './BudgetBreakdown';
import { FactorList } from './FactorList';
import { LeverList } from './LeverList';
import { LikelihoodGauge } from './LikelihoodGauge';
import { RepaymentChart } from './RepaymentChart';


describe('LikelihoodGauge', () => {
  it('announces likelihood with a text status, never colour alone', () => {
    render(<LikelihoodGauge likelihood={82} risk="low" />);
    expect(screen.getByRole('img', { name: 'Approval likelihood 82%: Strong chance' })).toBeInTheDocument();
    expect(screen.getByText('Strong chance')).toBeInTheDocument();
  });
});

describe('BudgetBreakdown', () => {
  it('lists every slice of income with values', () => {
    render(<BudgetBreakdown request={eligibilityRequest} analysis={eligibilityResponse().affordabilityAnalysis} />);
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(rows).toEqual([
      'Living costsR 10 00040%',
      'Existing debtR 5 00020%',
      'This loanR 7 09628%',
      'Left overR 2 90412%',
    ]);
  });

  it('flags a shortfall when the loan does not fit', () => {
    const analysis = { ...eligibilityResponse().affordabilityAnalysis, newRepayment: 12000, remainingAfterLoan: -2000 };
    render(<BudgetBreakdown request={eligibilityRequest} analysis={analysis} />);
    expect(screen.getByText('Shortfall')).toBeInTheDocument();
  });
});

describe('FactorList', () => {
  it('exposes each factor as an accessible meter', () => {
    render(<FactorList factors={eligibilityResponse().factors} />);
    const meter = screen.getByRole('meter', { name: 'Credit profile score' });
    expect(meter).toHaveAttribute('aria-valuetext', '18 of 25 points');
    expect(screen.getAllByText('Helping')).toHaveLength(2);
  });
});

describe('LeverList', () => {
  it('lets the user try a lever', async () => {
    const onApply = vi.fn();
    const { improvementLevers } = eligibilityResponse();
    render(<LeverList levers={improvementLevers} onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: /Try this.*Borrow R 110 000/ }));
    expect(onApply).toHaveBeenCalledWith(improvementLevers[0]);
  });
});

describe('RepaymentChart', () => {
  it('reveals month details with the keyboard', async () => {
    render(<RepaymentChart schedule={rateResponse.paymentSchedule} />);
    const chart = screen.getByRole('img', { name: /Bar chart of 24 monthly repayments/ });
    chart.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('Month 2');
  });

  it('offers a full table view', async () => {
    render(<RepaymentChart schedule={rateResponse.paymentSchedule} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show table' }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(25);
  });
});

const renderResults = (result = eligibilityResponse()) =>
  render(<ResultsView initialRequest={eligibilityRequest} initialResult={result} product={products[0]} onEdit={() => {}} onRestart={() => {}} />);

describe('ResultsView celebration', () => {
  it('throws confetti for good news, and not for a "not yet"', () => {
    stubCanvas();
    mockApi();
    const good = renderResults();
    expect(document.querySelector('.confetti')).not.toBeNull();
    good.unmount();

    const notYet = eligibilityResponse({ isEligible: false, approvalLikelihood: 40, riskCategory: 'high' });
    renderResults(notYet);
    expect(document.querySelector('.confetti')).toBeNull();
  });
});

describe('Applying (the call to action)', () => {
  it('offers a specific Apply action next to the offer, leading to a review and an honest next step', async () => {
    mockApi();
    const user = userEvent.setup();
    renderResults();

    await user.click(screen.getByRole('button', { name: 'Apply for R 150 000' }));
    const dialog = screen.getByRole('dialog', { name: 'Apply for your loan' });
    expect(dialog).toHaveTextContent('R 7 096 a month for 2 years');
    expect(dialog).toHaveTextContent('What happens next');
    expect(dialog).toHaveTextContent("You've ticked off 0 of 4");

    await user.click(within(dialog).getByRole('button', { name: 'Start my application' }));
    expect(screen.getByRole('dialog', { name: "You're on your way" })).toHaveTextContent('nothing has been submitted');
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has no Apply action when the result is a "not yet"', () => {
    mockApi();
    renderResults(eligibilityResponse({ isEligible: false, approvalLikelihood: 40, riskCategory: 'high' }));
    expect(screen.queryByRole('button', { name: /Apply/ })).not.toBeInTheDocument();
  });

  it('keeps Apply one tap away in a sticky bar once the main button scrolls out of view', () => {
    mockApi();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private cb: IntersectionObserverCallback) {}
        observe() {
          this.cb([{ isIntersecting: false } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
        disconnect() {}
      },
    );
    renderResults();
    const bar = screen.getByRole('region', { name: 'Apply for this loan' });
    expect(within(bar).getByRole('button', { name: 'Apply now' })).toBeInTheDocument();
  });

  it('offers to apply once every document on the checklist is ticked', async () => {
    mockApi();
    const user = userEvent.setup();
    renderResults();
    const checklist = screen.getByRole('region', { name: 'Get ready to apply' });
    for (const box of within(checklist).getAllByRole('checkbox')) await user.click(box);

    await user.click(within(checklist).getByRole('button', { name: 'Apply now' }));
    expect(screen.getByRole('dialog', { name: 'Apply for your loan' })).toHaveTextContent("You've got everything ready.");
  });
});
