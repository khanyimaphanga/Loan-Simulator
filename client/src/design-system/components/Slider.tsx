import type { CSSProperties } from 'react';
import { cx } from '../utils/cx';
import { clamp } from '../utils/math';
import type { FieldIds } from './Field';
import { IconButton } from './IconButton';
import './Slider.css';

interface SliderProps extends Partial<FieldIds> {
  min: number;
  max: number;
  step: number;
  /** `null` means nothing has been chosen yet: the thumb rests at `min` and reads as "not set". */
  value: number | null;
  onChange: (value: number) => void;
  /** Human-readable value for the scale and for screen readers ("R 50 000", not "50000"). */
  formatValue: (value: number) => string;
  /** Short end labels under the track when `formatValue` reads too long there; defaults to formatted min and max. */
  scaleLabels?: [string, string];
  /** Accessible name when the slider isn't wrapped in a Field. */
  label?: string;
  /**
   * A threshold on the track, e.g. "fits your budget up to here". The track beyond it is tinted, and any
   * selection past it fills in the warning colour. Describe what it means in text near the slider too.
   */
  marker?: number | null;
  /** Adds −/+ buttons for exact, one-step adjustments; useful when the track is dense on small screens. */
  stepButtons?: { decrease: string; increase: string };
}

/**
 * Track paint when there's a marker. Background layers paint top-down, so the marker line comes first, over
 * the zones: brand fill up to the marker, warning fill past it, and a tinted zone beyond the marker.
 */
function trackBackground(fill: number, marker: number | null) {
  if (marker == null) return undefined;
  const within = Math.min(fill, marker);
  const line = `linear-gradient(to right,
    transparent calc(${marker}% - 1.5px), var(--color-text) 0 calc(${marker}% + 1.5px), transparent 0)`;
  const zones = `linear-gradient(to right,
    var(--color-brand) 0 ${within}%,
    var(--color-warning) ${within}% ${fill}%,
    var(--color-surface-sunken) ${fill}% ${marker}%,
    color-mix(in srgb, var(--color-warning) 22%, var(--color-surface-sunken)) ${Math.max(fill, marker)}% 100%)`;
  return `${line}, ${zones}`;
}

/** Range input with a filled track, an optional unset state and optional step buttons. */
export function Slider({
  inputId,
  describedBy,
  invalid,
  min,
  max,
  step,
  value,
  onChange,
  formatValue,
  scaleLabels = [formatValue(min), formatValue(max)],
  label,
  marker,
  stepButtons,
}: SliderProps) {
  const current = value == null ? min : clamp(value, min, max);
  const toPct = (n: number) => ((clamp(n, min, max) - min) / (max - min)) * 100;
  const fill = value == null ? 0 : toPct(current);
  const markerPct = marker == null ? null : toPct(marker);
  // From "not set", minus picks the minimum and plus takes one step up from it.
  const nudge = (direction: 1 | -1) =>
    onChange(value == null ? (direction > 0 ? min + step : min) : clamp(current + direction * step, min, max));

  return (
    <div className={cx('slider', value == null && 'slider--unset', invalid && 'slider--invalid', stepButtons && 'slider--with-steps')}>
      <div className="slider__control">
        {stepButtons && (
          // Out of the tab order: keyboard users already get arrow keys on the slider itself.
          <IconButton
            icon="minus"
            label={stepButtons.decrease}
            tabIndex={-1}
            disabled={value != null && current <= min}
            onClick={() => nudge(-1)}
          />
        )}
        <div className="slider__track">
          <input
            id={inputId}
            type="range"
            className="slider__input"
            min={min}
            max={max}
            step={step}
            value={current}
            aria-label={label}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            aria-valuetext={value == null ? 'Not set' : formatValue(current)}
            style={{ '--fill': `${fill}%`, '--track': trackBackground(fill, markerPct) } as CSSProperties}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {markerPct != null && (
            <span className="slider__marker" style={{ '--marker': markerPct / 100 } as CSSProperties} aria-hidden="true" />
          )}
        </div>
        {stepButtons && (
          <IconButton icon="plus" label={stepButtons.increase} tabIndex={-1} disabled={current >= max} onClick={() => nudge(1)} />
        )}
      </div>
      <div className="slider__scale" aria-hidden="true">
        <span>{scaleLabels[0]}</span>
        <span>{scaleLabels[1]}</span>
      </div>
    </div>
  );
}
