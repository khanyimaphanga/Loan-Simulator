import { Card, Field, Slider } from '@capitec/design-system';
import type { ReactNode } from 'react';
import { formatRand } from '../../lib/format';
import type { EligibilityRequest, EligibilityResponse, LoanProduct } from '../../types';

interface WhatIfCardProps {
  loanDetails: EligibilityRequest['loanDetails'];
  product: LoanProduct;
  /** Most that fits the budget at this term; marked on the amount slider. */
  maxAmount: number;
  analysis: EligibilityResponse['affordabilityAnalysis'];
  onChange: (patch: Partial<EligibilityRequest['loanDetails']>) => void;
  /** Spans the grid row (amount and term side by side) when there's no suggestions card beside it. */
  wide: boolean;
  actions: ReactNode;
}

export function WhatIfCard({ loanDetails, product, maxAmount, analysis, onChange, wide, actions }: WhatIfCardProps) {
  return (
    <Card
      className={wide ? 'whatif results__wide' : 'whatif'}
      title="Fine-tune your loan"
      subtitle="Drag to see how your result changes, instantly."
      actions={actions}
    >
      <div className="whatif__fields">
        <Field label="Loan amount" aside={formatRand(loanDetails.requestedAmount)}>
          {(ids) => (
            <Slider
              {...ids}
              min={product.minAmount}
              max={product.maxAmount}
              step={product.maxAmount > 500_000 ? 5000 : 1000}
              value={loanDetails.requestedAmount}
              onChange={(requestedAmount) => onChange({ requestedAmount })}
              formatValue={formatRand}
              marker={maxAmount > 0 ? maxAmount : null}
            />
          )}
        </Field>
        <Field label="Loan term" aside={`${loanDetails.loanTerm} months`}>
          {(ids) => (
            <Slider
              {...ids}
              min={product.minTerm}
              max={product.maxTerm}
              step={6}
              value={loanDetails.loanTerm}
              onChange={(loanTerm) => onChange({ loanTerm })}
              formatValue={(m) => `${m} months`}
            />
          )}
        </Field>
      </div>
      <p className="whatif__summary">
        Repayment <strong>{formatRand(analysis.newRepayment)}</strong>/month · leaves{' '}
        <strong className={analysis.remainingAfterLoan < 0 ? 'text-danger' : undefined}>{formatRand(analysis.remainingAfterLoan)}</strong>
      </p>
    </Card>
  );
}
