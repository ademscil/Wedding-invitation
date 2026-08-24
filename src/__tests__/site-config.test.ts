import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Support contacts are published on the footer and both legal pages, and a
 * payment gateway checks that the merchant is reachable.
 *
 * These used to fall back to support@wedinvite.id and 6281234567890, which
 * shipped looking real. Anyone who clicked them reached nobody.
 */

const KEYS = ['NEXT_PUBLIC_SUPPORT_EMAIL', 'NEXT_PUBLIC_SUPPORT_WHATSAPP'] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

async function load() {
  return (await import('@/config/site')).siteConfig;
}

describe('support contacts', () => {
  it('reports nothing rather than a placeholder when unset', async () => {
    const config = await load();

    expect(config.supportEmail).toBeNull();
    expect(config.supportWhatsApp).toBeNull();
    expect(config.links.whatsapp).toBeNull();
  });

  it('treats an empty or whitespace value as unset', async () => {
    // A variable created in the dashboard but left blank is the common case.
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = '';
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = '   ';

    const config = await load();
    expect(config.supportEmail).toBeNull();
    expect(config.supportWhatsApp).toBeNull();
  });

  it('uses the configured contacts and builds a wa.me link', async () => {
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = 'halo@example.com';
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = '6281806701775';

    const config = await load();
    expect(config.supportEmail).toBe('halo@example.com');
    expect(config.links.whatsapp).toBe('https://wa.me/6281806701775');
  });

  it('trims a value pasted with stray whitespace', async () => {
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = '  6281806701775 ';

    const config = await load();
    // A space inside the URL would break the link.
    expect(config.links.whatsapp).toBe('https://wa.me/6281806701775');
  });

  it('never carries the old placeholders', async () => {
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL = 'halo@example.com';
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP = '6281806701775';

    const serialised = JSON.stringify(await load());
    expect(serialised).not.toContain('support@wedinvite.id');
    expect(serialised).not.toContain('6281234567890');
  });
});
