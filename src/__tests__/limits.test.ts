import { describe, it, expect } from 'vitest';
import { isWithinLimit, countJsonArray } from '@/server/lib/limits';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

describe('isWithinLimit', () => {
  it('treats -1 as unlimited', () => {
    expect(isWithinLimit(999999, -1)).toBe(true);
    expect(isWithinLimit(SUBSCRIPTION_TIERS.BUSINESS.maxGuests, -1)).toBe(true);
  });

  it('allows counts up to and including the cap', () => {
    expect(isWithinLimit(1, 1)).toBe(true);
    expect(isWithinLimit(50, 50)).toBe(true);
  });

  it('rejects counts above the cap', () => {
    expect(isWithinLimit(2, 1)).toBe(false);
    expect(isWithinLimit(51, 50)).toBe(false);
  });

  it('rejects any positive count when the cap is zero', () => {
    // FREE has maxBankAccounts: 0 — the feature is off, not unlimited.
    expect(isWithinLimit(1, 0)).toBe(false);
    expect(isWithinLimit(0, 0)).toBe(true);
  });
});

describe('countJsonArray', () => {
  it('counts entries in a JSON array column', () => {
    expect(countJsonArray('[]')).toBe(0);
    expect(countJsonArray('[{"id":"1"},{"id":"2"}]')).toBe(2);
  });

  it('returns 0 for empty or missing values', () => {
    expect(countJsonArray(undefined)).toBe(0);
    expect(countJsonArray(null)).toBe(0);
    expect(countJsonArray('')).toBe(0);
  });

  it('returns 0 rather than throwing on malformed JSON', () => {
    // Malformed input must not bypass a quota check by raising.
    expect(countJsonArray('not json')).toBe(0);
    expect(countJsonArray('{"a":1}')).toBe(0);
  });
});
