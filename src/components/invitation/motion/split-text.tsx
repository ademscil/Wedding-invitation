'use client';

import { motion } from 'framer-motion';
import { useReducedMotion } from './use-motion-preference';

interface SplitTextProps {
  text: string;
  /** Reveal one word at a time, or one character at a time. */
  by?: 'word' | 'char';
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  /** Seconds between each piece starting. */
  gap?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  /** Animate on mount rather than waiting for the element to scroll into view. */
  immediate?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Reveals a heading piece by piece rather than fading the whole block in.
 *
 * Used for the couple's names and section titles, where the extra beat makes
 * the page feel composed instead of merely appearing.
 */
export function SplitText({
  text,
  by = 'word',
  className,
  style,
  delay = 0,
  gap = 0.06,
  as = 'span',
  immediate = false,
}: SplitTextProps) {
  const reduced = useReducedMotion();
  const Tag = as;

  // Screen readers get the whole string; the pieces below are decorative.
  if (reduced) {
    return (
      <Tag className={className} style={style}>
        {text}
      </Tag>
    );
  }

  const pieces = by === 'word' ? text.split(/(\s+)/) : Array.from(text);
  const MotionTag = motion[as];

  const animationProps = immediate
    ? { animate: 'visible' as const }
    : {
        whileInView: 'visible' as const,
        viewport: { once: true, amount: 0.4 },
      };

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      {...animationProps}
      transition={{ staggerChildren: gap, delayChildren: delay }}
      aria-label={text}
    >
      {pieces.map((piece, index) => {
        // Keep whitespace as plain text so words do not run together.
        if (/^\s+$/.test(piece)) {
          return <span key={index}>{piece}</span>;
        }

        return (
          <motion.span
            key={index}
            aria-hidden="true"
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: '0.4em', filter: 'blur(4px)' },
              visible: {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                transition: { duration: 0.6, ease: EASE },
              },
            }}
          >
            {piece}
          </motion.span>
        );
      })}
    </MotionTag>
  );
}
