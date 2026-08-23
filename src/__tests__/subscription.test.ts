import { describe, it, expect } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  assertFeature,
  assertQuota,
  getLimits,
  hasFeature,
  isUnlimited,
  normalizeTier,
  withinQuota,
} from '@/lib/subscription';

describe('normalizeTier', () => {
  it('passes through known tiers', () => {
    expect(normalizeTier('PREMIUM')).toBe('PREMIUM');
    expect(normalizeTier('BUSINESS')).toBe('BUSINESS');
  });

  it('falls back to FREE for unknown or missing values', () => {
    expect(normalizeTier('GOLD')).toBe('FREE');
    expect(normalizeTier(null)).toBe('FREE');
    expect(normalizeTier(undefined)).toBe('FREE');
  });
});

describe('hasFeature', () => {
  it('denies paid features on the free tier', () => {
    expect(hasFeature('FREE', 'hasAnalytics')).toBe(false);
    expect(hasFeature('FREE', 'hasQrCheckin')).toBe(false);
    expect(hasFeature('FREE', 'hasExport')).toBe(false);
  });

  it('grants every gated feature on business', () => {
    expect(hasFeature('BUSINESS', 'hasAnalytics')).toBe(true);
    expect(hasFeature('BUSINESS', 'hasQrCheckin')).toBe(true);
    expect(hasFeature('BUSINESS', 'hasExport')).toBe(true);
  });

  it('treats an unknown tier as free', () => {
    expect(hasFeature('ENTERPRISE', 'hasAnalytics')).toBe(false);
  });

  it('gates QR check-in to business only', () => {
    expect(hasFeature('STARTER', 'hasQrCheckin')).toBe(false);
    expect(hasFeature('PREMIUM', 'hasQrCheckin')).toBe(false);
    expect(hasFeature('BUSINESS', 'hasQrCheckin')).toBe(true);
  });
});

describe('withinQuota', () => {
  it('allows counts up to the limit', () => {
    expect(withinQuota('FREE', 'maxGuests', 50)).toBe(true);
    expect(withinQuota('FREE', 'maxGuests', 51)).toBe(false);
  });

  it('treats -1 as unlimited', () => {
    expect(isUnlimited(getLimits('BUSINESS').maxGuests)).toBe(true);
    expect(withinQuota('BUSINESS', 'maxGuests', 100_000)).toBe(true);
  });
});

describe('assertFeature', () => {
  it('does not throw when the tier includes the feature', () => {
    expect(() => assertFeature('PREMIUM', 'hasExport')).not.toThrow();
  });

  it('throws FORBIDDEN naming the upgrade plan', () => {
    try {
      assertFeature('FREE', 'hasAnalytics');
      throw new Error('expected assertFeature to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('FORBIDDEN');
      // Analytics unlocks at Starter, so that is the plan we should recommend.
      expect(trpcError.message).toContain('Starter');
    }
  });
});

describe('assertQuota', () => {
  it('allows an addition that lands exactly on the limit', () => {
    expect(() => assertQuota('FREE', 'maxGuests', 49, 1)).not.toThrow();
  });

  it('rejects an addition that exceeds the limit', () => {
    expect(() => assertQuota('FREE', 'maxGuests', 50, 1)).toThrow(TRPCError);
  });

  it('rejects a bulk import larger than the remaining allowance', () => {
    expect(() => assertQuota('FREE', 'maxGuests', 40, 20)).toThrow(TRPCError);
  });

  it('never throws for an unlimited tier', () => {
    expect(() => assertQuota('BUSINESS', 'maxInvitations', 9999, 50)).not.toThrow();
  });

  it('reports the limit and a suggested plan', () => {
    try {
      assertQuota('FREE', 'maxInvitations', 1, 1);
      throw new Error('expected assertQuota to throw');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('FORBIDDEN');
      expect(trpcError.message).toContain('1');
      expect(trpcError.message).toContain('Starter');
    }
  });
});
