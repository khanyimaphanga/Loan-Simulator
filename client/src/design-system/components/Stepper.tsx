import { Icon } from './Icon';
import { VisuallyHidden } from './VisuallyHidden';
import './Stepper.css';

interface StepperProps {
  steps: { id: string; label: string }[];
  current: number;
  onSelect: (index: number) => void;
}

/** Progress indicator. Completed steps are buttons so people can jump back; future steps are not. */
export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="stepper">
        {steps.map((step, i) => {
          const state = i < current ? 'done' : i === current ? 'current' : 'todo';
          const content = (
            <>
              <span className="stepper__dot">{state === 'done' ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="stepper__label">{step.label}</span>
            </>
          );
          return (
            <li key={step.id} className={`stepper__item stepper__item--${state}`}>
              {state === 'done' ? (
                <button type="button" className="stepper__button" onClick={() => onSelect(i)}>
                  {content}
                  <VisuallyHidden> (completed, edit)</VisuallyHidden>
                </button>
              ) : (
                <span className="stepper__button" aria-current={state === 'current' ? 'step' : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
