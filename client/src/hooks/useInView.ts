import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether an element is on screen. Without IntersectionObserver (old browsers, tests) it reports
 * `true`, so anything shown only when the element is off screen simply stays hidden.
 */
export function useInView(ref: RefObject<Element>, enabled = true) {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);

  return inView;
}
