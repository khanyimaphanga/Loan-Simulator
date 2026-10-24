import { Callout, ChoiceGroup, Field, NumberInput, Slider } from '@capitec/design-system';
import { EMPLOYMENT_LABELS, needsEmploymentDuration } from '../../lib/formState';
import { formatMonths } from '../../lib/format';
import type { EmploymentStatus } from '../../types';
import type { StepProps } from './types';

const statuses = Object.keys(EMPLOYMENT_LABELS) as EmploymentStatus[];

/** Scoring tops out at 24 months, so the scale stops at five years to keep each month easy to hit on a phone. */
const MAX_DURATION_MONTHS = 60;

const formatDuration = (months: number) =>
  months >= MAX_DURATION_MONTHS ? '5+ years' : months === 0 ? 'Under a month' : formatMonths(months);

export function AboutYouStep({ form, errors, update }: StepProps) {
  const months = form.employmentDuration === '' ? null : Number(form.employmentDuration);
  const selfEmployed = form.employmentStatus === 'self_employed';

  return (
    <div className="step-fields">
      <Field label="How old are you?" error={errors.age}>
        {(ids) => (
          <NumberInput {...ids} value={form.age} onChange={(age) => update({ age })} suffix="years" placeholder="e.g. 32" maxLength={2} />
        )}
      </Field>

      <ChoiceGroup
        legend="What best describes your work?"
        options={statuses.map((value) => ({ value, ...EMPLOYMENT_LABELS[value] }))}
        value={form.employmentStatus}
        onChange={(employmentStatus) => update({ employmentStatus })}
        error={errors.employmentStatus}
      />

      {needsEmploymentDuration(form.employmentStatus) && (
        <Field
          label={selfEmployed ? 'How long have you run your business?' : 'How long have you been with your employer?'}
          hint="Slide to the nearest month. Choose 5+ years if it's been longer."
          aside={months == null ? 'Not set' : formatDuration(months)}
          asideMuted={months == null}
          error={errors.employmentDuration}
        >
          {(ids) => (
            <Slider
              {...ids}
              min={0}
              max={MAX_DURATION_MONTHS}
              step={1}
              value={months}
              onChange={(m) => update({ employmentDuration: String(m) })}
              formatValue={formatDuration}
              scaleLabels={['0', '5+ years']}
              stepButtons={{ decrease: 'One month less', increase: 'One month more' }}
            />
          )}
        </Field>
      )}

      {form.employmentStatus === 'unemployed' && (
        <Callout tone="warning" role="status">
          You can still continue, but a regular income is usually needed for a loan. We'll show you what would change that.
        </Callout>
      )}
    </div>
  );
}
