'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { coupleNames, coupleInitials } from '@/lib/invitation-data';
import { useReducedMotion } from '../motion';

interface InvitationClosingSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
  greeting?: string;
}

export function InvitationClosingSection({
  invitation,
  theme,
  greeting,
}: InvitationClosingSectionProps) {
  const reduced = useReducedMotion();
  const initials = coupleInitials(invitation);
  const names = coupleNames(invitation);

  return (
    <footer
      className="relative overflow-hidden px-6 pt-16 pb-24 text-center"
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }}
    >
      {/* Subtle top divider line with soft fade */}
      <div
        className="mx-auto mb-12 h-px max-w-xs"
        style={{
          background: `linear-gradient(90deg, transparent, ${theme.colors.secondary}60, transparent)`,
        }}
      />

      <motion.div
        className="mx-auto max-w-md space-y-6"
        initial={reduced ? undefined : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Sincere message */}
        <p
          className="text-xs sm:text-sm leading-relaxed"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
          Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada
          kedua mempelai.
        </p>

        {greeting && (
          <p
            className="text-xs sm:text-sm italic font-medium"
            style={{
              color: theme.colors.secondary,
              fontFamily: theme.fonts.body,
            }}
          >
            {greeting}
          </p>
        )}

        <div className="pt-4 pb-2">
          {/* Monogram Seal Badge */}
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border shadow-sm"
            style={{
              borderColor: theme.colors.secondary + '60',
              backgroundColor: theme.colors.secondary + '15',
              color: theme.colors.primary,
            }}
          >
            <span
              className="text-lg font-serif tracking-widest"
              style={{ fontFamily: theme.fonts.heading }}
            >
              {initials}
            </span>
          </div>

          <p
            className="text-xs uppercase tracking-[0.25em]"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Kami yang berbahagia
          </p>

          {/* Couple Calligraphy Name */}
          <p
            className="mt-3 text-3xl sm:text-4xl leading-tight"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.script,
            }}
          >
            {names}
          </p>
        </div>

        {/* Parents and Big Families */}
        {(invitation.groomParents || invitation.brideParents) && (
          <div
            className="mt-6 space-y-3 pt-4 border-t text-xs"
            style={{
              borderColor: theme.colors.secondary + '25',
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            {invitation.groomParents && (
              <p>
                <span className="font-semibold text-foreground/80" style={{ color: theme.colors.text }}>
                  Keluarga Pria:
                </span>{' '}
                {invitation.groomParents}
              </p>
            )}
            {invitation.brideParents && (
              <p>
                <span className="font-semibold text-foreground/80" style={{ color: theme.colors.text }}>
                  Keluarga Wanita:
                </span>{' '}
                {invitation.brideParents}
              </p>
            )}
          </div>
        )}

        {/* Subtle Made with Love Branding */}
        <div className="pt-8 flex items-center justify-center gap-1.5 text-[11px] opacity-60">
          <span style={{ color: theme.colors.textMuted }}>Dibuat penuh cinta dengan</span>
          <Heart className="h-3 w-3 fill-current text-rose-500" />
          <span className="font-medium" style={{ color: theme.colors.text }}>WedInvite</span>
        </div>
      </motion.div>
    </footer>
  );
}

