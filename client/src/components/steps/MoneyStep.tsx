import { Callout, ChoiceGroup, CurrencyInput, Field } from '@capitec/design-system';
import { formatRand } from '../../lib/format';
import { CREDIT_BANDS, type CreditBand } from '../../lib/formState';
import type { StepProps } from './types';

export function MoneyStep({ form, errors, update }: StepProps) {
  const hasBoth = form.monthlyIncome !== '' && form.monthlyExpenses !== '';
  const leftOver = Number(form.monthlyIncome) - Number(form.monthlyExpenses);

  return (
    <div className="step-fields">
      <Field label="Monthly take-home income" hint="What lands in your account after tax." error={errors.monthlyIncome}>
        {(ids) => (
          <CurrencyInput {...ids} value={form.monthlyIncome} onChange={(monthlyIncome) => update({ monthlyIncome })} placeholder="25 000" />
        )}
      </Field>

      <Field
        label="Total monthly expenses"
        hint="Everything you spend in a month: rent, groceries, transport and any debt repayments."
        error={errors.monthlyExpenses}
      >
        {(ids) => (
          <CurrencyInput {...ids} value={form.monthlyExpenses} onChange={(monthlyExpenses) => update({ monthlyExpenses })} placeholder="15 000" />
        )}
      </Field>

      {hasBoth &&
        (leftOver > 0 ? (
          <Callout tone="info" role="status">
            You have <strong>{formatRand(leftOver)}</strong> left each month. That's the room a repayment has to fit in.
          </Callout>
        ) : (
          <Callout tone="warning" role="status">
            Your expenses are higher than your income, so there's no room for a repayment yet.
          </Callout>
        ))}

      <Field
        label="Of that, how much goes to debt?"
        hint="Loans, credit cards and store accounts. Leave blank if none."
        error={errors.existingDebt}
        optional
      >
        {(ids) => <CurrencyInput {...ids} value={form.existingDebt} onChange={(existingDebt) => update({ existingDebt })} placeholder="0" />}
      </Field>

      <ChoiceGroup<CreditBand>
        legend="How would you describe your credit score?"
        hint="A rough idea is enough. Not sure? We'll assume an average score, and it won't count against you."
        variant="chips"
        options={(Object.keys(CREDIT_BANDS) as CreditBand[]).map((value) => ({ value, ...CREDIT_BANDS[value] }))}
        value={form.creditBand}
        onChange={(creditBand) => update({ creditBand })}
        error={errors.creditBand}
      />
    </div>
  );
}
