'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion, useMounted } from './use-motion-preference';

export type ParticleKind = 'petal' | 'sparkle' | 'leaf' | 'snow';

interface AmbientParticlesProps {
  kind?: ParticleKind;
  color: string;
  /** How many particles are alive at once. Kept low for phone battery. */
  count?: number;
  className?: string;
}

interface Particle {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  opacity: number;
}

/** Deterministic pseudo-random so the server and client agree on layout. */
function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: seeded(i, 1) * 100,
    size: 8 + seeded(i, 2) * 14,
    duration: 9 + seeded(i, 3) * 11,
    delay: seeded(i, 4) * -20,
    drift: (seeded(i, 5) - 0.5) * 120,
    spin: 180 + seeded(i, 6) * 540,
    opacity: 0.25 + seeded(i, 7) * 0.4,
  }));
}

function ParticleShape({ kind, color, size }: { kind: ParticleKind; color: string; size: number }) {
  if (kind === 'sparkle') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z"
          fill={color}
        />
      </svg>
    );
  }

  if (kind === 'snow') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill={color} />
      </svg>
    );
  }

  if (kind === 'leaf') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C6 6 3 11 4 18c7 1 12-2 16-8-4-4-6-6-8-8z"
          fill={color}
        />
        <path d="M5 18C9 14 13 10 18 8" stroke={color} strokeWidth="0.8" opacity="0.5" />
      </svg>
    );
  }

  // Petal
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="12" rx="6" ry="10" fill={color} transform="rotate(25 12 12)" />
    </svg>
  );
}

/**
 * A slow drift of petals behind the invitation content.
 *
 * Implemented as CSS keyframes on `transform` and `opacity` only, so the whole
 * layer stays on the compositor and never triggers layout. The animation is
 * paused while the tab is hidden and skipped entirely for visitors who asked
 * for reduced motion.
 */
export function AmbientParticles({
  kind = 'petal',
  color,
  count = 14,
  className,
}: AmbientParticlesProps) {
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(() => buildParticles(count), [count]);

  // Stop animating in a background tab; there is nobody watching.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  if (reduced || !mounted) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`wi-fixed pointer-events-none fixed inset-y-0 left-[var(--wi-gutter)] right-[var(--wi-gutter)] z-0 overflow-hidden ${className ?? ''}`}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute top-0 will-change-transform"
          style={{
            left: `${particle.left}%`,
            opacity: particle.opacity,
            animation: `wi-fall ${particle.duration}s linear ${particle.delay}s infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            ['--wi-drift' as string]: `${particle.drift}px`,
            ['--wi-spin' as string]: `${particle.spin}deg`,
          }}
        >
          <ParticleShape kind={kind} color={color} size={particle.size} />
        </span>
      ))}
    </div>
  );
}
