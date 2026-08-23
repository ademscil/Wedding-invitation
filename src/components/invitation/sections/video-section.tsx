'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { parseVideoUrl } from '@/lib/video';
import { useReducedMotion, SectionHeading } from '../motion';

interface VideoSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

/**
 * Prewedding video.
 *
 * The iframe is not mounted until the visitor asks for it. An autoplaying
 * embed would pull roughly a megabyte on open and fight the background music,
 * and most guests arrive on mobile data.
 */
export function VideoSection({ invitation, theme }: VideoSectionProps) {
  const settings = parseSettings(invitation.settings);
  const visible = isSectionVisible(settings, 'showVideo');
  const video = parseVideoUrl(settings.videoUrl);
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();

  // An unrecognised link renders nothing rather than an empty black box.
  if (!visible || !video) return null;

  return (
    <section
      className="px-6 py-20"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          title="Video Prewedding"
          subtitle="Sepenggal cerita kami"
          theme={theme}
        />

        <motion.div
          className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl shadow-lg"
          style={{ backgroundColor: theme.colors.primary + '12' }}
          initial={reduced ? undefined : { opacity: 0, y: 32, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {playing ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              // `autoplay` is honest here: the visitor just pressed play.
              src={`${video.embedUrl}?autoplay=1&rel=0`}
              title={`Video prewedding ${invitation.brideName} & ${invitation.groomName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 flex h-full w-full items-center justify-center"
              aria-label="Putar video prewedding"
            >
              {video.thumbnailUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              )}
              <span
                className="absolute inset-0"
                style={{ backgroundColor: theme.colors.text + '33' }}
              />
              <motion.span
                className="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg sm:h-20 sm:w-20"
                style={{ backgroundColor: theme.colors.background }}
                whileHover={reduced ? undefined : { scale: 1.08 }}
                whileTap={reduced ? undefined : { scale: 0.94 }}
              >
                <Play
                  className="ml-1 h-7 w-7 sm:h-8 sm:w-8"
                  style={{ color: theme.colors.primary }}
                  fill="currentColor"
                />
              </motion.span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
