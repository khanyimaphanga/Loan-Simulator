import { useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icon';
import './Card.css';

type CardOwnProps<E extends ElementType> = {
  as?: E;
  tone?: 'default' | 'accent';
  title?: ReactNode;
  titleIcon?: IconName;
  subtitle?: ReactNode;
  /** Controls aligned opposite the title, e.g. a view toggle. */
  actions?: ReactNode;
  children?: ReactNode;
};

type CardProps<E extends ElementType> = CardOwnProps<E> & Omit<ComponentPropsWithoutRef<E>, keyof CardOwnProps<E>>;

/** Surface container. With a `title`, it labels itself (aria-labelledby) so landmarks read well. */
export function Card<E extends ElementType = 'section'>({
  as,
  tone = 'default',
  title,
  titleIcon,
  subtitle,
  actions,
  className,
  children,
  ...rest
}: CardProps<E>) {
  const Tag: ElementType = as ?? 'section';
  const titleId = useId();

  const heading = title != null && (
    <>
      <h3 className="card__title" id={titleId}>
        {titleIcon && <Icon name={titleIcon} />}
        {title}
      </h3>
      {subtitle != null && <p className="card__subtitle">{subtitle}</p>}
    </>
  );

  return (
    <Tag
      className={cx('card', tone === 'accent' && 'card--accent', className)}
      aria-labelledby={title != null ? titleId : undefined}
      {...rest}
    >
      {actions ? (
        <div className="card__header">
          <div>{heading}</div>
          {actions}
        </div>
      ) : (
        heading
      )}
      {children}
    </Tag>
  );
}
