'use client';

import { useState } from 'react';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { EventsSection } from '@/components/invitation/sections/events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { LoveStorySection } from '@/components/invitation/sections/love-story-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';

function parseSettings(s: string): InvitationSettings {
  try { return JSON.parse(s) as InvitationSettings; } catch { return {}; }
}

const theme: TemplateTheme = {
  colors: {
    primary: '#E8C97A',
    secondary: '#C4A35A',
    accent: '#F0D9A0',
    background: '#111111',
    text: '#F0EDE8',
    textMuted: '#9A9490',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function GoldLineDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.primary + '30' }} />
      <svg width="32" height="12" viewBox="0 0 32 12">
        <circle cx="4" cy="6" r="2" fill={theme.colors.primary} />
        <circle cx="16" cy="6" r="3" fill="none" stroke={theme.colors.primary} strokeWidth="1" />
        <circle cx="28" cy="6" r="2" fill={theme.colors.primary} />
      </svg>
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.primary + '30' }} />
    </div>
  );
}

export function ModernDarkTemplate({ invitation, guestName, isPreview }: TemplateProps) {
  const settings = parseSettings(invitation.settings as string || '{}');
  const [isOpened, setIsOpened] = useState(isPreview || false);

  return (
    <div style={{ backgroundColor: theme.colors.background, color: theme.colors.text, fontFamily: theme.fonts.body }}>
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          guestName={guestName}
          theme={theme}
          onOpen={() => setIsOpened(true)}
        />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <CoupleSection invitation={invitation} theme={theme} />
        <GoldLineDivider />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <GoldLineDivider />
            <GallerySection invitation={invitation} theme={theme} />
            <GoldLineDivider />
            <RsvpSection invitation={invitation} theme={theme} />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
          </>
        )}

        <div className="py-10 text-center" style={{ borderTop: `1px solid ${theme.colors.primary}30` }}>
          <p style={{ color: theme.colors.primary, fontFamily: theme.fonts.script, fontSize: '1.5rem' }}>
            {invitation.brideName} & {invitation.groomName}
          </p>
          <p className="mt-2 text-xs" style={{ color: theme.colors.textMuted }}>Made with love</p>
        </div>
      </div>
    </div>
  );
}
