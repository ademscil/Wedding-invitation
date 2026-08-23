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
import { MusicPlayer } from '@/components/invitation/sections/music-player';

function parseSettings(s: string): InvitationSettings {
  try {
    return JSON.parse(s) as InvitationSettings;
  } catch {
    return {};
  }
}

const theme: TemplateTheme = {
  colors: {
    primary: '#7A2E3A',
    secondary: '#C79A5A',
    accent: '#9E4F5A',
    background: '#FBF4EA',
    text: '#3A2417',
    textMuted: '#8A6E56',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-jakarta), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function ArchMonogram({ bride, groom }: { bride: string; groom: string }) {
  const initials = `${bride.charAt(0)}${groom.charAt(0)}`.toUpperCase();
  return (
    <motion.div
      className="flex flex-col items-center py-10"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full border text-2xl"
        style={{ borderColor: theme.colors.secondary, color: theme.colors.primary, fontFamily: theme.fonts.script }}
      >
        {initials}
      </div>
    </motion.div>
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
    'Assalamu\u2019alaikum Warahmatullahi Wabarakatuh',
    'Dengan penuh syukur, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada pernikahan kami:',
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

function ArchDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <div className="h-px w-16" style={{ backgroundColor: theme.colors.secondary + '80' }} />
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M14 2c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12"
          stroke={theme.colors.secondary}
          strokeWidth="1"
          opacity="0.7"
        />
        <circle cx="14" cy="14" r="2.5" fill={theme.colors.primary} opacity="0.7" />
      </svg>
      <div className="h-px w-16" style={{ backgroundColor: theme.colors.secondary + '80' }} />
    </div>
  );
}

export function VintageArchTemplate({ invitation, guestName, personalLink, isPreview }: TemplateProps) {
  const settings = parseSettings((invitation.settings as string) || '{}');
  const [isOpened, setIsOpened] = useState(isPreview || false);

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      {!isPreview && (
        <CoverSection invitation={invitation} guestName={guestName} theme={theme} onOpen={() => setIsOpened(true)} />
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
            <ArchMonogram bride={invitation.brideName} groom={invitation.groomName} />
          </section>
        )}

        <CoupleSection invitation={invitation} theme={theme} />
        <ArchDivider />
        <TimelineEventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <ArchDivider />
            <GallerySection invitation={invitation} theme={theme} />
            <ArchDivider />
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
            />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
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
