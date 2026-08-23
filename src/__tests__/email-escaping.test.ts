import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeSubject,
  rsvpNotificationEmail,
  wishNotificationEmail,
  verificationEmail,
  passwordResetEmail,
} from '@/lib/email';

/**
 * Guest names and messages come from the public invitation page, which anyone
 * holding the link can post to. They end up in an email the couple opens, so
 * markup in them must arrive as text, not as working HTML.
 */

const PAYLOAD = '<a href="https://phish.example">Klik untuk hadiah</a>';
const IMG = '<img src=x onerror="alert(1)">';

describe('escapeHtml', () => {
  it('neutralises the characters that start markup', () => {
    expect(escapeHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeHtml('Rina & Budi')).toBe('Rina &amp; Budi');
    expect(escapeHtml('Siti Nurhaliza')).toBe('Siti Nurhaliza');
  });

  it('accepts numbers, which templates also interpolate', () => {
    expect(escapeHtml(12)).toBe('12');
  });
});

describe('sanitizeSubject', () => {
  it('removes the newlines that would start a second header', () => {
    // A raw CRLF here is how a Bcc gets appended to someone else's mail.
    expect(sanitizeSubject('RSVP\r\nBcc: attacker@example.com')).toBe(
      'RSVP Bcc: attacker@example.com'
    );
    expect(sanitizeSubject('a\nb')).toBe('a b');
  });

  it('caps the length', () => {
    expect(sanitizeSubject('x'.repeat(500))).toHaveLength(200);
  });
});

describe('notification emails', () => {
  it('does not render a link a guest typed into their name', () => {
    const html = rsvpNotificationEmail({
      brideName: 'Rina',
      groomName: 'Budi',
      guestName: PAYLOAD,
      status: 'ATTENDING',
      guestCount: 2,
    });

    expect(html).not.toContain('<a href="https://phish.example"');
    expect(html).toContain('&lt;a href=&quot;https://phish.example&quot;&gt;');
  });

  it('does not render markup a guest typed into a wish', () => {
    const html = wishNotificationEmail({
      brideName: 'Rina',
      groomName: 'Budi',
      guestName: 'Tamu',
      message: IMG,
    });

    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;img src=x');
  });

  it('escapes the couple names too, since those are user-set', () => {
    const html = wishNotificationEmail({
      brideName: '<script>',
      groomName: 'Budi',
      guestName: 'Tamu',
      message: 'Selamat',
    });

    expect(html).not.toContain('<script>');
  });

  it('still reads correctly for ordinary input', () => {
    const html = rsvpNotificationEmail({
      brideName: 'Rina',
      groomName: 'Budi',
      guestName: 'Pak Slamet',
      status: 'NOT_ATTENDING',
      guestCount: 1,
    });

    expect(html).toContain('Pak Slamet');
    expect(html).toContain('tidak dapat hadir');
  });
});

describe('account emails', () => {
  it('escapes a display name the account holder chose', () => {
    const html = verificationEmail({
      name: '<script>alert(1)</script>',
      url: 'https://wedinvite.id/verify?token=abc',
    });

    expect(html).not.toContain('<script>');
  });

  it('does not let a name break out of the reset template', () => {
    const html = passwordResetEmail({
      name: '"><script>x</script>',
      url: 'https://wedinvite.id/reset?token=abc',
    });

    expect(html).not.toContain('<script>');
    // The real link must survive intact, or the email is useless.
    expect(html).toContain('https://wedinvite.id/reset?token=abc');
  });
});
