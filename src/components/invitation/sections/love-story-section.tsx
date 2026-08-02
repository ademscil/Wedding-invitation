'use client';

import { motion } from 'framer-motion';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import type { LoveStoryEntry } from '@/types';

interface LoveStorySectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

function parseLoveStory(loveStoryJson: string): LoveStoryEntry[] {
  try {
    return JSON.parse(loveStoryJson) as LoveStoryEntry[];
  } catch {
    return [];
  }
}

export function LoveStorySection({ invitation, theme }: LoveStorySectionProps) {
  const entries = parseLoveStory(invitation.loveStory);

  if (entries.length === 0) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-3xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2
            className="mb-2 text-3xl sm:text-4xl"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
            }}
          >
            Love Story
          </h2>
          <p
            className="text-sm tracking-widest"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Perjalanan cinta kami
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
            style={{ backgroundColor: theme.colors.secondary + '40' }}
          />
          {/* Mobile timeline line */}
          <div
            className="absolute left-6 top-0 h-full w-px md:hidden"
            style={{ backgroundColor: theme.colors.secondary + '40' }}
          />

          {entries.map((entry, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={entry.id}
                className="relative mb-12 last:mb-0"
                initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute left-6 top-2 z-10 hidden h-3 w-3 -translate-x-1/2 rounded-full md:left-1/2 md:block"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="absolute left-6 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full md:hidden"
                  style={{ backgroundColor: theme.colors.primary }}
                />

                {/* Content */}
                <div
                  className={`ml-12 md:ml-0 md:w-5/12 ${
                    isEven
                      ? 'md:mr-auto md:pr-8 md:text-right'
                      : 'md:ml-auto md:pl-8 md:text-left'
                  }`}
                >
                  <span
                    className="mb-1 inline-block rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: theme.colors.primary + '15',
                      color: theme.colors.primary,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {entry.year}
                  </span>

                  <h3
                    className="mb-2 mt-2 text-xl"
                    style={{
                      color: theme.colors.text,
                      fontFamily: theme.fonts.heading,
                    }}
                  >
                    {entry.title}
                  </h3>

                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {entry.description}
                  </p>

                  {entry.image && (
                    <div className="mt-4 overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={entry.image}
                        alt={entry.title}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
