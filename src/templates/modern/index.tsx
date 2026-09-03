'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoverSection } from '@/components/invitation/sections/cover-section';
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
import { InvitationClosingSection } from '@/components/invitation/sections/invitation-closing-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';

function parseSettings(settingsJson: string): InvitationSettings {
  try {
    return JSON.parse(settingsJson) as InvitationSettings;
  } catch {
    return {};
  }
}

export const modernTheme: TemplateTheme = {
  colors: {
    primary: '#1A1A1A',
    secondary: '#C4787A',
    accent: '#E8B4B8',
    background: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#6B6B6B',
  },
  fonts: {
    heading: 'var(--font-jakarta), sans-serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function GeometricDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="flex items-center gap-3">
        <div
          className="h-px w-16"
          style={{ backgroundColor: color + '30' }}
        />
        <div
          className="h-2 w-2 rotate-45"
          style={{ backgroundColor: color }}
        />
        <div
          className="h-px w-16"
          style={{ backgroundColor: color + '30' }}
        />
      </div>
    </div>
  );
}

export function ModernTemplate({
  invitation,
  guestName,
  personalLink,
  existingRsvp,
  isPreview,
}: TemplateProps) {
  const settings = parseSettings(invitation.settings);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const theme: TemplateTheme = {
    ...modernTheme,
    colors: {
      ...modernTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Ambience theme={theme} particle="sparkle" />
      {/* Cover */}
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          theme={theme}
          guestName={guestName}
          onOpen={() => setIsOpened(true)}
        particle="sparkle"
          />
      )}

      {/* Music Player */}
      {settings.musicUrl && (
        <MusicPlayer
          musicUrl={settings.musicUrl}
          theme={theme}
          autoPlayOnOpen={isOpened}
        invitationSlug={invitation.slug}
        />
      )}

      {/* Main Content */}
      <div
        className={`transition-opacity duration-1000 ${
          isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Quote Section */}
        {invitation.quote && (
          <section
            className="px-6 py-24"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <blockquote
                className="text-lg leading-relaxed sm:text-xl"
                style={{
                  color: '#FFFFFF',
                  fontFamily: theme.fonts.body,
                }}
              >
                &ldquo;{invitation.quote}&rdquo;
              </blockquote>
            </motion.div>
          </section>
        )}

        {/* Couple */}
        <CoupleSection invitation={invitation} theme={theme} />

        <GeometricDivider color={theme.colors.secondary} />

        {/* Events */}
        <EventsSection invitation={invitation} theme={theme} />

        <GeometricDivider color={theme.colors.secondary} />

        {/* Countdown */}
        {settings.showCountdown !== false && (
          <>
            <section
              className="py-0"
              style={{ backgroundColor: theme.colors.primary + '05' }}
            >
              <CountdownSection invitation={invitation} theme={theme} />
            </section>
            <GeometricDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Love Story */}
        {settings.showLoveStory !== false && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <GeometricDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gallery - full bleed */}
        {settings.showGallery !== false && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <GeometricDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Prewedding Video */}
        <VideoSection invitation={invitation} theme={theme} />

        {/* RSVP */}
        {settings.showRsvp !== false && (
          <>
            <section
              style={{ backgroundColor: theme.colors.primary + '05' }}
            >
              <RsvpSection
                invitation={invitation}
                theme={theme}
                guestName={guestName}
                personalLink={personalLink}
                existingRsvp={existingRsvp}
              />
            </section>
            <GeometricDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gift */}
        {settings.showGift !== false && (
          <>
            <GiftSection invitation={invitation} theme={theme} />
            <GeometricDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Wishes */}
        {settings.showGuestbook !== false && (
          <section
            style={{ backgroundColor: theme.colors.primary + '05' }}
          >
            <WishesSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
            />
          <WeddingInfoSection invitation={invitation} theme={theme} />
          <ShareSection invitation={invitation} theme={theme} />
          </section>
        )}

        <InvitationClosingSection invitation={invitation} theme={theme} />
      </div>
    </div>
  );
}
