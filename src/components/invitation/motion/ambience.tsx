'use client';

import type { TemplateTheme } from '@/templates/types';
import { AmbientParticles, type ParticleKind } from './ambient-particles';
import { ScrollProgress } from './scroll-cue';

interface AmbienceProps {
  theme: TemplateTheme;
  /** Drift that suits the template — petals, leaves, sparkles or snow. */
  particle?: ParticleKind;
  /** Particles alive at once. Lower it on busy templates. */
  count?: number;
  /** Set once the cover has been dismissed. */
  active?: boolean;
}

/**
 * The always-on motion layer behind an invitation: a slow drift of petals and
 * a reading-progress bar.
 *
 * Templates render this once at their root. Both parts respect the visitor's
 * reduced-motion setting and cost nothing when it is on.
 */
export function Ambience({
  theme,
  particle = 'petal',
  count = 12,
  active = true,
}: AmbienceProps) {
  if (!active) return null;

  return (
    <>
      <ScrollProgress color={theme.colors.primary} />
      <AmbientParticles kind={particle} color={theme.colors.secondary} count={count} />
    </>
  );
}
