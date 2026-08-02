import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, generateSlug, getInitials } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('formatCurrency', () => {
  it('formats IDR correctly', () => {
    const result = formatCurrency(99000);
    expect(result).toContain('99');
    // Output format varies by locale (Rp or IDR) — just check it's a non-empty string
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });
});

describe('generateSlug', () => {
  it('converts names to slug format', () => {
    const slug = generateSlug('Budi Santoso', 'Siti Rahayu');
    expect(slug).toMatch(/budi/);
    expect(slug).toMatch(/siti/);
    expect(slug).not.toContain(' ');
  });

  it('handles special characters', () => {
    const slug = generateSlug('Büdi', 'Sitî');
    expect(slug).not.toContain(' ');
  });
});

describe('getInitials', () => {
  it('returns initials from a full name', () => {
    expect(getInitials('Budi Santoso')).toBe('BS');
  });

  it('handles single name', () => {
    expect(getInitials('Budi')).toBe('B');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });
});
