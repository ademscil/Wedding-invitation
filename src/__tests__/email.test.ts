import { describe, it, expect } from 'vitest';
import { rsvpNotificationEmail, wishNotificationEmail } from '@/lib/email';

describe('rsvpNotificationEmail', () => {
  it('renders attending status in Indonesian', () => {
    const html = rsvpNotificationEmail({
      brideName: 'Siti',
      groomName: 'Ahmad',
      guestName: 'Budi',
      status: 'ATTENDING',
      guestCount: 2,
    });
    expect(html).toContain('Budi');
    expect(html).toContain('akan hadir');
    expect(html).toContain('Siti');
    expect(html).toContain('Ahmad');
    expect(html).toContain('Jumlah tamu: 2');
  });

  it('renders not-attending status', () => {
    const html = rsvpNotificationEmail({
      brideName: 'Siti',
      groomName: 'Ahmad',
      guestName: 'Budi',
      status: 'NOT_ATTENDING',
      guestCount: 1,
    });
    expect(html).toContain('tidak dapat hadir');
  });

  it('renders maybe status', () => {
    const html = rsvpNotificationEmail({
      brideName: 'Siti',
      groomName: 'Ahmad',
      guestName: 'Budi',
      status: 'MAYBE',
      guestCount: 1,
    });
    expect(html).toContain('mungkin hadir');
  });
});

describe('wishNotificationEmail', () => {
  it('renders guest name and message', () => {
    const html = wishNotificationEmail({
      brideName: 'Siti',
      groomName: 'Ahmad',
      guestName: 'Budi',
      message: 'Selamat menempuh hidup baru!',
    });
    expect(html).toContain('Budi');
    expect(html).toContain('Selamat menempuh hidup baru!');
    expect(html).toContain('Siti');
    expect(html).toContain('Ahmad');
  });
});
