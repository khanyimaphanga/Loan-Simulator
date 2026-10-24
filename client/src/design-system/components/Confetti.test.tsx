import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { stubCanvas } from '../../test/fixtures';
import { Confetti } from './Confetti';


function stubReducedMotion(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({ matches: reduce && query.includes('reduce'), media: query })) as unknown as typeof window.matchMedia;
  return () => (window.matchMedia = original);
}

describe('Confetti', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('draws on a full-screen layer that is hidden from assistive tech', () => {
    stubCanvas();
    const { container } = render(<Confetti />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toHaveClass('confetti');
    expect(canvas).toHaveAttribute('aria-hidden', 'true');
  });

  it('is skipped entirely for people who prefer reduced motion', () => {
    stubCanvas();
    restore = stubReducedMotion(true);
    const { container } = render(<Confetti />);
    expect(container.querySelector('canvas')).toBeNull();
  });
});
