'use client';

import type { CSSProperties } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar, MousePointerClick, Heart } from 'lucide-react';
import type { TemplateProps } from '@/templates/types';
import { getTemplate, getTemplateTheme } from '@/templates/registry';
import { coupleNames, coupleInitials, parseGalleryImages } from '@/lib/invitation-data';
import { InvitationWatermark } from './watermark';

type InvitationRendererProps = TemplateProps & {
  /** Set by the server from the owner's plan; not user-controllable. */
  showWatermark?: boolean;
  isDraftPreview?: boolean;
};

/** Hex colour plus an alpha suffix, guarding against a malformed theme value. */
function alpha(hex: string, suffix: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${suffix}` : hex;
}

export function InvitationRenderer({
  invitation,
  guestName,
  personalLink,
  existingRsvp,
  isPreview,
  showWatermark,
  isDraftPreview,
}: InvitationRendererProps) {
  const componentName = invitation.template?.componentName || 'elegant';
  const TemplateComponent = getTemplate(componentName);
  const theme = getTemplateTheme(componentName);

  const couple = coupleNames(invitation);
  const initials = coupleInitials(invitation);
  const gallery = parseGalleryImages(invitation.galleryImages);
  const ambientPhoto = invitation.bridePhoto || invitation.groomPhoto || gallery[0]?.url;

  const formattedDate = invitation.weddingDate
    ? format(new Date(invitation.weddingDate), 'EEEE, d MMMM yyyy', { locale: localeId })
    : null;

  const template = (
    <TemplateComponent
      invitation={invitation}
      guestName={guestName}
      personalLink={personalLink}
      existingRsvp={existingRsvp}
      isPreview={isPreview}
    />
  );

  /*
   * The preview pane inside the dashboard is already a narrow box; framing it
   * a second time would just shrink the design further, so the stage is only
   * used for the public page.
   */
  if (isPreview) return template;

  const stageStyle = {
    '--wi-stage-bg': theme.colors.background,
    '--wi-stage-glow': alpha(theme.colors.secondary, '2a'),
    '--wi-stage-edge': alpha(theme.colors.secondary, '33'),
  } as CSSProperties;

  return (
    <div className="wi-stage relative min-h-screen overflow-x-hidden" style={stageStyle}>
      {/* Desktop Ambient Background Photo */}
      {ambientPhoto && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 hidden lg:block overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ambientPhoto}
            alt=""
            className="h-full w-full object-cover opacity-15 filter blur-3xl scale-110 transform"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, transparent 30%, ${theme.colors.background} 85%)`,
            }}
          />
        </div>
      )}

      {/* Desktop Left Showcase Pane (Screens >= 1024px) */}
      <aside
        aria-hidden="true"
        className="pointer-events-none fixed left-8 xl:left-14 top-1/2 -translate-y-1/2 z-20 hidden lg:flex flex-col space-y-6 max-w-[280px] xl:max-w-xs text-left"
        style={{ color: theme.colors.text }}
      >
        {/* Monogram Seal */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-md"
          style={{
            borderColor: theme.colors.secondary + '50',
            backgroundColor: theme.colors.secondary + '18',
            color: theme.colors.primary,
          }}
        >
          <span
            className="text-2xl font-serif tracking-widest"
            style={{ fontFamily: theme.fonts.heading }}
          >
            {initials}
          </span>
        </div>

        <div>
          <p
            className="text-xs uppercase tracking-[0.3em] font-medium"
            style={{ color: theme.colors.secondary }}
          >
            The Wedding Of
          </p>
          <h1
            className="mt-2 text-3xl xl:text-4xl font-semibold leading-tight drop-shadow-sm"
            style={{
              fontFamily: theme.fonts.heading,
              color: theme.colors.text,
            }}
          >
            {couple}
          </h1>
        </div>

        {formattedDate && (
          <div className="flex items-center gap-2.5 text-xs xl:text-sm" style={{ color: theme.colors.textMuted }}>
            <Calendar size={16} style={{ color: theme.colors.primary }} />
            <span>{formattedDate}</span>
          </div>
        )}

        {invitation.quote && (
          <blockquote
            className="border-l-2 pl-3 text-xs italic leading-relaxed opacity-75 line-clamp-3"
            style={{ borderColor: theme.colors.primary, color: theme.colors.textMuted }}
          >
            &ldquo;{invitation.quote}&rdquo;
          </blockquote>
        )}

        <div className="pt-2 flex items-center gap-2 text-xs font-medium opacity-80" style={{ color: theme.colors.textMuted }}>
          <MousePointerClick size={15} className="animate-bounce" style={{ color: theme.colors.primary }} />
          <span>Gulir kartu untuk membaca undangan</span>
        </div>
      </aside>

      {/* Desktop Right Showcase Pane (Screens >= 1280px) */}
      <aside
        aria-hidden="true"
        className="pointer-events-none fixed right-8 xl:right-14 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col items-end space-y-4 max-w-xs text-right"
        style={{ color: theme.colors.textMuted }}
      >
        <div
          className="rounded-xl border px-4 py-3 shadow-md backdrop-blur-md text-xs space-y-1"
          style={{
            borderColor: theme.colors.secondary + '30',
            backgroundColor: theme.colors.background + 'B3',
          }}
        >
          <p className="font-semibold" style={{ color: theme.colors.primary }}>
            Undangan Digital Resmi
          </p>
          <p className="text-[11px] opacity-80">
            Dipersiapkan khusus untuk momen istimewa kedua mempelai
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] opacity-60">
          <span>WedInvite Luxury Studio</span>
          <Heart size={11} className="fill-current text-rose-500" />
        </div>
      </aside>

      {/* Draft Preview Bar */}
      {isDraftPreview && (
        <div className="fixed top-0 inset-x-0 z-[100] flex items-center justify-between bg-amber-600/95 px-4 py-2 text-xs font-medium text-white shadow-md backdrop-blur-sm">
          <span>Mode Pratinjau (Draft) — Undangan ini belum dipublikasikan</span>
          <a
            href={`/dashboard/invitations/${invitation.id}`}
            className="rounded bg-white/20 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/30"
          >
            Kembali ke Editor
          </a>
        </div>
      )}

      {/* The Central Canvas (Smartphone Frame on Desktop, Full-bleed on Mobile) */}
      <div
        className={
          isDraftPreview
            ? 'wi-canvas pt-8 lg:my-8 lg:rounded-[36px] lg:overflow-hidden lg:shadow-[0_30px_100px_-15px_rgba(0,0,0,0.7)] lg:border lg:border-white/15'
            : 'wi-canvas lg:my-8 lg:rounded-[36px] lg:overflow-hidden lg:shadow-[0_30px_100px_-15px_rgba(0,0,0,0.7)] lg:border lg:border-white/15'
        }
      >
        {template}
      </div>

      {showWatermark && <InvitationWatermark />}
    </div>
  );
}
