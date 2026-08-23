'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings } from '@/types';
import { CoupleSection } from '@/components/invitation/sections/couple-section';
import { EventsSection } from '@/components/invitation/sections/events-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';
import { CoverSection } from '@/components/invitation/sections/cover-section';

function parseSettings(settingsJson: string): InvitationSettings {
  try {
    return JSON.parse(settingsJson) as InvitationSettings;
  } catch {
    return {};
  }
}

const islamicTheme: TemplateTheme = {
  colors: {
    primary: '#1B4332',
    secondary: '#D4AF37',
    accent: '#40916C',
    background: '#F8F9F4',
    text: '#1B2A1B',
    textMuted: '#4A6741',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-inter), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

function ArabicOrnament({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center py-6">
      <svg width="240" height="40" viewBox="0 0 240 40" fill="none">
        <path d="M0 20h80M160 20h80" stroke={color} strokeWidth="0.5" opacity="0.4" />
        <path d="M90 20c0-5 4-9 10-9s10 4 10 9" stroke={color} strokeWidth="0.8" fill="none" opacity="0.6" />
        <path d="M110 20c0 5 4 9 10 9s10-4 10-9" stroke={color} strokeWidth="0.8" fill="none" opacity="0.6" />
        <circle cx="85" cy="20" r="2" fill={color} opacity="0.5" />
        <circle cx="155" cy="20" r="2" fill={color} opacity="0.5" />
        <circle cx="120" cy="8" r="3" fill={color} opacity="0.4" />
        <circle cx="120" cy="32" r="3" fill={color} opacity="0.4" />
      </svg>
    </div>
  );
}

export function IslamicTemplate({ invitation, guestName,
  personalLink, isPreview }: TemplateProps) {
  const settings = parseSettings(invitation.settings);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const theme: TemplateTheme = {
    ...islamicTheme,
    colors: {
      ...islamicTheme.colors,
      ...(settings.primaryColor && { primary: settings.primaryColor }),
      ...(settings.secondaryColor && { secondary: settings.secondaryColor }),
    },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Ambience theme={theme} particle="sparkle" />
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          theme={theme}
          guestName={guestName}
          onOpen={() => setIsOpened(true)}
        particle="sparkle"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer musicUrl={settings.musicUrl} theme={theme} autoPlayOnOpen={isOpened} invitationSlug={invitation.slug}
        />
      )}

      <div className={`transition-opacity duration-1000 ${isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        {/* Bismillah */}
        <section className="px-6 py-16 text-center" style={{ backgroundColor: theme.colors.primary }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="mb-2 text-3xl" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.script }}>
              Bismillahirrahmanirrahim
            </p>
            <p className="text-sm tracking-widest" style={{ color: theme.colors.secondary + 'CC', fontFamily: theme.fonts.body }}>
              DENGAN MENYEBUT NAMA ALLAH YANG MAHA PENGASIH LAGI MAHA PENYAYANG
            </p>
          </motion.div>
        </section>

        {/* Quote */}
        {invitation.quote && (
          <section className="px-6 py-14" style={{ backgroundColor: theme.colors.background }}>
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <ArabicOrnament color={theme.colors.secondary} />
              <blockquote
                className="my-6 text-lg italic leading-relaxed"
                style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.body }}
              >
                &ldquo;{invitation.quote}&rdquo;
              </blockquote>
              <ArabicOrnament color={theme.colors.secondary} />
            </motion.div>
          </section>
        )}

        <CoupleSection invitation={invitation} theme={theme} />
        <ArabicOrnament color={theme.colors.secondary} />
        <EventsSection invitation={invitation} theme={theme} />
        <ArabicOrnament color={theme.colors.secondary} />

        {settings.showCountdown !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.primary + '08' }}>
              <CountdownSection invitation={invitation} theme={theme} />
            </div>
            <ArabicOrnament color={theme.colors.secondary} />
          </>
        )}

        {settings.showGallery !== false && (
          <>
            <GallerySection invitation={invitation} theme={theme} />
            <ArabicOrnament color={theme.colors.secondary} />
          </>
        )}

        {settings.showRsvp !== false && (
          <>
            <RsvpSection
              invitation={invitation}
              theme={theme}
              guestName={guestName}
              personalLink={personalLink}
            />
            <ArabicOrnament color={theme.colors.secondary} />
          </>
        )}

        {settings.showGift !== false && (
          <>
            <div style={{ backgroundColor: theme.colors.primary + '08' }}>
              <GiftSection invitation={invitation} theme={theme} />
            </div>
            <ArabicOrnament color={theme.colors.secondary} />
          </>
        )}

        {settings.showGuestbook !== false && (
          <WishesSection invitation={invitation} theme={theme} guestName={guestName} />
        )}

        <WeddingInfoSection invitation={invitation} theme={theme} />
        <ShareSection invitation={invitation} theme={theme} />

        <footer className="px-6 pb-24 pt-12 text-center" style={{ backgroundColor: theme.colors.primary }}>
          <p className="text-lg" style={{ color: theme.colors.secondary + 'CC', fontFamily: theme.fonts.body }}>
            Wassalamualaikum Warahmatullahi Wabarakatuh
          </p>
          <p className="mt-4 text-3xl" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.script }}>
            {invitation.brideName} & {invitation.groomName}
          </p>
        </footer>
      </div>
    </div>
  );
}
