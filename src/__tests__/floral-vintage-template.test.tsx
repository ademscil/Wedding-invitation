import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloralVintageTemplate } from '@/templates/floral-vintage';
import type { TemplateProps } from '@/templates/types';

// The interactive sections pull in browser-only APIs (audio, IntersectionObserver,
// tRPC). This suite is about the template's own layout, so stub them out.
vi.mock('@/components/invitation/sections/countdown-section', () => ({
  CountdownSection: () => <div data-testid="countdown" />,
}));
vi.mock('@/components/invitation/sections/music-player', () => ({
  MusicPlayer: () => <div data-testid="music" />,
}));

function buildInvitation(
  overrides: Partial<TemplateProps['invitation']> = {}
): TemplateProps['invitation'] {
  return {
    id: 'inv_1',
    userId: 'user_1',
    slug: 'dimas-dan-kirana',
    customDomain: null,
    templateId: 'tpl_1',
    status: 'PUBLISHED',
    brideName: 'Kirana',
    groomName: 'Dimas',
    brideParents: 'Bapak A & Ibu B',
    groomParents: 'Bapak C & Ibu D',
    bridePhoto: null,
    groomPhoto: null,
    weddingDate: new Date('2025-04-13T00:00:00.000Z'),
    settings: '{}',
    events: JSON.stringify([
      {
        id: 'e1',
        name: 'Akad Nikah',
        date: 'Minggu, 13 April 2025',
        startTime: '09.00',
        venue: 'Masjid Islamic Center',
        address: 'Jakarta',
      },
      {
        id: 'e2',
        name: 'Resepsi',
        date: 'Minggu, 13 April 2025',
        startTime: '13.00',
        venue: 'Ayana Mid Plaza',
        address: 'Jakarta',
      },
    ]),
    bankAccounts: '[]',
    galleryImages: '[]',
    loveStory: '[]',
    quote: null,
    dressCode: null,
    streamingUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null,
    template: null,
    wishes: [],
    ...overrides,
  } as TemplateProps['invitation'];
}

describe('FloralVintageTemplate', () => {
  it('renders the couple and the dotted wedding date in preview mode', () => {
    render(<FloralVintageTemplate invitation={buildInvitation()} isPreview />);

    expect(screen.getAllByText(/Kirana/).length).toBeGreaterThan(0);
    expect(screen.getByText('The Wedding of')).toBeInTheDocument();
    // 13 April 2025 -> "13 . 04 . 25"
    expect(screen.getByText('13 . 04 . 25')).toBeInTheDocument();
  });

  it('renders every event on the timeline', () => {
    render(<FloralVintageTemplate invitation={buildInvitation()} isPreview />);

    expect(screen.getByText('Akad Nikah')).toBeInTheDocument();
    expect(screen.getByText('Resepsi')).toBeInTheDocument();
    expect(screen.getByText('Masjid Islamic Center')).toBeInTheDocument();
    expect(screen.getByText('Ayana Mid Plaza')).toBeInTheDocument();
  });

  it('falls back to the Ar-Rum verse when no custom quote is set', () => {
    render(<FloralVintageTemplate invitation={buildInvitation()} isPreview />);
    expect(screen.getByText('QS. Ar-Rum : 21')).toBeInTheDocument();
  });

  it('uses the custom quote and hides the default attribution when provided', () => {
    render(
      <FloralVintageTemplate
        invitation={buildInvitation({ quote: 'Cinta adalah perjalanan' })}
        isPreview
      />
    );

    expect(screen.getByText(/Cinta adalah perjalanan/)).toBeInTheDocument();
    expect(screen.queryByText('QS. Ar-Rum : 21')).not.toBeInTheDocument();
  });

  it('survives malformed JSON in the events column', () => {
    // A bad column value must not take the whole invitation page down.
    expect(() =>
      render(
        <FloralVintageTemplate
          invitation={buildInvitation({ events: 'not json' })}
          isPreview
        />
      )
    ).not.toThrow();
  });

  it('renders without a wedding date', () => {
    expect(() =>
      render(
        <FloralVintageTemplate
          invitation={buildInvitation({ weddingDate: null })}
          isPreview
        />
      )
    ).not.toThrow();
  });
});
