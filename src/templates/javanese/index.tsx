'use client';

import { useState } from 'react';
import type { TemplateProps, TemplateTheme } from '../types';
import { parseSettings } from '@/lib/invitation-data';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { EventsSection } from '@/components/invitation/sections/events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { VideoSection } from '@/components/invitation/sections/video-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { InvitationClosingSection } from '@/components/invitation/sections/invitation-closing-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';

export const javaneseTheme: TemplateTheme = {
  colors: {
    primary: '#5C3317',
    secondary: '#C8992A',
    accent: '#8B4513',
    background: '#FDF6E3',
    text: '#3B1E08',
    textMuted: '#7A5230',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-jakarta), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function BatikDivider({ theme }: { theme: TemplateTheme }) {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '50' }} />
      <svg width="40" height="20" viewBox="0 0 40 20">
        <ellipse cx="20" cy="10" rx="8" ry="4" fill="none" stroke={theme.colors.secondary} strokeWidth="1" />
        <circle cx="20" cy="10" r="2" fill={theme.colors.secondary} />
        <circle cx="5" cy="10" r="3" fill="none" stroke={theme.colors.secondary} strokeWidth="1" />
        <circle cx="35" cy="10" r="3" fill="none" stroke={theme.colors.secondary} strokeWidth="1" />
      </svg>
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '50' }} />
    </div>
  );
}

export function JavaneseTemplate({ invitation, guestName,
  personalLink, existingRsvp, isPreview }: TemplateProps) {
  const settings = parseSettings(invitation.settings);

  const theme: TemplateTheme = {
    ...javaneseTheme,
    colors: {
      ...javaneseTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };
  const [isOpened, setIsOpened] = useState(isPreview || false);

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      <Ambience theme={theme} particle="leaf" />
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          guestName={guestName}
          theme={theme}
          onOpen={() => setIsOpened(true)}
        particle="leaf"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} invitationSlug={invitation.slug}
        />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="py-5 text-center" style={{ backgroundColor: theme.colors.primary, color: '#F5DEB3' }}>
          <p className="text-sm tracking-widest uppercase" style={{ fontFamily: theme.fonts.heading }}>
            Assalamu&apos;alaikum Warahmatullahi Wabarakatuh
          </p>
          <p className="mt-1 text-xs opacity-70">Dengan memohon ridha Allah SWT</p>
        </div>
        <div className="h-3" style={{
          background: `repeating-linear-gradient(90deg, ${theme.colors.secondary} 0px, ${theme.colors.secondary} 4px, transparent 4px, transparent 12px)`,
        }} />

        <CoupleSection invitation={invitation} theme={theme} />
        <BatikDivider theme={theme} />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <BatikDivider theme={theme} />
            {/* Prewedding Video */}
            <VideoSection invitation={invitation} theme={theme} />

            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
              existingRsvp={existingRsvp}
            />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
            <WeddingInfoSection invitation={invitation} theme={theme} />
            <ShareSection invitation={invitation} theme={theme} />
            <InvitationClosingSection
              invitation={invitation}
              theme={theme}
              greeting="Wassalamu'alaikum Warahmatullahi Wabarakatuh"
            />
          </>
        )}
      </div>
    </div>
  );
}
