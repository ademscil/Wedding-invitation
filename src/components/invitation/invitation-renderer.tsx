'use client';

import type { CSSProperties } from 'react';
import type { TemplateProps } from '@/templates/types';
import { getTemplate, getTemplateTheme } from '@/templates/registry';
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
    '--wi-stage-glow': alpha(theme.colors.secondary, '1f'),
    '--wi-stage-edge': alpha(theme.colors.secondary, '33'),
  } as CSSProperties;

  return (
    <div className="wi-stage relative" style={stageStyle}>
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
      <div className={isDraftPreview ? 'wi-canvas pt-8' : 'wi-canvas'}>{template}</div>
      {showWatermark && <InvitationWatermark />}
    </div>
  );
}
