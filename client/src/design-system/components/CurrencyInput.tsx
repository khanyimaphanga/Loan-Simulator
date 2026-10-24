import { formatDigits, parseDigits } from '../utils/digits';
import type { FieldIds } from './Field';
import './Field.css';

interface CurrencyInputProps extends FieldIds {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  suffix?: string;
}

/** Rand amount input: numeric keypad on mobile, live thousands grouping, accepts pasted "R25,000.00". */
export function CurrencyInput({ inputId, describedBy, invalid, value, onChange, placeholder, suffix = 'per month' }: CurrencyInputProps) {
  return (
    <div className="input-affix">
      <span className="input-affix__prefix" aria-hidden="true">
        R
      </span>
      <input
        id={inputId}
        className="input input--affixed"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={formatDigits(value)}
        onChange={(e) => onChange(parseDigits(e.target.value))}
      />
      {suffix && (
        <span className="input-affix__suffix" aria-hidden="true">
          {suffix}
        </span>
      )}
    </div>
  );
}
