import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import './Callout.css';

const DEFAULT_ICON: Record<CalloutTone, IconName> = { info: 'info', success: 'check', warning: 'alert', danger: 'alert' };

type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

interface CalloutProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CalloutTone;
  icon?: IconName;
  /** A follow-up control, e.g. "Try again". */
  action?: ReactNode;
}

/**
 * Inline message. Set `role="alert"` for errors that need immediate attention,
 * or `role="status"` for helpful updates that appear as the user types.
 */
export function Callout({ tone = 'info', icon, action, className, children, ...rest }: CalloutProps) {
  return (
    <div className={cx('callout', `callout--${tone}`, className)} {...rest}>
      <div className="callout__main">
        <Icon name={icon ?? DEFAULT_ICON[tone]} />
        <span className="callout__content">{children}</span>
      </div>
      {action && <div className="callout__action">{action}</div>}
    </div>
  );
}
