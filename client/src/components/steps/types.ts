import type { FormState } from '../../lib/formState';
import type { FormErrors } from '../../lib/validation';

export interface StepProps {
  form: FormState;
  errors: FormErrors;
  update: (patch: Partial<FormState>) => void;
}
