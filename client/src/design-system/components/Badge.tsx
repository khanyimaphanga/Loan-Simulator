import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import './Badge.css';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  size?: 'md' | 'sm';
  children: ReactNode;
}

/** A short status label. Never rely on its colour alone: the text (and icon) must carry the meaning. */
export function Badge({ tone = 'neutral', icon, size = 'md', children }: BadgeProps) {
  return (
    <span className={cx('badge', `badge--${tone}`, size === 'sm' && 'badge--small')}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 16} strokeWidth={2.5} />}
      {children}
    </span>
  );
}
