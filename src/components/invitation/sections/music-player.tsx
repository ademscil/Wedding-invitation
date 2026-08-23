'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { TemplateTheme } from '@/templates/types';
import { trackEvent } from '@/lib/public-api';
import { useReducedMotion } from '../motion';

interface MusicPlayerProps {
  musicUrl?: string;
  theme: TemplateTheme;
  autoPlayOnOpen?: boolean;
  /** Slug of the invitation, so the first playback can be recorded. */
  invitationSlug?: string;
}

export function MusicPlayer({
  musicUrl,
  theme,
  autoPlayOnOpen,
  invitationSlug,
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Playback is recorded once per visit, not on every pause/resume.
  const trackedRef = useRef(false);
  const reduced = useReducedMotion();

  const recordPlay = () => {
    if (trackedRef.current || !invitationSlug) return;
    trackedRef.current = true;
    trackEvent(invitationSlug, 'MUSIC_PLAY');
  };

  useEffect(() => {
    setMounted(true);
    if (musicUrl) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicUrl]);

  useEffect(() => {
    if (autoPlayOnOpen && audioRef.current && !isPlaying) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          recordPlay();
        })
        .catch(() => {
          // Auto-play was prevented by browser
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayOnOpen]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          recordPlay();
        })
        .catch(() => {
          // Play was prevented
        });
    }
  };

  if (!musicUrl || !mounted) return null;

  return (
    <motion.button
      onClick={togglePlay}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
      style={{ backgroundColor: theme.colors.primary }}
      initial={reduced ? undefined : { opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={reduced ? undefined : { scale: 1.1 }}
      whileTap={reduced ? undefined : { scale: 0.92 }}
      aria-label={isPlaying ? 'Jeda musik' : 'Putar musik'}
      aria-pressed={isPlaying}
    >
      {/* Ring that expands out of the control while audio is playing, so the
          toggle reads as active without needing a label. */}
      {isPlaying && !reduced && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${theme.colors.primary}`,
            animation: 'wi-pulse-ring 2s ease-out infinite',
          }}
        />
      )}

      {isPlaying ? (
        // The disc turns while the track runs and stops when it is paused.
        <motion.span
          className="flex items-center justify-center"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="2.6" fill="white" />
            <path
              d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </motion.span>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.6" opacity="0.7" />
          <circle cx="12" cy="12" r="2.6" fill="white" opacity="0.7" />
          <line x1="4" y1="20" x2="20" y2="4" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
    </motion.button>
  );
}
