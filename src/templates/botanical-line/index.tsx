'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { TimelineEventsSection } from '@/components/invitation/sections/timeline-events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { LoveStorySection } from '@/components/invitation/sections/love-story-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';

function parseSettings(s: string): InvitationSettings {
  try {
    return JSON.parse(s) as InvitationSettings;
  } catch {
    return {};
  }
}

const theme: TemplateTheme = {
  colors: {
    primary: '#3F5A3D',
    secondary: '#A8B78A',
    accent: '#6B8E4E',
    background: '#F7F8F2',
    text: '#26311F',
    textMuted: '#6E7A5E',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-jakarta), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function LeafDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <Ambience theme={theme} particle="leaf" />
      <div className="h-px w-16" style={{ backgroundColor: theme.colors.secondary + '80' }} />
      <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
        <path
          d="M16 2c8 4 14 8 14 14-8-2-12-6-14-14zM16 2C8 6 2 10 2 16c8-2 12-6 14-14z"
          fill={theme.colors.accent}
          opacity="0.65"
        />
      </svg>
      <div className="h-px w-16" style={{ backgroundColor: theme.colors.secondary + '80' }} />
    </div>
  );
}

// Staggered line-by-line reveal, matching the reference video's greeting animation
function StaggeredGreeting({
  bride,
  brideParents,
  groom,
  groomParents,
}: {
  bride: string;
  brideParents?: string | null;
  groom: string;
  groomParents?: string | null;
}) {
  const lines = [
    'Dengan penuh rasa syukur kepada Tuhan Yang Maha Esa,',
    'kami mengundang Bapak/Ibu/Saudara/i untuk turut merayakan hari bahagia kami:',
    `${bride}${brideParents ? ` (Putri dari ${brideParents})` : ''}`,
    '&',
    `${groom}${groomParents ? ` (Putra dari ${groomParents})` : ''}`,
  ];

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <div className="mx-auto max-w-xl text-center">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className={i === 2 || i === 4 ? 'my-3 text-2xl' : i === 3 ? 'my-1 text-lg' : 'mb-4 text-sm leading-relaxed'}
            style={{
              color: i === 2 || i === 4 ? theme.colors.primary : theme.colors.textMuted,
              fontFamily: i === 2 || i === 4 ? theme.fonts.script : theme.fonts.body,
            }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.25 }}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </section>
  );
}

export function BotanicalLineTemplate({ invitation, guestName, personalLink, isPreview }: TemplateProps) {
  const settings = parseSettings((invitation.settings as string) || '{}');
  const [isOpened, setIsOpened] = useState(isPreview || false);

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      {!isPreview && (
        <CoverSection invitation={invitation} guestName={guestName} theme={theme} onOpen={() => setIsOpened(true)} particle="leaf"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <StaggeredGreeting
          bride={invitation.brideName}
          brideParents={invitation.brideParents}
          groom={invitation.groomName}
          groomParents={invitation.groomParents}
        />

        {invitation.quote && (
          <section className="px-6 pb-16 text-center" style={{ backgroundColor: theme.colors.background }}>
            <motion.blockquote
              className="mx-auto max-w-lg text-lg italic leading-relaxed"
              style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              &ldquo;{invitation.quote}&rdquo;
            </motion.blockquote>
          </section>
        )}

        <CoupleSection invitation={invitation} theme={theme} />
        <LeafDivider />
        <TimelineEventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <LeafDivider />
            <GallerySection invitation={invitation} theme={theme} />
            <LeafDivider />
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
            />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
            <WeddingInfoSection invitation={invitation} theme={theme} />
            <ShareSection invitation={invitation} theme={theme} />
          </>
        )}

        <div className="py-10 text-center" style={{ backgroundColor: theme.colors.primary }}>
          <p className="text-2xl" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.script }}>
            {invitation.brideName} & {invitation.groomName}
          </p>
        </div>
      </div>
    </div>
  );
}
