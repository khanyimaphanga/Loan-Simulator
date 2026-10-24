import { cx } from '../utils/cx';
import { clamp } from '../utils/math';
import './Meter.css';

export type MeterTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

interface MeterProps {
  value: number;
  max?: number;
  tone?: MeterTone;
  /** Accessible name, e.g. "Affordability score". */
  label: string;
  /** Readable value, e.g. "22 of 40 points". Defaults to a percentage. */
  valueText?: string;
  className?: string;
}

/** A filled bar for a known quantity within a range (a score, a share, progress through a checklist). */
export function Meter({ value, max = 100, tone = 'neutral', label, valueText, className }: MeterProps) {
  const share = max > 0 ? clamp(value / max, 0, 1) : 0;
  return (
    <div
      className={cx('meter', `meter--${tone}`, className)}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText ?? `${Math.round(share * 100)}%`}
    >
      <span className="meter__fill" style={{ width: `${share * 100}%` }} />
    </div>
  );
}
