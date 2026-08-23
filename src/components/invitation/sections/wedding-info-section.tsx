'use client';

import { motion } from 'framer-motion';
import { Shirt, Video, PlayCircle } from 'lucide-react';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';
import { trackEvent } from '@/lib/public-api';
// Shared with the prewedding video section so both refuse the same lookalike
// hosts; there used to be a second copy of this parser here.
import { toYouTubeEmbed } from '@/lib/video';

interface WeddingInfoSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

export function WeddingInfoSection({ invitation, theme }: WeddingInfoSectionProps) {
  const settings = parseSettings(invitation.settings);

  const showDressCode =
    isSectionVisible(settings, 'showDressCode') && Boolean(invitation.dressCode);
  const showStreaming =
    isSectionVisible(settings, 'showStreaming') && Boolean(invitation.streamingUrl);

  const streamEmbed = invitation.streamingUrl
    ? toYouTubeEmbed(invitation.streamingUrl)
    : null;

  if (!showDressCode && !showStreaming) return null;

  return (
    <section className="px-6 py-16" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-2xl space-y-10">
        {showDressCode && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.colors.primary + '15' }}
            >
              <Shirt size={22} style={{ color: theme.colors.primary }} />
            </div>
            <h2
              className="mb-2 text-2xl sm:text-3xl"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
            >
              Dress Code
            </h2>
            <p
              className="text-sm leading-relaxed"
              style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
            >
              {invitation.dressCode}
            </p>
          </motion.div>
        )}

        {showStreaming && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.colors.primary + '15' }}
            >
              <Video size={22} style={{ color: theme.colors.primary }} />
            </div>
            <h2
              className="mb-2 text-2xl sm:text-3xl"
              style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
            >
              Live Streaming
            </h2>
            <p
              className="mb-6 text-sm leading-relaxed"
              style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
            >
              Bagi yang berhalangan hadir, acara dapat disaksikan secara daring.
            </p>

            {streamEmbed ? (
              <div
                className="mx-auto overflow-hidden rounded-2xl border"
                style={{ borderColor: theme.colors.secondary + '40' }}
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={streamEmbed}
                    title="Live streaming pernikahan"
                    className="absolute inset-0 h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            ) : (
              // A non-YouTube link is offered as a plain link rather than framed.
              <a
                href={invitation.streamingUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(invitation.slug, 'SHARE', { method: 'streaming' })}
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <PlayCircle size={16} />
                Tonton Live Streaming
              </a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}
