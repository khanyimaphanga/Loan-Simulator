import { cx } from '../utils/cx';
import './Spinner.css';

/** Decorative progress indicator; pair it with visible text such as "Checking…". */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return <span className={cx('spinner', size === 'sm' && 'spinner--small')} aria-hidden="true" />;
}
