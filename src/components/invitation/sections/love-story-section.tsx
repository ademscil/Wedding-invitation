'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import type { LoveStoryEntry } from '@/types';
import { SectionHeading, useReducedMotion } from '../motion';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { parseLoveStory } from '@/lib/invitation-data';

interface LoveStorySectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

/**
 * Decides whether the section renders at all.
 *
 * The timeline below owns a `useScroll` target ref, and that hook may only run
 * in a component guaranteed to mount — hooks cannot sit behind an early
 * return. Keeping the gate separate is what lets the ref always attach.
 */
export function LoveStorySection({ invitation, theme }: LoveStorySectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showLoveStory');
  const entries = parseLoveStory(invitation.loveStory);

  if (!visible || entries.length === 0) return null;

  return <LoveStoryTimeline entries={entries} theme={theme} />;
}

function LoveStoryTimeline({
  entries,
  theme,
}: {
  entries: LoveStoryEntry[];
  theme: TemplateTheme;
}) {
  const reduced = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start 80%', 'end 60%'],
  });
  const timelineProgress = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1]),
    { stiffness: 80, damping: 22 }
  );

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          title="Love Story"
          subtitle="Perjalanan cinta kami"
          theme={theme}
        />

        <div className="relative" ref={timelineRef}>
          {/* The rule fills in as the section scrolls, so the story reads as
              a path being travelled rather than a list already laid out. */}
          <div
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 md:block"
            style={{ backgroundColor: theme.colors.secondary + '20' }}
          />
          <motion.div
            className="absolute left-1/2 top-0 hidden w-px -translate-x-1/2 origin-top md:block"
            style={{
              backgroundColor: theme.colors.secondary,
              height: '100%',
              scaleY: reduced ? 1 : timelineProgress,
            }}
          />

          <div
            className="absolute left-6 top-0 h-full w-px md:hidden"
            style={{ backgroundColor: theme.colors.secondary + '20' }}
          />
          <motion.div
            className="absolute left-6 top-0 w-px origin-top md:hidden"
            style={{
              backgroundColor: theme.colors.secondary,
              height: '100%',
              scaleY: reduced ? 1 : timelineProgress,
            }}
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
