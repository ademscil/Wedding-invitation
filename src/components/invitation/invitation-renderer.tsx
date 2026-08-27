'use client';

import type { CSSProperties } from 'react';
import type { TemplateProps } from '@/templates/types';
import { getTemplate, getTemplateTheme } from '@/templates/registry';
import { InvitationWatermark } from './watermark';

type InvitationRendererProps = TemplateProps & {
  /** Set by the server from the owner's plan; not user-controllable. */
  showWatermark?: boolean;
};

/** Hex colour plus an alpha suffix, guarding against a malformed theme value. */
function alpha(hex: string, suffix: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${suffix}` : hex;
}

export function InvitationRenderer({
  invitation,
  guestName,
  personalLink,
  isPreview,
  showWatermark,
}: InvitationRendererProps) {
  const componentName = invitation.template?.componentName || 'elegant';
  const TemplateComponent = getTemplate(componentName);
  const theme = getTemplateTheme(componentName);

  const template = (
    <TemplateComponent
      invitation={invitation}
      guestName={guestName}
      personalLink={personalLink}
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
    <div className="wi-stage" style={stageStyle}>
      <div className="wi-canvas">{template}</div>
      {showWatermark && <InvitationWatermark />}
    </div>
  );
}
