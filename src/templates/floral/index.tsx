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
    primary: '#B5598C',
    secondary: '#E8A0BF',
    accent: '#D4768F',
    background: '#FFF5F8',
    text: '#3D1A2B',
    textMuted: '#9E6B80',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-jakarta), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function FloralDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-8">
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '60' }} />
      <svg width="48" height="20" viewBox="0 0 48 20">
        <circle cx="24" cy="10" r="3" fill={theme.colors.primary} opacity="0.7" />
        <ellipse cx="24" cy="4" rx="2" ry="3" fill={theme.colors.secondary} opacity="0.8" />
        <ellipse cx="24" cy="16" rx="2" ry="3" fill={theme.colors.secondary} opacity="0.8" />
        <ellipse cx="18" cy="10" rx="3" ry="2" fill={theme.colors.secondary} opacity="0.8" />
        <ellipse cx="30" cy="10" rx="3" ry="2" fill={theme.colors.secondary} opacity="0.8" />
        <circle cx="8" cy="10" r="2" fill={theme.colors.primary} opacity="0.4" />
        <circle cx="40" cy="10" r="2" fill={theme.colors.primary} opacity="0.4" />
      </svg>
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.secondary + '60' }} />
    </div>
  );
}

export function FloralTemplate({ invitation, guestName, isPreview }: TemplateProps) {
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
        <div
          className="py-4 text-center"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}40, ${theme.colors.primary}30)` }}
        >
          <p style={{ color: theme.colors.primary, fontFamily: theme.fonts.script, fontSize: '1.3rem' }}>
            ✿ Wedding Invitation ✿
          </p>
        </div>

        <CoupleSection invitation={invitation} theme={theme} />
        <FloralDivider />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <FloralDivider />
            <GallerySection invitation={invitation} theme={theme} />
            <FloralDivider />
            <RsvpSection invitation={invitation} theme={theme} />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
          </>
        )}

        <div
          className="py-10 text-center"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}40, ${theme.colors.primary}30)` }}
        >
          <p style={{ color: theme.colors.primary, fontFamily: theme.fonts.script, fontSize: '1.8rem' }}>
            {invitation.brideName} & {invitation.groomName}
          </p>
          <p className="mt-2" style={{ color: theme.colors.textMuted, fontSize: '0.75rem' }}>✿ ✿ ✿</p>
        </div>
      </div>
    </div>
  );
}
