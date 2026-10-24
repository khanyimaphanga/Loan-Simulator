import type { ElementType, HTMLAttributes } from 'react';
import './VisuallyHidden.css';

interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
}

/** Content for screen readers only, such as extra context on a short button label, or a live announcement. */
export function VisuallyHidden({ as: Tag = 'span', className, ...rest }: VisuallyHiddenProps) {
  return <Tag className={className ? `sr-only ${className}` : 'sr-only'} {...rest} />;
}
