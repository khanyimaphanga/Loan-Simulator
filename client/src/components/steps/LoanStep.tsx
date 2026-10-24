import { Button, Callout, ChoiceGroup, CurrencyInput, Field, Slider } from '@capitec/design-system';
import { PURPOSE_LABELS } from '../../lib/formState';
import { describeProduct, formatMonths, formatRand } from '../../lib/format';
import type { EligibilityResponse, LoanProduct, LoanPurpose } from '../../types';
import type { StepProps } from './types';

interface LoanStepProps extends StepProps {
  products: LoanProduct[];
  product: LoanProduct;
  onPurposeChange: (purpose: LoanPurpose) => void;
  /** Running estimate from the first two steps; drives the "fits your budget" guidance. */
  live: EligibilityResponse | null;
}

export function LoanStep({ form, errors, update, products, product, onPurposeChange, live }: LoanStepProps) {
  const amountStep = product.maxAmount > 500_000 ? 5000 : 1000;
  const purposes = products.flatMap((p) => p.purposes);
  const maxAmount = live?.recommendedLoan.maxAmount ?? null;

  return (
    <div className="step-fields">
      <ChoiceGroup<LoanPurpose>
        legend="What's it for?"
        hint={form.loanPurpose ? describeProduct(product) : "We'll match you with the right kind of loan."}
        variant="chips"
        options={purposes.map((value) => ({ value, label: PURPOSE_LABELS[value] }))}
        value={form.loanPurpose}
        onChange={onPurposeChange}
        error={errors.loanPurpose}
      />

      <Field label="How much would you like to borrow?" error={errors.requestedAmount}>
        {(ids) => (
          <div className="amount-control">
            <CurrencyInput
              {...ids}
              value={String(form.requestedAmount)}
              onChange={(digits) => update({ requestedAmount: Number(digits || 0) })}
              suffix=""
            />
            <Slider
              label="Loan amount"
              min={product.minAmount}
              max={product.maxAmount}
              step={amountStep}
              value={Math.min(product.maxAmount, Math.max(product.minAmount, form.requestedAmount))}
              onChange={(requestedAmount) => update({ requestedAmount })}
              formatValue={formatRand}
              marker={maxAmount && maxAmount > 0 ? maxAmount : null}
            />
          </div>
        )}
      </Field>

      {maxAmount != null && (
        <BudgetFit
          requested={form.requestedAmount}
          maxAmount={maxAmount}
          term={form.loanTerm}
          onUseMax={() => update({ requestedAmount: maxAmount })}
        />
      )}

      <Field
        label="Over how long?"
        aside={`${form.loanTerm} months`}
        hint={form.loanTerm >= 12 ? `That's ${formatMonths(form.loanTerm)}.` : undefined}
      >
        {(ids) => (
          <Slider
            {...ids}
            min={product.minTerm}
            max={product.maxTerm}
            step={6}
            value={form.loanTerm}
            onChange={(loanTerm) => update({ loanTerm })}
            formatValue={(m) => `${m} months`}
          />
        )}
      </Field>
    </div>
  );
}

/** Says whether the amount fits before they submit, with a one-tap fix when it doesn't. */
function BudgetFit({ requested, maxAmount, term, onUseMax }: { requested: number; maxAmount: number; term: number; onUseMax: () => void }) {
  if (maxAmount === 0) {
    return (
      <Callout tone="warning" role="status">
        Your budget doesn't leave room for a repayment on this loan yet. You can still check: we'll show you what would change that.
      </Callout>
    );
  }
  if (requested <= maxAmount) {
    return (
      <Callout tone="success" role="status">
        This fits your budget. Over {formatMonths(term)} you could borrow up to <strong>{formatRand(maxAmount)}</strong>.
      </Callout>
    );
  }
  return (
    <Callout
      tone="warning"
      role="status"
      action={
        <Button variant="secondary" size="sm" onClick={onUseMax}>
          Use {formatRand(maxAmount)}
        </Button>
      }
    >
      That's <strong>{formatRand(requested - maxAmount)}</strong> more than fits your budget over {formatMonths(term)}. A longer term or a
      smaller amount would help.
    </Callout>
  );
}
