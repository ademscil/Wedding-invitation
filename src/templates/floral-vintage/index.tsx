'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import type { TemplateProps, TemplateTheme } from '../types';
import type { InvitationSettings, InvitationEvent } from '@/types';
import { CoverSection } from '@/components/invitation/sections/cover-section';
import { CountdownSection } from '@/components/invitation/sections/countdown-section';
import { LoveStorySection } from '@/components/invitation/sections/love-story-section';
import { GallerySection } from '@/components/invitation/sections/gallery-section';
import { VideoSection } from '@/components/invitation/sections/video-section';
import { RsvpSection } from '@/components/invitation/sections/rsvp-section';
import { GiftSection } from '@/components/invitation/sections/gift-section';
import { WishesSection } from '@/components/invitation/sections/wishes-section';
import { WeddingInfoSection } from '@/components/invitation/sections/wedding-info-section';
import { ShareSection } from '@/components/invitation/sections/share-section';
import { InvitationClosingSection } from '@/components/invitation/sections/invitation-closing-section';
import { MusicPlayer } from '@/components/invitation/sections/music-player';
import { Ambience } from '@/components/invitation/motion';
import { coupleNames, coupleInitials } from '@/lib/invitation-data';
import {
  FloralTop,
  FloralBottom,
  GazeboBackdrop,
  Dove,
  Butterfly,
} from './florals';

export const theme: TemplateTheme = {
  colors: {
    primary: '#8B2332',
    secondary: '#C9A57E',
    accent: '#B97C86',
    background: '#F5EFE6',
    text: '#4A3B32',
    textMuted: '#7C6A5D',
  },
  fonts: {
    heading: 'var(--font-playfair), serif',
    body: 'var(--font-jakarta), sans-serif',
    script: 'var(--font-great-vibes), cursive',
  },
};

const SALAM_ARABIC =
  'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ';

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * The stored date as a person reads it. Falls back to the raw string when it
 * is not a date we can parse, which is better than printing "Invalid Date".
 */
function longDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, 'EEEE, d MMMM yyyy', { locale: localeId });
}

/** A Maps search for the venue, for events with no map link of their own. */
function mapsSearchUrl(event: InvitationEvent): string {
  const query = encodeURIComponent(
    [event.venue, event.address].filter(Boolean).join(', ')
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/** Formats a date as the reference's "13 . 04 . 25". */
function dottedDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd} . ${mm} . ${yy}`;
}

/* ------------------------------------------------------------------ *
 * A. Hero — parallax backdrop, framing florals, drifting dove
 * ------------------------------------------------------------------ */
function HeroSection({
  brideName,
  groomName,
  weddingDate,
}: {
  brideName: string;
  groomName: string;
  weddingDate: Date | null;
}) {
  return (
    <section
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Slow breathing zoom is what gives the backdrop its parallax feel */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.12 }}
        transition={{
          duration: 14,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      >
        <GazeboBackdrop className="h-full w-full opacity-60" />
      </motion.div>

      {/* Dove crossing the frame */}
      <motion.div
        className="absolute left-0 top-[22%] w-10"
        initial={{ x: '-15vw', y: 0, opacity: 0 }}
        animate={{ x: '110vw', y: [-6, -26, -6], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 13,
          delay: 2,
          repeat: Infinity,
          repeatDelay: 6,
          ease: 'easeInOut',
        }}
      >
        <Dove className="h-6 w-10" />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-[26vh]"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <FloralTop className="h-full w-full" />
      </motion.div>

      <div className="z-10 flex flex-col items-center px-6 text-center">
        <motion.p
          className="mb-5 text-sm uppercase tracking-[0.35em]"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.heading,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          The Wedding of
        </motion.p>

        <motion.h1
          className="text-5xl leading-tight sm:text-6xl"
          style={{ color: theme.colors.primary, fontFamily: theme.fonts.script }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 1 }}
        >
          {coupleNames({ brideName, groomName })}
        </motion.h1>

        <motion.div
          className="mt-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.8 }}
        >
          <span
            className="h-px w-10"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <span
            className="text-lg tracking-[0.2em]"
            style={{ color: theme.colors.text, fontFamily: theme.fonts.heading }}
          >
            {weddingDate ? dottedDate(weddingDate) : ''}
          </span>
          <span
            className="h-px w-10"
            style={{ backgroundColor: theme.colors.secondary }}
          />
        </motion.div>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[30vh]"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <FloralBottom className="h-full w-full" />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * B. Greeting — salam, framed by florals fading in from the top
 * ------------------------------------------------------------------ */
function GreetingSection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-24"
      style={{ backgroundColor: theme.colors.background }}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        initial={{ y: -40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      >
        <FloralTop className="h-full w-full" />
      </motion.div>

      <div className="relative mx-auto mt-16 max-w-xl text-center">
        <motion.p
          className="mb-6 text-2xl leading-loose"
          style={{
            color: theme.colors.primary,
            fontFamily: theme.fonts.heading,
          }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          dir="rtl"
          lang="ar"
        >
          {SALAM_ARABIC}
        </motion.p>

        <motion.p
          className="text-sm leading-relaxed"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud
          menyelenggarakan pernikahan putra-putri kami.
        </motion.p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * C. Couple — full names and parents, revealed bottom-up
 * ------------------------------------------------------------------ */
function CoupleSection({
  brideName,
  brideParents,
  bridePhoto,
  groomName,
  groomParents,
  groomPhoto,
}: {
  brideName: string;
  brideParents: string | null;
  bridePhoto: string | null;
  groomName: string;
  groomParents: string | null;
  groomPhoto: string | null;
}) {
  const people = [
    {
      name: groomName,
      parents: groomParents,
      photo: groomPhoto,
      role: 'Putra dari',
    },
    {
      name: brideName,
      parents: brideParents,
      photo: bridePhoto,
      role: 'Putri dari',
    },
  ];

  return (
    <section
      className="relative px-6 py-20"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-xl">
        {people.map((person, i) => (
          <div key={person.role}>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1, delay: i * 0.25 }}
            >
              {person.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.photo}
                  alt={person.name}
                  className="mx-auto mb-5 h-32 w-32 rounded-full object-cover shadow-md"
                  style={{ border: `2px solid ${theme.colors.secondary}` }}
                />
              )}
              <h2
                className="mb-2 text-4xl"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.script,
                }}
              >
                {person.name}
              </h2>
              {person.parents && (
                <>
                  <p
                    className="text-xs uppercase tracking-[0.2em]"
                    style={{
                      color: theme.colors.secondary,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {person.role}
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{
                      color: theme.colors.textMuted,
                      fontFamily: theme.fonts.body,
                    }}
                  >
                    {person.parents}
                  </p>
                </>
              )}
            </motion.div>

            {i === 0 && (
              <motion.p
                className="my-8 text-center text-3xl"
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.fonts.script,
                }}
                initial={{ opacity: 0, scale: 0.7 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                &amp;
              </motion.p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * D. Event timeline — line grows, then entries stagger in
 * ------------------------------------------------------------------ */
function EventTimeline({ events }: { events: InvitationEvent[] }) {
  if (events.length === 0) return null;

  // Entries wait for the line to reach them, matching the reference pacing.
  const lineDuration = 2;
  const entryDelay = (i: number) =>
    0.6 + i * ((lineDuration * 0.9) / events.length);

  return (
    <section
      className="relative overflow-hidden px-6 py-24"
      style={{ backgroundColor: theme.colors.background }}
    >
      <motion.h2
        className="mb-16 text-center text-4xl"
        style={{ color: theme.colors.primary, fontFamily: theme.fonts.script }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        Rangkaian Acara
      </motion.h2>

      <div className="relative mx-auto max-w-md">
        {/* The vertical line unrolls from the top */}
        <motion.div
          className="absolute left-1/2 top-0 h-full w-[3px] rounded-full"
          style={{
            backgroundColor: theme.colors.primary,
            translateX: '-50%',
            transformOrigin: 'top',
          }}
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: lineDuration, ease: 'easeInOut' }}
        />

        {/* Butterfly drifting alongside the timeline */}
        <motion.div
          className="pointer-events-none absolute -right-2 top-8 w-8"
          initial={{ opacity: 0, y: 0, x: 0 }}
          whileInView={{
            opacity: [0, 1, 1, 0.9],
            y: [0, 120, 240],
            x: [0, -18, 6],
          }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 6, ease: 'easeInOut', delay: 1 }}
        >
          <Butterfly className="h-7 w-8" />
        </motion.div>

        {events.map((event, i) => (
          <motion.div
            key={event.id}
            className={`relative z-10 w-full text-center ${
              i === 0 ? 'pt-4' : 'pt-24'
            }`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: entryDelay(i) }}
          >
            <span
              className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full"
              style={{
                backgroundColor: theme.colors.primary,
                top: i === 0 ? '0.25rem' : '5.25rem',
                boxShadow: `0 0 0 5px ${theme.colors.background}`,
              }}
            />

            <div
              /*
               * Opaque. At 50% white the timeline stroke behind the card came
               * through it and ran across the middle of the event name.
               */
              className="mx-auto mt-8 max-w-xs rounded-lg px-5 py-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: `0 8px 28px -18px ${theme.colors.primary}66`,
              }}
            >
              <h3
                className="mb-3 text-3xl"
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.fonts.script,
                }}
              >
                {event.name}
              </h3>
              <p className="text-sm" style={{ color: theme.colors.text }}>
                {longDate(event.date)}
              </p>
              <p className="text-sm" style={{ color: theme.colors.text }}>
                {event.startTime}
                {event.endTime ? ` - ${event.endTime}` : ' - Selesai'}
              </p>
              <p
                className="mt-2 text-sm font-medium"
                style={{ color: theme.colors.text }}
              >
                {event.venue}
              </p>
              {event.address && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: theme.colors.textMuted }}
                >
                  {event.address}
                </p>
              )}
              {(event.mapUrl || event.address) && (
                <a
                  href={event.mapUrl || mapsSearchUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full px-5 py-2 text-xs tracking-wide transition-opacity hover:opacity-85"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: '#FFF8F0',
                  }}
                >
                  Lihat Lokasi
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * E. Closing — verse, initials, florals sliding in from both edges
 * ------------------------------------------------------------------ */
function ClosingSection({
  brideName,
  groomName,
  quote,
}: {
  brideName: string;
  groomName: string;
  quote: string | null;
}) {
  const initials = coupleInitials({ brideName, groomName });

  const verse =
    quote ||
    'Dan di antara tanda-tanda kekuasaan-Nya diciptakan-Nya untukmu pasangan hidup dari jenismu sendiri supaya kamu mendapat ketenangan hati dan dijadikan-Nya kasih sayang di antara kamu.';

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24"
      style={{ backgroundColor: theme.colors.background }}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-32"
        initial={{ y: -50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      >
        <FloralTop className="h-full w-full" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <motion.blockquote
          className="text-sm italic leading-relaxed"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          &ldquo;{verse}&rdquo;
        </motion.blockquote>

        {!quote && (
          <motion.p
            className="mt-3 text-xs uppercase tracking-[0.25em]"
            style={{
              color: theme.colors.secondary,
              fontFamily: theme.fonts.body,
            }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            QS. Ar-Rum : 21
          </motion.p>
        )}

        <motion.p
          className="mt-12 text-xs uppercase tracking-[0.3em]"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 1 }}
        >
          Kami yang berbahagia
        </motion.p>

        <motion.p
          className="mt-4 text-5xl"
          style={{ color: theme.colors.primary, fontFamily: theme.fonts.script }}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 1.2 }}
        >
          {initials}
        </motion.p>
      </div>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      >
        <FloralBottom className="h-full w-full" />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function FloralVintageTemplate({
  invitation,
  guestName,
  personalLink,
  existingRsvp,
  isPreview,
}: TemplateProps) {
  const settings = parseJson<InvitationSettings>(
    invitation.settings as string,
    {}
  );
  const events = parseJson<InvitationEvent[]>(invitation.events as string, []);
  const [isOpened, setIsOpened] = useState(isPreview || false);

  const weddingDate = invitation.weddingDate
    ? new Date(invitation.weddingDate)
    : null;

  return (
    <div
      style={{
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
      }}
    >
      <Ambience theme={theme} particle="petal" />
      {!isPreview && (
        <CoverSection
          invitation={invitation}
          guestName={guestName}
          theme={theme}
          onOpen={() => setIsOpened(true)}
        particle="petal"
          />
      )}

      {settings.musicUrl && (
        <MusicPlayer
          musicUrl={settings.musicUrl}
          theme={theme}
          autoPlayOnOpen={isOpened}
        />
      )}

      <div
        className={`transition-opacity duration-1000 ${
          isOpened ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <HeroSection
          brideName={invitation.brideName}
          groomName={invitation.groomName}
          weddingDate={weddingDate}
        />

        <GreetingSection />

        <CoupleSection
          brideName={invitation.brideName}
          brideParents={invitation.brideParents}
          bridePhoto={invitation.bridePhoto}
          groomName={invitation.groomName}
          groomParents={invitation.groomParents}
          groomPhoto={invitation.groomPhoto}
        />

        <EventTimeline events={events} />

        {settings.showCountdown !== false && (
          <CountdownSection invitation={invitation} theme={theme} />
        )}

        {!isPreview && (
          <>
            <LoveStorySection invitation={invitation} theme={theme} />
            <GallerySection invitation={invitation} theme={theme} />
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

        <ClosingSection
          brideName={invitation.brideName}
          groomName={invitation.groomName}
          quote={invitation.quote}
        />

        <InvitationClosingSection invitation={invitation} theme={theme} />
      </div>
    </div>
  );
}
