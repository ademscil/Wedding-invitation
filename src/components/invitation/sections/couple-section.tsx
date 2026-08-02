'use client';

import { motion } from 'framer-motion';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';

interface CoupleSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

function PersonCard({
  name,
  parents,
  photo,
  label,
  theme,
  delay,
}: {
  name: string;
  parents?: string | null;
  photo?: string | null;
  label: string;
  theme: TemplateTheme;
  delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, delay }}
    >
      <div
        className="mb-4 h-40 w-40 overflow-hidden rounded-full border-4 sm:h-48 sm:w-48"
        style={{ borderColor: theme.colors.secondary }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-4xl"
            style={{
              backgroundColor: theme.colors.secondary + '20',
              color: theme.colors.secondary,
            }}
          >
            {label === 'Mempelai Wanita' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
            )}
          </div>
        )}
      </div>

      <h3
        className="mb-2 text-2xl sm:text-3xl"
        style={{
          color: theme.colors.text,
          fontFamily: theme.fonts.heading,
        }}
      >
        {name}
      </h3>

      <p
        className="text-xs uppercase tracking-widest"
        style={{
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.body,
        }}
      >
        {label}
      </p>

      {parents && (
        <p
          className="mt-2 text-sm"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          {parents}
        </p>
      )}
    </motion.div>
  );
}

export function CoupleSection({ invitation, theme }: CoupleSectionProps) {
  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <motion.div
        className="mx-auto max-w-3xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <PersonCard
            name={invitation.brideName}
            parents={
              invitation.brideParents
                ? `Putri dari ${invitation.brideParents}`
                : undefined
            }
            photo={invitation.bridePhoto}
            label="Mempelai Wanita"
            theme={theme}
            delay={0}
          />

          <PersonCard
            name={invitation.groomName}
            parents={
              invitation.groomParents
                ? `Putra dari ${invitation.groomParents}`
                : undefined
            }
            photo={invitation.groomPhoto}
            label="Mempelai Pria"
            theme={theme}
            delay={0.2}
          />
        </div>
      </motion.div>
    </section>
  );
}
