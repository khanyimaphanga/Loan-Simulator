import { Button, Callout, Card, Icon, StatList } from '@capitec/design-system';
import type { Ref } from 'react';
import { formatMonths, formatPercent, formatRand } from '../../lib/format';
import type { EligibilityResponse } from '../../types';

interface OfferCardProps {
  loan: EligibilityResponse['recommendedLoan'];
  requested: number;
  term: number;
  canApply: boolean;
  onApply: () => void;
  onUseMax: () => void;
  /** Watched so the sticky apply bar only shows once this button scrolls away. */
  ctaRef: Ref<HTMLDivElement>;
}

/** The recommended loan, plus the page's primary Apply button when the result is eligible. */
export function OfferCard({ loan, requested, term, canApply, onApply, onUseMax, ctaRef }: OfferCardProps) {
  return (
    <Card className="offer" aria-labelledby="offer-title">
      <p className="eyebrow" id="offer-title">
        Recommended loan
      </p>
      {loan.recommendedAmount > 0 ? (
        <>
          <p className="offer__amount">{formatRand(loan.recommendedAmount)}</p>
          <p className="offer__payment">
            <strong>{formatRand(loan.monthlyPayment)}</strong> a month for {formatMonths(term)}
          </p>
          <StatList
            items={[
              { label: 'Interest rate', value: formatPercent(loan.interestRate, 2) },
              { label: 'Total repayment', value: formatRand(loan.totalRepayment) },
              { label: 'Most you could borrow', value: formatRand(loan.maxAmount) },
            ]}
          />
          {requested > loan.maxAmount && (
            <Callout tone="info">
              You asked for {formatRand(requested)}, but {formatRand(loan.maxAmount)} is what fits your budget.{' '}
              <Button variant="link" onClick={onUseMax}>
                Use {formatRand(loan.maxAmount)}
              </Button>
            </Callout>
          )}
          {canApply && (
            <div className="offer__cta" ref={ctaRef}>
              <Button size="lg" iconEnd="arrowRight" className="offer__apply" onClick={onApply}>
                Apply for {formatRand(loan.recommendedAmount)}
              </Button>
              <ul className="offer__assurances">
                <li>
                  <Icon name="check" size={16} /> Your answers carry over
                </li>
                <li>
                  <Icon name="check" size={16} /> Review your final offer before you accept
                </li>
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="offer__empty">
          Based on your current budget we can't recommend an amount yet. The suggestions below show what would change that.
        </p>
      )}
    </Card>
  );
}
