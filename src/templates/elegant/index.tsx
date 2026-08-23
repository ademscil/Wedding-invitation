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
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';

function parseSettings(settingsJson: string): InvitationSettings {
  try {
    return JSON.parse(settingsJson) as InvitationSettings;
  } catch {
    return {};
  }
}

const elegantTheme: TemplateTheme = {
  colors: {
    primary: '#6B4F3A',
    secondary: '#C9A86C',
    accent: '#8B6F5C',
    background: '#FAF6F1',
    text: '#3D2E1F',
    textMuted: '#8B7D6B',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function OrnamentalDivider({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <svg
        width="200"
        height="24"
        viewBox="0 0 200 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 12h70M130 12h70"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.5"
        />
        <path
          d="M80 12c0-6 5-10 10-10s10 4 10 10-5 10-10 10-10-4-10-10z"
          stroke={color}
          strokeWidth="0.8"
          fill="none"
          opacity="0.6"
        />
        <path
          d="M85 12c0-3.5 3-6 5-6s5 2.5 5 6-3 6-5 6-5-2.5-5-6z"
          stroke={color}
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
        />
        <circle cx="75" cy="12" r="1.5" fill={color} opacity="0.4" />
        <circle cx="125" cy="12" r="1.5" fill={color} opacity="0.4" />
      </svg>
    </div>
  );
}

export function ElegantTemplate({
  invitation,
  guestName,
  personalLink,
  isPreview,
}: TemplateProps) {
  const settings = parseSettings(invitation.settings);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const theme: TemplateTheme = {
    ...elegantTheme,
    colors: {
      ...elegantTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.colors.background }}
    >
      <Ambience theme={theme} particle="petal" />
      {/* Cover */}
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          theme={theme}
          guestName={guestName}
          onOpen={() => setIsOpened(true)}
        particle="petal"
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
          <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <OrnamentalDivider color={theme.colors.secondary} />
              <blockquote
                className="my-8 text-lg italic leading-relaxed sm:text-xl"
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                }}
              >
                &ldquo;{invitation.quote}&rdquo;
              </blockquote>
              <OrnamentalDivider color={theme.colors.secondary} />
            </motion.div>
          </section>
        )}

        {/* Couple */}
        <div style={{ backgroundColor: theme.colors.primary + '08' }}>
          <CoupleSection invitation={invitation} theme={theme} />
        </div>

        <OrnamentalDivider color={theme.colors.secondary} />

        {/* Events */}
        <EventsSection invitation={invitation} theme={theme} />

        <OrnamentalDivider color={theme.colors.secondary} />

        {/* Countdown */}
        {settings.showCountdown !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.primary + '08' }}>
              <CountdownSection invitation={invitation} theme={theme} />
            </div>
            <OrnamentalDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Love Story */}
        {settings.showLoveStory !== false && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <OrnamentalDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gallery */}
        {settings.showGallery !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.primary + '08' }}>
              <GallerySection invitation={invitation} theme={theme} />
            </div>
            <OrnamentalDivider color={theme.colors.secondary} />
          </>
        )}

        {/* RSVP */}
        {settings.showRsvp !== false && (
          <>
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
            />
            <OrnamentalDivider color={theme.colors.secondary} />
          </>
        )}

        {/* Gift */}
        {settings.showGift !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.primary + '08' }}>
              <GiftSection invitation={invitation} theme={theme} />
            </div>
            <OrnamentalDivider color={theme.colors.secondary} />
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
        <footer className="px-6 pb-24 pt-12 text-center">
          <p
            className="text-sm"
            style={{
              color: theme.colors.textMuted,
              fontFamily: theme.fonts.body,
            }}
          >
            Terima kasih atas doa dan restu Anda
          </p>
          <p
            className="mt-2 text-2xl"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.script,
            }}
          >
            {invitation.brideName} & {invitation.groomName}
          </p>
          <p
            className="mt-6 text-xs"
            style={{ color: theme.colors.textMuted + '80' }}
          >
            Powered by WedInvite
          </p>
        </footer>
      </div>
    </div>
  );
}
