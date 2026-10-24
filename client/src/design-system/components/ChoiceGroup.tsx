import { useId, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon } from './Icon';
import './ChoiceGroup.css';
import './Field.css';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface ChoiceGroupProps<T extends string> {
  legend: string;
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
  /** Guidance under the legend, e.g. what the current choice means. */
  hint?: ReactNode;
  error?: string;
  variant?: 'cards' | 'chips';
}

/** Native radio group styled as cards or chips, so arrow keys and screen readers work without extra code. */
export function ChoiceGroup<T extends string>({ legend, options, value, onChange, hint, error, variant = 'cards' }: ChoiceGroupProps<T>) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  return (
    <fieldset className={cx('choice-group', `choice-group--${variant}`, error && 'field--invalid')} aria-describedby={describedBy}>
      <legend className="field__label">{legend}</legend>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className="choice-group__options">
        {options.map((opt) => (
          <label key={opt.value} className="choice">
            <input
              type="radio"
              className="choice__input"
              name={id}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <span className="choice__body">
              <span className="choice__label">{opt.label}</span>
              {opt.hint && <span className="choice__hint">{opt.hint}</span>}
            </span>
            {variant === 'cards' && (
              <span className="choice__check" aria-hidden="true">
                <Icon name="check" size={14} strokeWidth={3} />
              </span>
            )}
          </label>
        ))}
      </div>
      {error && (
        <p className="field__error" id={errorId}>
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </fieldset>
  );
}
