'use client';

import type { TemplateProps } from '@/templates/types';
import { getTemplate } from '@/templates/registry';

type InvitationRendererProps = TemplateProps;

export function InvitationRenderer({
  invitation,
  guestName,
  isPreview,
}: InvitationRendererProps) {
  const componentName = invitation.template?.componentName || 'elegant';
  const TemplateComponent = getTemplate(componentName);

  return (
    <TemplateComponent
      invitation={invitation}
      guestName={guestName}
      isPreview={isPreview}
    />
  );
}
