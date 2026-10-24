import type { SVGProps } from 'react';

const paths = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  alert: 'M12 8v5m0 3.5v.01M10.3 3.9L2.4 17.6A2 2 0 004.1 20.6h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  x: 'M6 6l12 12M18 6L6 18',
  arrowLeft: 'M19 12H5m6-6l-6 6 6 6',
  arrowRight: 'M5 12h14m-6-6l6 6-6 6',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z',
  shield: 'M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3z',
  clock: 'M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  lock: 'M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z',
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7l1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2l-1.4-1.4M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  info: 'M12 11v5m0-8.5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  trendUp: 'M3 17l6-6 4 4 8-8m0 0h-5m5 0v5',
  refresh: 'M4 4v6h6M20 20v-6h-6M5.6 15A8 8 0 0019 17.5M18.4 9A8 8 0 005 6.5',
  printer: 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
  pencil: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  minus: 'M5 12h14',
  plus: 'M12 5v14M5 12h14',
  bookmark: 'M6 4h12v17l-6-4-6 4z',
  trash: 'M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}
