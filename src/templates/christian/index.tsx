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

function CrossDivider() {
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

export function ChristianTemplate({ invitation, guestName, isPreview }: TemplateProps) {
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
        {/* Scripture header */}
        <div className="py-6 text-center" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          <p className="text-sm italic" style={{ fontFamily: theme.fonts.script, fontSize: '1.1rem' }}>
            &ldquo;Kasihilah seorang akan yang lain, seperti Aku telah mengasihi kamu.&rdquo;
          </p>
          <p className="mt-1 text-xs opacity-70">— Yohanes 13:34</p>
        </div>

        <CoupleSection invitation={invitation} theme={theme} />
        <CrossDivider />
        <EventsSection invitation={invitation} theme={theme} />
        <CountdownSection invitation={invitation} theme={theme} />

        {!isPreview && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <CrossDivider />
            <RsvpSection invitation={invitation} theme={theme} />
            <GiftSection invitation={invitation} theme={theme} />
            <WishesSection invitation={invitation} theme={theme} />
          </>
        )}

        <div className="py-12 text-center" style={{ backgroundColor: theme.colors.primary, color: '#fff' }}>
          <p className="text-sm italic" style={{ fontFamily: theme.fonts.script, fontSize: '1.2rem' }}>
            &ldquo;Dua adalah lebih baik dari pada satu.&rdquo;
          </p>
          <p className="mt-1 text-xs opacity-70">— Pengkhotbah 4:9</p>
          <p className="mt-4 text-xs opacity-60">
            {invitation.brideName} & {invitation.groomName}
          </p>
        </div>
      </div>
    </div>
  );
}
