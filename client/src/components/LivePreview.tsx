import { Card, Icon, StatList } from '@capitec/design-system';
import { api } from '../api/client';
import { useSettledQuery } from '../hooks/useSettledQuery';
import { formatPercent, formatRand } from '../lib/format';
import { creditScoreFor, type FormState } from '../lib/formState';
import type { EligibilityResponse, LoanProduct, RateRequest } from '../types';
import { LiveChance } from './LiveChance';

interface LivePreviewProps {
  form: FormState;
  product: LoanProduct;
  /** Running eligibility estimate; null until the first two steps are complete. */
  live: EligibilityResponse | null;
  /** True once the first two steps are complete, even before the first estimate arrives. */
  chanceUnlocked: boolean;
}

/** Instant repayment estimate that follows the user through the form, so the result never comes as a surprise. */
export function LivePreview({ form, product, live, chanceUnlocked }: LivePreviewProps) {
  const inRange = form.requestedAmount >= product.minAmount && form.requestedAmount <= product.maxAmount;
  const creditScore = creditScoreFor(form.creditBand);
  const query: RateRequest = { loanAmount: form.requestedAmount, loanTerm: form.loanTerm, loanType: product.id, creditScore };
  // Best-effort: a failed preview just stays empty, and the real submission reports errors.
  const { data: quote } = useSettledQuery(
    inRange ? JSON.stringify(query) : null,
    (key, signal) => api.calculateRate(JSON.parse(key) as RateRequest, signal),
    250,
  );

  const leftOver =
    form.monthlyIncome && form.monthlyExpenses && quote
      ? Number(form.monthlyIncome) - Number(form.monthlyExpenses) - quote.monthlyPayment
      : null;

  return (
    <Card as="aside" className="preview" aria-labelledby="preview-title">
      <LiveChance live={live} unlocked={chanceUnlocked} />
      <p className="eyebrow" id="preview-title">
        Your estimate so far
      </p>
      {quote ? (
        <>
          <p className="preview__amount">
            <span className="preview__value">{formatRand(quote.monthlyPayment)}</span>
            <span className="preview__unit">/month</span>
          </p>
          <p className="preview__meta">
            {formatRand(form.requestedAmount)} over {form.loanTerm} months at about {formatPercent(quote.interestRate, 2)}
          </p>
          <StatList
            items={[
              { label: 'Total interest', value: formatRand(quote.totalInterest) },
              { label: "Total you'd repay", value: formatRand(quote.totalRepayment) },
              leftOver != null && {
                label: 'Left over each month',
                value: <span className={leftOver < 0 ? 'text-danger' : undefined}>{formatRand(leftOver)}</span>,
              },
            ]}
          />
          <p className="preview__note">
            <Icon name="info" size={16} />
            {creditScore ? 'Rate based on your credit band.' : 'Rate assumes an average credit score.'}
          </p>
        </>
      ) : (
        <p className="preview__empty">Choose an amount to see your estimated repayment.</p>
      )}
    </Card>
  );
}
