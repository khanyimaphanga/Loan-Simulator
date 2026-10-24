import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from './Badge';
import { Button } from './Button';
import { Callout } from './Callout';
import { Card } from './Card';
import { Checkbox } from './Checkbox';
import { Dialog } from './Dialog';
import { Meter } from './Meter';

describe('Button', () => {
  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('disables itself and swaps its label while loading', () => {
    render(
      <Button loading loadingLabel="Checking…">
        Continue
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Checking…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('Card', () => {
  it('names its region after its title', () => {
    render(<Card title="Your monthly budget" subtitle="How it adds up." />);
    expect(screen.getByRole('region', { name: 'Your monthly budget' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Your monthly budget' })).toBeInTheDocument();
  });

  it('renders as another element when asked', () => {
    render(<Card as="form" aria-label="Loan form" />);
    expect(screen.getByRole('form', { name: 'Loan form' })).toBeInTheDocument();
  });
});

describe('Callout', () => {
  it('passes the live-region role through and renders an action', () => {
    render(
      <Callout tone="danger" role="alert" action={<Button>Try again</Button>}>
        Something went wrong.
      </Callout>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Checkbox', () => {
  it('reports the new checked state', async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Payslip" checked={false} onChange={onChange} />);
    await userEvent.setup().click(screen.getByRole('checkbox', { name: 'Payslip' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Meter', () => {
  it('exposes its value and a readable description', () => {
    render(<Meter value={3} max={4} label="Documents ready" valueText="3 of 4 ready" />);
    const meter = screen.getByRole('meter', { name: 'Documents ready' });
    expect(meter).toHaveAttribute('aria-valuenow', '3');
    expect(meter).toHaveAttribute('aria-valuetext', '3 of 4 ready');
  });
});

describe('Badge', () => {
  it('carries its meaning in text, not colour alone', () => {
    render(<Badge tone="success" icon="check">Best chance</Badge>);
    expect(screen.getByText('Best chance')).toBeInTheDocument();
  });
});

describe('Dialog', () => {
  it('only mounts its content while open, and closes from the close button or Escape', async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Apply">
        Body
      </Dialog>,
    );
    expect(screen.queryByText('Body')).not.toBeInTheDocument();

    rerender(
      <Dialog open onClose={onClose} title="Apply" actions={<Button>Go</Button>}>
        Body
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: 'Apply' })).toHaveTextContent('Body');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // The browser fires "close" when Escape dismisses a modal dialog.
    screen.getByRole('dialog').dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
