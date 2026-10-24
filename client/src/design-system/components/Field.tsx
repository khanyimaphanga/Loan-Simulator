import { useId, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import './Field.css';

export interface FieldIds {
  inputId: string;
  describedBy: string | undefined;
  invalid: boolean;
}

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  /** A live reading shown opposite the label, e.g. a slider's current value. */
  aside?: ReactNode;
  /** Renders `aside` as a muted placeholder, for "nothing chosen yet". */
  asideMuted?: boolean;
  children: (ids: FieldIds) => ReactNode;
}

/** Label + hint + error wiring for a single control. Errors are announced via aria-describedby. */
export function Field({ label, hint, error, optional, aside, asideMuted, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('field', error && 'field--invalid')}>
      <div className="field__header">
        <label className="field__label" htmlFor={`${id}-input`}>
          {label}
          {optional && <span className="field__optional">Optional</span>}
        </label>
        {aside != null && <span className={cx('field__aside', asideMuted && 'field__aside--placeholder')}>{aside}</span>}
      </div>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({ inputId: `${id}-input`, describedBy, invalid: !!error })}
      {error && (
        <p className="field__error" id={errorId}>
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}
