import { describe, it, expect } from 'vitest';
import {
  buildGuestUrl,
  normalizePhone,
  buildWhatsAppMessage,
  generateWhatsAppLink,
} from '@/lib/guest-utils';

describe('buildGuestUrl', () => {
  it('builds the personalised invitation path', () => {
    expect(buildGuestUrl('https://wedinvite.id', 'siti-dan-ahmad', 'abc123')).toBe(
      'https://wedinvite.id/siti-dan-ahmad/to/abc123'
    );
  });

  it('does not double the slash when the origin has a trailing one', () => {
    expect(buildGuestUrl('https://wedinvite.id/', 'siti-dan-ahmad', 'abc123')).toBe(
      'https://wedinvite.id/siti-dan-ahmad/to/abc123'
    );
  });
});

describe('normalizePhone', () => {
  it('converts a leading zero to the country code', () => {
    expect(normalizePhone('08123456789')).toBe('628123456789');
  });

  it('keeps a number that already starts with 62', () => {
    expect(normalizePhone('628123456789')).toBe('628123456789');
  });

  it('adds the country code to a bare 8-prefixed number', () => {
    expect(normalizePhone('8123456789')).toBe('628123456789');
  });

  it('strips spaces, dashes, and plus signs', () => {
    expect(normalizePhone('+62 812-3456-789')).toBe('628123456789');
    expect(normalizePhone('0812 3456 789')).toBe('628123456789');
  });
});

describe('buildWhatsAppMessage', () => {
  it('includes the guest, couple, and link', () => {
    const message = buildWhatsAppMessage(
      'Budi Santoso',
      'https://wedinvite.id/siti-dan-ahmad/to/abc123',
      'Siti',
      'Ahmad'
    );

    expect(message).toContain('Budi Santoso');
    expect(message).toContain('*Siti & Ahmad*');
    expect(message).toContain('https://wedinvite.id/siti-dan-ahmad/to/abc123');
  });
});

describe('generateWhatsAppLink', () => {
  it('targets wa.me with a normalised number and encoded text', () => {
    const link = generateWhatsAppLink(
      'Budi',
      '08123456789',
      'https://wedinvite.id/x/to/abc',
      'Siti',
      'Ahmad'
    );

    expect(link.startsWith('https://wa.me/628123456789?text=')).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toContain('Budi');
  });
});
