'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';
import { parseSettings, isSectionVisible } from '@/lib/invitation-data';

interface CountdownSectionProps {
  invitation: Invitation;
  theme: TemplateTheme;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft | null {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) return null;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownUnit({
  value,
  label,
  theme,
}: {
  value: number;
  label: string;
  theme: TemplateTheme;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold sm:h-20 sm:w-20 sm:text-3xl"
        style={{
          backgroundColor: theme.colors.primary + '15',
          color: theme.colors.primary,
          fontFamily: theme.fonts.heading,
        }}
        key={value}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span
        className="mt-2 text-xs uppercase tracking-widest"
        style={{
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.body,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownSection({ invitation, theme }: CountdownSectionProps) {
  // Owners can hide this section from the invitation settings.
  const visible = isSectionVisible(parseSettings(invitation.settings), 'showCountdown');

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isPast, setIsPast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (!invitation.weddingDate) return;

    const targetDate = new Date(invitation.weddingDate);

    const updateCountdown = () => {
      const remaining = calculateTimeLeft(targetDate);
      if (remaining) {
        setTimeLeft(remaining);
        setIsPast(false);
      } else {
        setTimeLeft(null);
        setIsPast(true);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [invitation.weddingDate]);

  if (!visible || !invitation.weddingDate) return null;

  return (
    <section className="px-6 py-20" style={{ backgroundColor: theme.colors.background }}>
      <motion.div
        className="mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2
          className="mb-2 text-3xl sm:text-4xl"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
          }}
        >
          Menghitung Hari
        </h2>
        <p
          className="mb-10 text-sm tracking-widest"
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
          }}
        >
          Menuju hari bahagia
        </p>

        {mounted && isPast ? (
          <motion.p
            className="text-2xl sm:text-3xl"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.script,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            Hari Bahagia Telah Tiba!
          </motion.p>
        ) : mounted && timeLeft ? (
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            <CountdownUnit value={timeLeft.days} label="Hari" theme={theme} />
            <span
              className="text-2xl font-light"
              style={{ color: theme.colors.secondary }}
            >
              :
            </span>
            <CountdownUnit value={timeLeft.hours} label="Jam" theme={theme} />
            <span
              className="text-2xl font-light"
              style={{ color: theme.colors.secondary }}
            >
              :
            </span>
            <CountdownUnit
              value={timeLeft.minutes}
              label="Menit"
              theme={theme}
            />
            <span
              className="text-2xl font-light"
              style={{ color: theme.colors.secondary }}
            >
              :
            </span>
            <CountdownUnit
              value={timeLeft.seconds}
              label="Detik"
              theme={theme}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 sm:gap-6">
            {['Hari', 'Jam', 'Menit', 'Detik'].map((label) => (
              <CountdownUnit key={label} value={0} label={label} theme={theme} />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
