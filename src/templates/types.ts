import type { Invitation, Template, Wish } from '@prisma/client';

export interface TemplateTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textMuted: string;
  };
  fonts: {
    heading: string;
    body: string;
    script: string;
  };
}

export interface ExistingRsvp {
  status: string;
  guestCount?: number | null;
  dietaryNotes?: string | null;
}

export interface TemplateProps {
  invitation: Invitation & { template: Template | null; wishes: Wish[] };
  guestName?: string;
  /** Personal link code of the guest viewing, so RSVP updates their record. */
  personalLink?: string;
  existingRsvp?: ExistingRsvp;
  isPreview?: boolean;
}
