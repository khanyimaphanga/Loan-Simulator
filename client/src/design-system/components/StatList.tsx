import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import './StatList.css';

interface Stat {
  label: ReactNode;
  value: ReactNode;
}

interface StatListProps {
  items: (Stat | false | null)[];
  /** Drops the dashed divider above the list, for lists that open a section rather than follow a headline. */
  plain?: boolean;
}

/** Label/value pairs such as rate, total and term, as a description list so the pairing is announced. */
export function StatList({ items, plain }: StatListProps) {
  return (
    <dl className={cx('stat-list', plain && 'stat-list--plain')}>
      {items
        .filter((item): item is Stat => Boolean(item))
        .map(({ label, value }, i) => (
          <div className="stat-list__row" key={i}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}
