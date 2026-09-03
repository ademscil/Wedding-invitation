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
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';
import { coupleNames } from '@/lib/invitation-data';

function parseSettings(settingsJson: string): InvitationSettings {
  try {
    return JSON.parse(settingsJson) as InvitationSettings;
  } catch {
    return {};
  }
}

export const minimalistTheme: TemplateTheme = {
  colors: {
    primary: '#2C2C2C',
    secondary: '#A0A0A0',
    accent: '#4A4A4A',
    background: '#FFFFFF',
    text: '#2C2C2C',
    textMuted: '#999999',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function ThinLineDivider({ color }: { color: string }) {
  return (
    <div className="flex justify-center py-8">
      <div
        className="h-px w-24"
        style={{ backgroundColor: color + '40' }}
      />
    </div>
  );
}

export function MinimalistTemplate({
  invitation,
  guestName,
  personalLink,
  existingRsvp,
  isPreview,
}: TemplateProps) {
  const settings = parseSettings(invitation.settings);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const theme: TemplateTheme = {
    ...minimalistTheme,
    colors: {
      ...minimalistTheme.colors,
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
          <section className="px-6 py-24">
            <motion.div
              className="mx-auto max-w-xl text-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            >
              <blockquote
                className="text-base italic leading-loose"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                {invitation.quote}
              </blockquote>
            </motion.div>
          </section>
        )}

        <ThinLineDivider color={theme.colors.secondary} />

        {/* Couple */}
        <CoupleSection invitation={invitation} theme={theme} />

        <ThinLineDivider color={theme.colors.secondary} />

        {/* Events */}
        <EventsSection invitation={invitation} theme={theme} />

        <ThinLineDivider color={theme.colors.secondary} />

        {/* Countdown */}
        {settings.showCountdown !== false && (
          <>
            <CountdownSection invitation={invitation} theme={theme} />
            <ThinLineDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Love Story */}
        {settings.showLoveStory !== false && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <ThinLineDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gallery */}
        {settings.showGallery !== false && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <ThinLineDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Prewedding Video */}
        <VideoSection invitation={invitation} theme={theme} />

        {/* RSVP */}
        {settings.showRsvp !== false && (
          <>
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
              existingRsvp={existingRsvp}
            />
            <ThinLineDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gift */}
        {settings.showGift !== false && (
          <>
            <GiftSection invitation={invitation} theme={theme} />
            <ThinLineDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Wishes */}
        {settings.showGuestbook !== false && (
          <WishesSection
            invitation={invitation}
            theme={theme}
            guestName={guestName}
          />
        )}

        <WeddingInfoSection invitation={invitation} theme={theme} />
        <ShareSection invitation={invitation} theme={theme} />

        {/* Footer */}
        <footer className="px-6 pb-24 pt-16 text-center">
          <ThinLineDivider color={theme.colors.secondary} />
          <p
            className="text-xs uppercase tracking-[0.25em]"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            {coupleNames(invitation)}
          </p>
          <p
            className="mt-8 text-xs"
            style={{ color: theme.colors.textMuted + '60' }}
          >
            Powered by WedInvite
          </p>
        </footer>
      </div>
    </div>
  );
}
