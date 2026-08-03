'use client';

import { useState } from 'react';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { EventsSection } from '@/components/invitation/sections/events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
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
    primary: '#C0392B',
    secondary: '#F39C12',
    accent: '#E74C3C',
    background: '#FFF8F0',
    text: '#2C1810',
    textMuted: '#7D4E37',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function DoubleLuckDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.primary + '40' }} />
      <span className="text-2xl font-bold" style={{ color: theme.colors.primary, lineHeight: 1 }} title="Double Happiness">
        囍
      </span>
      <div className="h-px flex-1" style={{ backgroundColor: theme.colors.primary + '40' }} />
    </div>
  );
}

export function ChineseTemplate({ invitation, guestName, isPreview }: TemplateProps) {
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
        <div className="py-5 text-center" style={{ backgroundColor: theme.colors.primary, color: '#FFD700' }}>
          <p className="text-4xl font-bold tracking-widest">囍</p>
          <p className="mt-1 text-sm tracking-widest opacity-80">百年好合 · 永浴愛河</p>
        </div>

        <CoupleSection invitation={invitation} theme={theme} />
        <DoubleLuckDivider />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <DoubleLuckDivider />
            <RsvpSection invitation={invitation} theme={theme} />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
          </>
        )}

        <div className="py-8 text-center" style={{ backgroundColor: theme.colors.primary, color: '#FFD700' }}>
          <p className="text-2xl font-bold">囍</p>
          <p className="mt-2 text-sm">{invitation.brideName} & {invitation.groomName}</p>
          <p className="mt-1 text-xs opacity-70">Selamanya bersama</p>
        </div>
      </div>
    </div>
  );
}
