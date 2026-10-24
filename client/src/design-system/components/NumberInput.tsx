import { parseDigits } from '../utils/digits';
import type { FieldIds } from './Field';
import './Field.css';

interface NumberInputProps extends FieldIds {
  value: string;
  onChange: (digits: string) => void;
  suffix?: string;
  placeholder?: string;
  maxLength?: number;
}

export function NumberInput({ inputId, describedBy, invalid, value, onChange, suffix, placeholder, maxLength = 3 }: NumberInputProps) {
  return (
    <div className="input-affix">
      <input
        id={inputId}
        className={`input${suffix ? ' input--suffixed' : ''}`}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(parseDigits(e.target.value).slice(0, maxLength))}
      />
      {suffix && (
        <span className="input-affix__suffix" aria-hidden="true">
          {suffix}
        </span>
      )}
    </div>
  );
}
