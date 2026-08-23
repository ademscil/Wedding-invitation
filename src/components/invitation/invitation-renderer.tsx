'use client';

import type { TemplateProps } from '@/templates/types';
import { getTemplate } from '@/templates/registry';
import { InvitationWatermark } from './watermark';

type InvitationRendererProps = TemplateProps & {
  /** Set by the server from the owner's plan; not user-controllable. */
  showWatermark?: boolean;
};

export function InvitationRenderer({
  invitation,
  guestName,
  personalLink,
  isPreview,
  showWatermark,
}: InvitationRendererProps) {
  const componentName = invitation.template?.componentName || 'elegant';
  const TemplateComponent = getTemplate(componentName);

  return (
    <>
      <TemplateComponent
        invitation={invitation}
        guestName={guestName}
        personalLink={personalLink}
        isPreview={isPreview}
      />
      {showWatermark && !isPreview && <InvitationWatermark />}
    </>
  );
}
