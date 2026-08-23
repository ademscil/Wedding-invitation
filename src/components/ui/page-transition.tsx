'use client';

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/components/invitation/motion';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Cross-fade between routes.
 *
 * Navigating used to swap the page instantly, which on a phone is hard to
 * read as "a new screen" rather than "the same screen changed". Keying on the
 * pathname restarts the animation on every navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Entrance for a single card, used on the auth screens where there is one
 * panel rather than a page of sections.
 */
export function CardTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
