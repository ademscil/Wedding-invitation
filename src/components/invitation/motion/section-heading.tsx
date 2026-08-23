'use client';

import { motion } from 'framer-motion';
import type { TemplateTheme } from '@/templates/types';
import { SplitText } from './split-text';
import { useReducedMotion } from './use-motion-preference';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  theme: TemplateTheme;
  className?: string;
  /** Optional glyph shown above the title, e.g. a gift or message icon. */
  icon?: React.ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Section title used across the invitation.
 *
 * The words assemble, a rule grows out from the centre beneath them, and the
 * subtitle follows. Previously every section header was an identical fade, so
 * scrolling felt like the same moment repeating.
 */
export function SectionHeading({
  title,
  subtitle,
  theme,
  className,
  icon,
}: SectionHeadingProps) {
  const reduced = useReducedMotion();

  return (
    <div className={`mb-12 text-center ${className ?? ''}`}>
      {icon && (
        <motion.div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: theme.colors.primary + '15' }}
          initial={reduced ? undefined : { scale: 0, rotate: -30 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
          {icon}
        </motion.div>
      )}

      <SplitText
        as="h2"
        text={title}
        by="word"
        gap={0.07}
        className="mb-3 text-3xl sm:text-4xl"
        style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
      />

      <motion.div
        className="mx-auto mb-3 h-px"
        style={{ backgroundColor: theme.colors.secondary }}
        initial={reduced ? undefined : { width: 0, opacity: 0 }}
        whileInView={{ width: 56, opacity: 0.7 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      />

      {subtitle && (
        <motion.p
          className="text-sm tracking-widest"
          style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
          initial={reduced ? undefined : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
