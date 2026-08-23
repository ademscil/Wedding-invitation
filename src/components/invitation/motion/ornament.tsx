'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './use-motion-preference';

interface DrawnDividerProps {
  color: string;
  /** Which flourish to draw. */
  variant?: 'flourish' | 'vine' | 'arc' | 'diamond';
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

const PATHS: Record<NonNullable<DrawnDividerProps['variant']>, string[]> = {
  flourish: [
    'M10 20 C 40 4, 70 4, 100 20 C 130 36, 160 36, 190 20',
    'M100 12 l4 8 -4 8 -4 -8 z',
  ],
  vine: [
    'M10 20 Q 55 6 100 20 T 190 20',
    'M55 13 q6 -8 12 0 q-6 8 -12 0',
    'M133 27 q6 8 12 0 q-6 -8 -12 0',
  ],
  arc: ['M20 28 Q 100 2 180 28'],
  diamond: [
    'M20 20 H 78',
    'M122 20 H 180',
    'M100 10 l10 10 -10 10 -10 -10 z',
  ],
};

/**
 * A divider whose stroke draws itself in when it scrolls into view.
 *
 * The previous dividers were static SVG, which read as page furniture. Drawing
 * the line gives each section boundary a moment of its own.
 */
export function DrawnDivider({ color, variant = 'flourish', className }: DrawnDividerProps) {
  const reduced = useReducedMotion();
  const paths = PATHS[variant];

  return (
    <div className={`flex justify-center py-8 ${className ?? ''}`} aria-hidden="true">
      <svg width="200" height="40" viewBox="0 0 200 40" fill="none">
        {paths.map((d, index) => (
          <motion.path
            key={d}
            d={d}
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            fill={d.includes('z') ? color : 'none'}
            initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
            whileInView={reduced ? undefined : { pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, delay: index * 0.18, ease: EASE }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * Slow zoom and pan across a photo.
 *
 * A still photograph in a full-bleed frame looks like a placeholder; a drifting
 * one reads as intentional. Direction varies per index so a gallery does not
 * move in lockstep.
 */
export function KenBurns({
  src,
  alt,
  index = 0,
  className,
}: {
  src: string;
  alt: string;
  index?: number;
  className?: string;
}) {
  const pans = [
    { x: '-2%', y: '-2%' },
    { x: '2%', y: '-1%' },
    { x: '-1%', y: '2%' },
    { x: '1%', y: '1%' },
  ];
  const pan = pans[index % pans.length];

  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="wi-ken-burns h-full w-full object-cover"
        style={{
          ['--wi-pan-x' as string]: pan.x,
          ['--wi-pan-y' as string]: pan.y,
          animationDelay: `${(index % 4) * -3}s`,
        }}
      />
    </div>
  );
}
