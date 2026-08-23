'use client';

import { useEffect, useState } from 'react';

/**
 * Whether the visitor has asked their system to minimise motion.
 *
 * Every animation in the invitation checks this. Beyond being the accessible
 * default, heavy parallax and particle effects genuinely make some people
 * unwell, and a wedding invitation is not a page anyone chose to opt into.
 *
 * Starts false so server and first client render agree, then updates on mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    // `matchMedia` is missing in some embedded webviews and in jsdom. Treating
    // its absence as "no preference" keeps the invitation rendering rather than
    // throwing on a browser that simply cannot answer the question.
    if (typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);

    // Safari below 14 only has the deprecated addListener form.
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }

    query.addListener(onChange);
    return () => query.removeListener(onChange);
  }, []);

  return reduced;
}

/**
 * True once the component has mounted on the client.
 * Effects that read layout or start timers wait for this so the markup the
 * server produced and the first client render stay identical.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
