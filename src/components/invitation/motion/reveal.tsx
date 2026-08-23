'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { useReducedMotion } from './use-motion-preference';

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

interface RevealProps {
  children: ReactNode;
  /** Which way the content travels in from. */
  direction?: RevealDirection;
  /** Seconds to wait after the element enters view. */
  delay?: number;
  duration?: number;
  /** Travel distance in pixels for the directional variants. */
  distance?: number;
  className?: string;
  /** Replay every time the element re-enters the viewport. */
  repeat?: boolean;
  as?: 'div' | 'section' | 'span' | 'li';
}

/** A soft ease-out that settles rather than stopping abruptly. */
const EASE = [0.22, 1, 0.36, 1] as const;

function offsetFor(direction: RevealDirection, distance: number) {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    case 'scale':
      return { scale: 0.92 };
    case 'fade':
    default:
      return {};
  }
}

/**
 * Scroll-triggered entrance for a single block.
 *
 * Replaces the one fade-up that every section previously shared: varying the
 * direction between neighbouring sections is what stops a long page from
 * feeling like it repeats the same beat all the way down.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  distance = 32,
  className,
  repeat = false,
  as = 'div',
}: RevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as];

  if (reduced) {
    // Content still appears — only the movement is dropped.
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, ...offsetFor(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: !repeat, amount: 0.25, margin: '0px 0px -80px 0px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  /** Gap in seconds between each child starting. */
  gap?: number;
  delay?: number;
}

const containerVariants: Variants = {
  hidden: {},
  visible: (gap: number) => ({
    transition: { staggerChildren: gap, delayChildren: 0.1 },
  }),
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * Reveals children one after another instead of all at once.
 * Use with `StaggerItem` for lists: events, gallery tiles, bank cards.
 */
export function Stagger({ children, className, gap = 0.12, delay = 0 }: StaggerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      custom={gap}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -60px 0px' }}
      transition={{ delayChildren: delay }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}
