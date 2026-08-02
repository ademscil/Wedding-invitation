'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';

interface CoverSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  guestName?: string;
  onOpen: () => void;
}

export function CoverSection({
  invitation,
  theme,
  guestName,
  onOpen,
}: CoverSectionProps) {
  const [isOpened, setIsOpened] = useState(false);

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
          className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center px-6"
          style={{ backgroundColor: theme.colors.background }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <p
              className="mb-6 text-sm uppercase tracking-[0.3em]"
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
              }}
            >
              You Are Invited To The Wedding Of
            </p>

            <h1
              className="mb-2 text-4xl leading-tight sm:text-5xl md:text-6xl"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              }}
            >
              {invitation.brideName}
            </h1>

            <p
              className="my-3 text-2xl sm:text-3xl"
              style={{
                color: theme.colors.secondary,
                fontFamily: theme.fonts.script,
              }}
            >
              &amp;
            </p>

            <h1
              className="mb-8 text-4xl leading-tight sm:text-5xl md:text-6xl"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
              }}
            >
              {invitation.groomName}
            </h1>

            {weddingDate && (
              <motion.p
                className="mb-10 text-sm tracking-widest"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {weddingDate}
              </motion.p>
            )}

            {guestName && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p
                  className="text-xs uppercase tracking-widest"
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  Kepada Yth.
                </p>
                <p
                  className="mt-1 text-lg font-medium"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                  }}
                >
                  {guestName}
                </p>
              </motion.div>
            )}

            <motion.button
              onClick={handleOpen}
              className="rounded-full px-8 py-3 text-sm font-medium uppercase tracking-widest text-white transition-all hover:scale-105"
              style={{ backgroundColor: theme.colors.primary }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Buka Undangan
            </motion.button>
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
