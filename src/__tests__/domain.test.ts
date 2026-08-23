import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  normalizeHost,
  isCustomHost,
  normalizeCustomDomain,
  isReservedDomain,
  isSubdomain,
  requiredDnsRecord,
} from '@/lib/domain';

/**
 * The host header picks which invitation a request resolves to, so a value
 * that slips through these checks becomes a tenant lookup key.
 */

const saved: Record<string, string | undefined> = {};
const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL', 'VERCEL_URL'] as const;

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.NEXT_PUBLIC_APP_URL = 'https://wedinvite.id';
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('normalizeHost', () => {
  it('drops the port and lowercases', () => {
    expect(normalizeHost('Example.COM:3000')).toBe('example.com');
    expect(normalizeHost('  localhost:3100 ')).toBe('localhost');
  });

  it('keeps an IPv6 literal intact rather than truncating at a colon', () => {
    expect(normalizeHost('[::1]:3000')).toBe('[::1]');
  });

  it('returns empty for a missing header', () => {
    expect(normalizeHost(null)).toBe('');
    expect(normalizeHost(undefined)).toBe('');
    expect(normalizeHost('')).toBe('');
  });
});

describe('isCustomHost', () => {
  it('treats the platform and its preview deployments as its own', () => {
    expect(isCustomHost('wedinvite.id')).toBe(false);
    expect(isCustomHost('localhost:3000')).toBe(false);
    expect(isCustomHost('wedinvite-git-main.vercel.app')).toBe(false);
  });

  it('treats anything else as a customer domain', () => {
    expect(isCustomHost('rina-budi.com')).toBe(true);
    expect(isCustomHost('undangan.rina-budi.com')).toBe(true);
  });

  it('does not route a missing host anywhere', () => {
    expect(isCustomHost(null)).toBe(false);
    expect(isCustomHost('')).toBe(false);
  });
});

describe('normalizeCustomDomain', () => {
  it('accepts a plain domain', () => {
    expect(normalizeCustomDomain('Rina-Budi.com')).toBe('rina-budi.com');
    expect(normalizeCustomDomain('  undangan.rina-budi.co.id  ')).toBe(
      'undangan.rina-budi.co.id'
    );
  });

  it('accepts a pasted URL, because that is what people copy', () => {
    expect(normalizeCustomDomain('https://rina-budi.com/undangan?to=x')).toBe(
      'rina-budi.com'
    );
    expect(normalizeCustomDomain('http://rina-budi.com:8080')).toBe('rina-budi.com');
  });

  it('drops a trailing dot from an FQDN', () => {
    expect(normalizeCustomDomain('rina-budi.com.')).toBe('rina-budi.com');
  });

  it.each([
    ['empty', ''],
    ['null', null],
    ['a bare label', 'localhost'],
    ['an IP address', '203.0.113.10'],
    ['a label starting with a hyphen', '-bad.com'],
    ['a label ending with a hyphen', 'bad-.com'],
    ['underscores', 'not_valid.com'],
    ['spaces', 'two words.com'],
    ['a wildcard', '*.rina-budi.com'],
  ])('refuses %s', (_label, input) => {
    expect(normalizeCustomDomain(input)).toBeNull();
  });

  it('refuses a name longer than DNS allows', () => {
    expect(normalizeCustomDomain(`${'a'.repeat(300)}.com`)).toBeNull();
  });

  it('strips credentials rather than reading the host from them', () => {
    // `evil.com@real.com` fetches real.com; taking the part before the @ would
    // store the wrong domain entirely.
    expect(normalizeCustomDomain('https://evil.com@real.com')).toBe('real.com');
  });
});

describe('isReservedDomain', () => {
  it('refuses the platform host and anything under it', () => {
    expect(isReservedDomain('wedinvite.id')).toBe(true);
    expect(isReservedDomain('app.wedinvite.id')).toBe(true);
  });

  it('refuses Vercel-owned suffixes', () => {
    expect(isReservedDomain('anything.vercel.app')).toBe(true);
    expect(isReservedDomain('vercel.app')).toBe(true);
  });

  it('allows a customer domain', () => {
    expect(isReservedDomain('rina-budi.com')).toBe(false);
    // Not a suffix match on the platform name.
    expect(isReservedDomain('notwedinvite.id')).toBe(false);
  });
});

describe('requiredDnsRecord', () => {
  it('gives an apex domain the A record, since apex cannot hold a CNAME', () => {
    expect(isSubdomain('rina-budi.com')).toBe(false);
    expect(requiredDnsRecord('rina-budi.com')).toEqual({
      type: 'A',
      name: '@',
      value: '76.76.21.21',
    });
  });

  it('gives a subdomain the CNAME', () => {
    expect(isSubdomain('undangan.rina-budi.com')).toBe(true);
    expect(requiredDnsRecord('undangan.rina-budi.com')).toEqual({
      type: 'CNAME',
      name: 'undangan',
      value: 'cname.vercel-dns.com',
    });
  });
});
