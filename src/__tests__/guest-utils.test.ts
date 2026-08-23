import { describe, it, expect } from 'vitest';
import { generateWhatsAppLink, generateGuestQrCode } from '@/lib/guest-utils';

describe('generateWhatsAppLink', () => {
  it('builds a wa.me link with encoded message', () => {
    const link = generateWhatsAppLink(
      'Budi',
      '081234567890',
      'https://wedinvite.id/siti-ahmad',
      'Siti',
      'Ahmad'
    );

    expect(link).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
    const decoded = decodeURIComponent(link.split('?text=')[1]);
    expect(decoded).toContain('Budi');
    expect(decoded).toContain('Siti & Ahmad');
    expect(decoded).toContain('https://wedinvite.id/siti-ahmad');
  });

  it('normalizes leading zero to country code 62', () => {
    const link = generateWhatsAppLink('Ani', '0812-3456-7890', 'https://x.id/a', 'A', 'B');
    expect(link).toContain('wa.me/6281234567890');
  });

  it('strips non-digit characters from phone number', () => {
    const link = generateWhatsAppLink('Ani', '+62 812 3456 7890', 'https://x.id/a', 'A', 'B');
    expect(link).toContain('wa.me/6281234567890');
  });
});

describe('generateGuestQrCode', () => {
  it('returns a PNG data URL encoding the personal link', async () => {
    const dataUrl = await generateGuestQrCode(
      'abc123',
      'https://wedinvite.id',
      'siti-ahmad'
    );
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
