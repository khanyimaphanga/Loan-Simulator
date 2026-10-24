import { Button } from '@capitec/design-system';
import { formatMonths, formatRand } from '../../lib/format';
import type { EligibilityResponse } from '../../types';

interface ApplyBarProps {
  loan: EligibilityResponse['recommendedLoan'];
  term: number;
  onApply: () => void;
}

/** Keeps Apply one tap away further down the page. Only rendered while the offer's own button is off screen. */
export function ApplyBar({ loan, term, onApply }: ApplyBarProps) {
  return (
    <div className="apply-bar" role="region" aria-label="Apply for this loan">
      <div className="apply-bar__inner container">
        <p className="apply-bar__summary">
          <strong>{formatRand(loan.recommendedAmount)}</strong>
          <span>
            {formatRand(loan.monthlyPayment)}/month · {formatMonths(term)}
          </span>
        </p>
        <Button iconEnd="arrowRight" onClick={onApply}>
          Apply now
        </Button>
      </div>
    </div>
  );
}
