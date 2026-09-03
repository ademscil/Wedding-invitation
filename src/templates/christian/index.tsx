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
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';
import { coupleNames } from '@/lib/invitation-data';

export const christianTheme: TemplateTheme = {
  colors: {
    primary: '#4A6FA5',
    secondary: '#C9A96E',
    accent: '#8EB8E5',
    background: '#F8F9FF',
    text: '#1A2B4A',
    textMuted: '#6B7A9A',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function CrossDivider({ theme }: { theme: TemplateTheme }) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '60' }} />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2v20M2 12h20" stroke={theme.colors.secondary} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '60' }} />
    </div>
  );
}

export function ChristianTemplate({ invitation, guestName,
  personalLink, existingRsvp, isPreview }: TemplateProps) {
  const settings = parseSettings(invitation.settings);

  const theme: TemplateTheme = {
    ...christianTheme,
    colors: {
      ...christianTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };
  const [isOpened, setIsOpened] = useState(isPreview || false);

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      <Ambience theme={theme} particle="sparkle" />
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          guestName={guestName}
          theme={theme}
          onOpen={() => setIsOpened(true)}
        particle="sparkle"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} invitationSlug={invitation.slug}
        />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {/* Scripture header */}
        <div className="py-6 text-center" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          <p className="text-sm italic" style={{ fontFamily: theme.fonts.script, fontSize: '1.1rem' }}>
            &ldquo;Kasihilah seorang akan yang lain, seperti Aku telah mengasihi kamu.&rdquo;
          </p>
          <p className="mt-1 text-xs opacity-70">— Yohanes 13:34</p>
        </div>

        <CoupleSection invitation={invitation} theme={theme} />
        <CrossDivider theme={theme} />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <CrossDivider theme={theme} />
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
          </>
        )}

        <div className="py-12 text-center" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          <p className="text-sm italic" style={{ fontFamily: theme.fonts.script, fontSize: '1.2rem' }}>
            &ldquo;Dua adalah lebih baik dari pada satu.&rdquo;
          </p>
          <p className="mt-1 text-xs opacity-70">— Pengkhotbah 4:9</p>
          <p className="mt-4 text-xs opacity-60">
            {coupleNames(invitation)}
          </p>
        </div>
      </div>
    </div>
  );
}
