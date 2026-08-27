'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MailOpen } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import {
  AmbientParticles,
  SplitText,
  ScrollCue,
  useReducedMotion,
  type ParticleKind,
} from '../motion';

interface CoverSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  guestName?: string;
  onOpen: () => void;
  /** Ambient drift behind the cover; each template picks what suits it. */
  particle?: ParticleKind;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function CoverSection({
  invitation,
  theme,
  guestName,
  onOpen,
  particle = 'petal',
}: CoverSectionProps) {
  const [isOpened, setIsOpened] = useState(false);
  const reduced = useReducedMotion();

  const handleOpen = () => {
    setIsOpened(true);
    onOpen();
  };

  const weddingDate = invitation.weddingDate
    ? format(new Date(invitation.weddingDate), 'd MMMM yyyy', { locale: id })
    : '';

  return (
    <AnimatePresence>
      {!isOpened && (
        <motion.section
          className="wi-fixed fixed inset-y-0 left-[var(--wi-gutter)] right-[var(--wi-gutter)] z-50 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
          style={{ backgroundColor: theme.colors.background }}
          // The cover lifts and dissolves rather than simply fading, so opening
          // the invitation reads as a curtain rising.
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 1.08, filter: 'blur(6px)' }
          }
          transition={{ duration: 0.9, ease: EASE }}
        >
          <AmbientParticles kind={particle} color={theme.colors.secondary} count={16} />

          {/* Soft vignette gives the flat background some depth. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 35%, ${theme.colors.secondary}18, transparent 65%)`,
            }}
          />

          <div className="relative z-10 w-full max-w-md text-center">
            <motion.p
              className="mb-6 text-xs uppercase tracking-[0.3em] sm:text-sm"
              style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
              initial={reduced ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              The Wedding Of
            </motion.p>

            {/* Groom first, as an Indonesian invitation states the couple. */}
            <SplitText
              as="h1"
              text={invitation.groomName}
              by="word"
              delay={0.35}
              className="mb-1 text-4xl leading-tight sm:text-5xl md:text-6xl"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
              immediate
            />

            <motion.p
              className="my-2 text-2xl sm:text-3xl"
              style={{ color: theme.colors.secondary, fontFamily: theme.fonts.script }}
              initial={reduced ? undefined : { opacity: 0, scale: 0.6, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
            >
              &amp;
            </motion.p>

            <SplitText
              as="h1"
              text={invitation.brideName}
              by="word"
              delay={0.95}
              className="mb-8 text-4xl leading-tight sm:text-5xl md:text-6xl"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
              immediate
            />

            {weddingDate && (
              <motion.div
                className="mb-8 flex items-center justify-center gap-3"
                initial={reduced ? undefined : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.35, duration: 0.7 }}
              >
                <motion.span
                  className="block h-px"
                  style={{ backgroundColor: theme.colors.secondary + '80' }}
                  initial={reduced ? undefined : { width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ delay: 1.45, duration: 0.6, ease: EASE }}
                />
                <span
                  className="text-sm tracking-[0.2em]"
                  style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
                >
                  {weddingDate}
                </span>
                <motion.span
                  className="block h-px"
                  style={{ backgroundColor: theme.colors.secondary + '80' }}
                  initial={reduced ? undefined : { width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ delay: 1.45, duration: 0.6, ease: EASE }}
                />
              </motion.div>
            )}

            {guestName && (
              <motion.div
                className="mb-8"
                initial={reduced ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.6 }}
              >
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
                >
                  Kepada Yth.
                </p>
                <p
                  className="mt-1 break-words text-lg font-medium"
                  style={{ color: theme.colors.text, fontFamily: theme.fonts.body }}
                >
                  {guestName}
                </p>
              </motion.div>
            )}

            <motion.div
              className="relative inline-block"
              initial={reduced ? undefined : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6, ease: EASE }}
            >
              {/* Expanding ring draws the eye to the only control on screen. */}
              {!reduced && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `1px solid ${theme.colors.primary}`,
                    animation: 'wi-pulse-ring 2.4s ease-out infinite',
                  }}
                />
              )}
              <motion.button
                onClick={handleOpen}
                className="relative inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium uppercase tracking-widest text-white"
                style={{ backgroundColor: theme.colors.primary }}
                whileHover={reduced ? undefined : { scale: 1.05 }}
                whileTap={reduced ? undefined : { scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <MailOpen size={16} />
                Buka Undangan
              </motion.button>
            </motion.div>
          </div>

          <ScrollCue color={theme.colors.textMuted} />
        </motion.section>
      )}
    </AnimatePresence>
  );
}
