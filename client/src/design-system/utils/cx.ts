/** Joins class names, skipping falsy entries: cx('button', isSmall && 'button--small'). */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');
