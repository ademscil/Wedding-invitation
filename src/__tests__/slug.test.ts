import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  slugify,
  assertValidSlug,
  isReservedSlug,
  SLUG_PATTERN,
} from '@/server/lib/slug';

describe('slugify', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugify('Siti dan Ahmad')).toBe('siti-dan-ahmad');
  });

  it('strips characters that would break the URL', () => {
    expect(slugify('Siti/Ahmad?x=1')).toBe('siti-ahmad-x-1');
    expect(slugify('../../etc/passwd')).toBe('etc-passwd');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('---hello---')).toBe('hello');
    expect(slugify('  spaced  ')).toBe('spaced');
  });

  it('collapses repeated separators', () => {
    expect(slugify('a   &&&   b')).toBe('a-b');
  });

  it('returns an empty string when nothing usable remains', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
  });

  it('always produces output matching the slug pattern', () => {
    for (const input of ['Siti & Ahmad', 'A_B_C', 'Ünïcodé 123', 'x--y']) {
      const out = slugify(input);
      if (out) expect(SLUG_PATTERN.test(out)).toBe(true);
    }
  });

  it('caps length without leaving a trailing dash', () => {
    const out = slugify('a'.repeat(50) + ' ' + 'b'.repeat(50));
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith('-')).toBe(false);
  });
});

describe('assertValidSlug', () => {
  it('accepts a normal slug', () => {
    expect(assertValidSlug('siti-dan-ahmad')).toBe('siti-dan-ahmad');
  });

  it('rejects slugs shorter than 3 characters', () => {
    expect(() => assertValidSlug('ab')).toThrow(TRPCError);
  });

  it('rejects reserved route names that would be shadowed by the app', () => {
    // `/[slug]` sits at the app root, so these would never resolve.
    for (const reserved of ['admin', 'dashboard', 'login', 'api', 'pricing']) {
      expect(isReservedSlug(reserved)).toBe(true);
      expect(() => assertValidSlug(reserved)).toThrow(TRPCError);
    }
  });

  it('rejects malformed slugs', () => {
    for (const bad of ['Has Upper', 'has_underscore', '-leading', 'trailing-']) {
      expect(() => assertValidSlug(bad)).toThrow(TRPCError);
    }
  });
});
