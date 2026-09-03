import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvitationClosingSection } from '@/components/invitation/sections/invitation-closing-section';
import type { Invitation } from '@prisma/client';
import type { TemplateTheme } from '@/templates/types';

const mockTheme: TemplateTheme = {
  colors: {
    primary: '#D4AF37',
    secondary: '#F5E6BE',
    accent: '#9A7B38',
    background: '#0D0D0D',
    text: '#FFFFFF',
    textMuted: '#B8A88A',
  },
  fonts: {
    heading: 'serif',
    body: 'sans-serif',
    script: 'cursive',
  },
};

const mockInvitation = {
  id: 'inv_test',
  brideName: 'Aisyah',
  groomName: 'Adam',
  brideParents: 'Bpk. Ahmad & Ibu Siti',
  groomParents: 'Bpk. Budi & Ibu Maya',
  settings: '{}',
} as unknown as Invitation;

describe('InvitationClosingSection', () => {
  it('renders couple names, heartfelt closing message, and parents info', () => {
    render(
      <InvitationClosingSection
        invitation={mockInvitation}
        theme={mockTheme}
        greeting="Wassalamu'alaikum Warahmatullahi Wabarakatuh"
      />
    );

    expect(
      screen.getByText(/Merupakan suatu kehormatan dan kebahagiaan bagi kami/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Wassalamu'alaikum Warahmatullahi Wabarakatuh")
    ).toBeInTheDocument();
    expect(screen.getByText('Kami yang berbahagia')).toBeInTheDocument();
    expect(screen.getByText(/Adam & Aisyah/i)).toBeInTheDocument();
    expect(screen.getByText(/Bpk\. Ahmad & Ibu Siti/i)).toBeInTheDocument();
    expect(screen.getByText(/Bpk\. Budi & Ibu Maya/i)).toBeInTheDocument();
    expect(screen.getByText('WedInvite')).toBeInTheDocument();
  });
});
