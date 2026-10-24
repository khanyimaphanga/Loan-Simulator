import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import './IconButton.css';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required: an icon alone has no accessible name. */
  label: string;
}

export function IconButton({ icon, label, type = 'button', className, ...rest }: IconButtonProps) {
  return (
    <button type={type} className={cx('icon-button', className)} aria-label={label} title={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
