import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import { Spinner } from './Spinner';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
  /** `lg` is for the one hero action on a page, e.g. applying for an offer. */
  size?: 'lg' | 'md' | 'sm';
  iconStart?: IconName;
  iconEnd?: IconName;
  /** Shows a spinner, disables the button and replaces the label with `loadingLabel`. */
  loading?: boolean;
  loadingLabel?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconStart,
  iconEnd,
  loading = false,
  loadingLabel,
  type = 'button',
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
  return (
    <button
      type={type}
      className={cx('button', `button--${variant}`, size === 'sm' && 'button--small', size === 'lg' && 'button--large', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size="sm" /> {loadingLabel ?? children}
        </>
      ) : (
        <>
          {iconStart && <Icon name={iconStart} size={iconSize} />}
          {children}
          {iconEnd && <Icon name={iconEnd} size={iconSize} />}
        </>
      )}
    </button>
  );
}
