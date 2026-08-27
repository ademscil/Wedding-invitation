'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useReducedMotion } from './use-motion-preference';

/**
 * A hint that the page continues below the fold.
 *
 * The cover fills the screen, so without this a guest can reasonably think the
 * invitation is only the cover.
 */
export function ScrollCue({ color }: { color: string }) {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1"
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.8 }}
    >
      <motion.span
        className="text-[0.65rem] uppercase tracking-[0.25em]"
        style={{ color }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        Geser ke bawah
      </motion.span>
      <motion.span
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={20} style={{ color }} />
      </motion.span>
    </motion.div>
  );
}

/** Thin bar across the top showing how far through the invitation the guest is. */
export function ScrollProgress({ color }: { color: string }) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="wi-fixed fixed inset-x-0 top-0 z-50 h-0.5 origin-left"
      style={{ scaleX, backgroundColor: color }}
    />
  );
}
