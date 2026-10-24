import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Field } from './Field';
import { Slider } from './Slider';

const months = (m: number) => `${m} months`;

function DurationField({ initial = null, error }: { initial?: number | null; error?: string }) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <Field label="Time with employer" aside={value == null ? 'Not set' : months(value)} error={error}>
      {(ids) => (
        <Slider
          {...ids}
          min={0}
          max={60}
          step={1}
          value={value}
          onChange={setValue}
          formatValue={months}
          stepButtons={{ decrease: 'One month less', increase: 'One month more' }}
        />
      )}
    </Field>
  );
}

describe('Slider', () => {
  it('starts unset without implying a value', () => {
    render(<DurationField />);
    const slider = screen.getByRole('slider', { name: 'Time with employer' });
    expect(slider).toHaveAttribute('aria-valuetext', 'Not set');
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  it('reports a human-readable value as it moves', () => {
    render(<DurationField />);
    const slider = screen.getByRole('slider', { name: 'Time with employer' });
    fireEvent.change(slider, { target: { value: '18' } });
    expect(slider).toHaveAttribute('aria-valuetext', '18 months');
    expect(screen.getByText('18 months', { selector: '.field__aside' })).toBeInTheDocument();
  });

  it('step buttons make exact one-step adjustments and stop at the ends', async () => {
    const user = userEvent.setup();
    render(<DurationField initial={59} />);
    const more = screen.getByRole('button', { name: 'One month more' });
    await user.click(more);
    expect(screen.getByRole('slider')).toHaveValue('60');
    expect(more).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'One month less' }));
    expect(screen.getByRole('slider')).toHaveValue('59');
  });

  it('keeps step buttons out of the tab order, since arrow keys already work', () => {
    render(<DurationField />);
    expect(screen.getByRole('button', { name: 'One month more' })).toHaveAttribute('tabindex', '-1');
  });

  it('links the error message and marks the slider invalid', () => {
    render(<DurationField error="Minimum 3 months employment required" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-invalid', 'true');
    expect(slider).toHaveAccessibleDescription(/Minimum 3 months employment required/);
  });
});

describe('Slider marker', () => {
  it('draws a threshold tick only when a marker is given', () => {
    const { container, rerender } = render(<Slider label="Amount" min={0} max={100} step={1} value={50} onChange={() => {}} formatValue={String} />);
    expect(container.querySelector('.slider__marker')).toBeNull();

    rerender(<Slider label="Amount" min={0} max={100} step={1} value={50} onChange={() => {}} formatValue={String} marker={40} />);
    expect(container.querySelector('.slider__marker')).toHaveStyle({ '--marker': '0.4' });
  });
});
