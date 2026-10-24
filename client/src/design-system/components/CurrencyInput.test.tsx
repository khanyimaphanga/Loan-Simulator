import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { CurrencyInput } from './CurrencyInput';
import { Field } from './Field';

function Harness({ error }: { error?: string }) {
  const [value, setValue] = useState('');
  return (
    <Field label="Monthly income" hint="After tax" error={error}>
      {(ids) => <CurrencyInput {...ids} value={value} onChange={setValue} />}
    </Field>
  );
}

describe('CurrencyInput', () => {
  it('groups thousands as the user types', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Monthly income');
    await userEvent.type(input, '25000');
    expect(input).toHaveValue('25 000');
  });

  it('accepts pasted formatted values', async () => {
    render(<Harness />);
    const input = screen.getByLabelText('Monthly income');
    await userEvent.click(input);
    await userEvent.paste('R1,250,000.50');
    expect(input).toHaveValue('1 250 000');
  });

  it('opens the numeric keypad on mobile', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Monthly income')).toHaveAttribute('inputmode', 'numeric');
  });

  it('links hint and error for assistive tech', () => {
    render(<Harness error="Minimum monthly income of R5,000 required" />);
    const input = screen.getByLabelText('Monthly income');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Minimum monthly income of R5,000 required/);
    expect(input).toHaveAccessibleDescription(/After tax/);
  });
});
