'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useReducedMotion } from './use-motion-preference';

interface CelebrationProps {
  /** Colours the burst cycles through — usually the template palette. */
  colors: string[];
  /** Pieces thrown. Kept modest so a phone stays smooth. */
  count?: number;
}

/** Deterministic scatter, so the burst does not differ between renders. */
function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 37.719 + salt * 91.371) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * A one-shot confetti burst.
 *
 * Plays when a guest submits their RSVP — the single moment in the invitation
 * that deserves a reaction rather than a quiet state change.
 */
export function Celebration({ colors, count = 26 }: CelebrationProps) {
  const reduced = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Spread across a half-circle so the burst reads as upward.
        const angle = Math.PI * (0.12 + seeded(i, 1) * 0.76);
        const distance = 90 + seeded(i, 2) * 130;
        return {
          id: i,
          x: Math.cos(angle) * distance * (seeded(i, 5) > 0.5 ? 1 : -1),
          y: -Math.sin(angle) * distance,
          rotate: seeded(i, 3) * 720 - 360,
          size: 5 + seeded(i, 4) * 6,
          color: colors[i % colors.length],
          delay: seeded(i, 6) * 0.12,
        };
      }),
    [count, colors]
  );

  if (reduced) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/3 z-10 h-0 w-0"
    >
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute block rounded-[1px]"
          style={{
            width: piece.size,
            height: piece.size * 1.6,
            backgroundColor: piece.color,
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: [1, 1, 0],
            x: piece.x,
            // Falls a little past its arc, so the pieces settle rather than
            // stopping mid-air.
            y: [0, piece.y, piece.y + 120],
            rotate: piece.rotate,
            scale: [1, 1, 0.7],
          }}
          transition={{
            duration: 1.6,
            delay: piece.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.45, 1],
          }}
        />
      ))}
    </div>
  );
}
