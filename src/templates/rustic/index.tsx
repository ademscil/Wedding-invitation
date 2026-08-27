'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { EventsSection } from '@/components/invitation/sections/events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { LoveStorySection } from '@/components/invitation/sections/love-story-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { VideoSection } from '@/components/invitation/sections/video-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { coupleNames } from '@/lib/invitation-data';

function parseSettings(settingsJson: string): InvitationSettings {
  try {
    return JSON.parse(settingsJson) as InvitationSettings;
  } catch {
    return {};
  }
}

export const rusticTheme: TemplateTheme = {
  colors: {
    primary: '#5C4033',
    secondary: '#A0785A',
    accent: '#8B9D6A',
    background: '#FDF8F3',
    text: '#3E2B1F',
    textMuted: '#7A6048',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function LeafDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <svg width="220" height="32" viewBox="0 0 220 32" fill="none">
        <path d="M0 16h70M150 16h70" stroke={color} strokeWidth="0.5" opacity="0.4" />
        {/* Drawn from x=90 so the leaf is centred on the 220-wide box, in line
            with the rules and the berries either side of it. */}
        <path d="M90 16c5-8 12-12 20-12s15 4 20 12" fill={color} opacity="0.15" />
        <path d="M90 16c5 8 12 12 20 12s15-4 20-12" fill={color} opacity="0.15" />
        <circle cx="78" cy="16" r="2" fill={color} opacity="0.4" />
        <circle cx="142" cy="16" r="2" fill={color} opacity="0.4" />
        <circle cx="110" cy="4" r="2.5" fill={color} opacity="0.3" />
        <circle cx="110" cy="28" r="2.5" fill={color} opacity="0.3" />
      </svg>
    </div>
  );
}

export function RusticTemplate({ invitation, guestName,
  personalLink, isPreview }: TemplateProps) {
  const settings = parseSettings(invitation.settings);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const theme: TemplateTheme = {
    ...rusticTheme,
    colors: {
      ...rusticTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Ambience theme={theme} particle="leaf" />
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          theme={theme}
          guestName={guestName}
          onOpen={() => setIsOpened(true)}
        particle="leaf"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} invitationSlug={invitation.slug}
        />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {invitation.quote && (
          <section className="px-6 py-16" style={{ backgroundColor: theme.colors.secondary + '15' }}>
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <LeafDivider color={theme.colors.accent} />
              <blockquote
                className="my-6 text-lg italic leading-relaxed"
                style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
              >
                &ldquo;{invitation.quote}&rdquo;
              </blockquote>
              <LeafDivider color={theme.colors.accent} />
            </motion.div>
          </section>
        )}

        <div style={{ backgroundColor: theme.colors.secondary + '10' }}>
          <CoupleSection invitation={invitation} theme={theme} />
        </div>
        <LeafDivider color={theme.colors.accent} />

        <EventsSection invitation={invitation} theme={theme} />
        <LeafDivider color={theme.colors.accent} />

        {settings.showCountdown !== false && (
          <>
            <CountdownSection invitation={invitation} theme={theme} />
            <LeafDivider color={theme.colors.accent} />
          </>
        )}

        {settings.showLoveStory !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.secondary + '10' }}>
              <LoveStorySection invitation={invitation} theme={theme} />
            </div>
            <LeafDivider color={theme.colors.accent} />
          </>
        )}

        {settings.showGallery !== false && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <LeafDivider color={theme.colors.accent} />
          </>
        )}

        {/* Prewedding Video */}
        <VideoSection invitation={invitation} theme={theme} />

        {settings.showRsvp !== false && (
          <>
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
            />
            <LeafDivider color={theme.colors.accent} />
          </>
        )}

        {settings.showGift !== false && (
          <>
            <GiftSection invitation={invitation} theme={theme} />
            <LeafDivider color={theme.colors.accent} />
          </>
        )}

        {settings.showGuestbook !== false && (
          <WishesSection invitation={invitation} theme={theme} guestName={guestName} />
        )}

        <WeddingInfoSection invitation={invitation} theme={theme} />
        <ShareSection invitation={invitation} theme={theme} />

        <footer className="px-6 pb-24 pt-12 text-center">
          <LeafDivider color={theme.colors.accent} />
          <p className="text-sm" style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}>
            Terima kasih atas doa dan restu Anda
          </p>
          <p className="mt-3 text-3xl" style={{ color: theme.colors.primary, fontFamily: theme.fonts.script }}>
            {coupleNames(invitation)}
          </p>
        </footer>
      </div>
    </div>
  );
}
