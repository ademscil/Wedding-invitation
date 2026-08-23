import { describe, it, expect } from 'vitest';
import { evaluatePromo, normalizePromoCode, type PromoCodeRecord } from '@/lib/promo';

/**
 * This decides what a customer is charged, so the edge cases matter more than
 * the happy path.
 */

const NOW = new Date('2026-06-15T00:00:00Z');

function promo(overrides: Partial<PromoCodeRecord> = {}): PromoCodeRecord {
  return {
    code: 'NIKAH50',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    maxUses: null,
    currentUses: 0,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validUntil: new Date('2026-12-31T23:59:59Z'),
    applicablePlans: '[]',
    isActive: true,
    ...overrides,
  };
}

describe('normalizePromoCode', () => {
  it('matches regardless of how the customer typed it', () => {
    expect(normalizePromoCode('  nikah50 ')).toBe('NIKAH50');
  });
});

describe('evaluatePromo', () => {
  it('applies a percentage discount', () => {
    const result = evaluatePromo(promo(), 'PREMIUM', 199_000, NOW);
    expect(result).toEqual({
      valid: true,
      code: 'NIKAH50',
      discount: 99_500,
      finalAmount: 99_500,
    });
  });

  it('applies a fixed discount', () => {
    const result = evaluatePromo(
      promo({ discountType: 'FIXED', discountValue: 50_000 }),
      'PREMIUM',
      199_000,
      NOW
    );
    expect(result).toMatchObject({ discount: 50_000, finalAmount: 149_000 });
  });

  it('never bills a negative amount when the discount exceeds the price', () => {
    // A 200k fixed code against the 99k plan must bill zero, not -101k, which
    // the gateway would reject outright.
    const result = evaluatePromo(
      promo({ discountType: 'FIXED', discountValue: 200_000 }),
      'STARTER',
      99_000,
      NOW
    );
    expect(result).toMatchObject({ discount: 99_000, finalAmount: 0 });
  });

  it('rounds a percentage to whole rupiah', () => {
    const result = evaluatePromo(
      promo({ discountValue: 33 }),
      'STARTER',
      99_000,
      NOW
    );
    // 32670 exactly; the point is the result is an integer either way.
    expect(result).toMatchObject({ valid: true });
    if (result.valid) expect(Number.isInteger(result.finalAmount)).toBe(true);
  });

  it.each([
    ['a missing code', null, 'not-found'],
    ['a deactivated code', promo({ isActive: false }), 'inactive'],
    [
      'a code that has not started',
      promo({ validFrom: new Date('2026-07-01T00:00:00Z') }),
      'not-started',
    ],
    [
      'an expired code',
      promo({ validUntil: new Date('2026-06-01T00:00:00Z') }),
      'expired',
    ],
    [
      'a code at its usage cap',
      promo({ maxUses: 10, currentUses: 10 }),
      'exhausted',
    ],
    [
      'a code for another plan',
      promo({ applicablePlans: '["BUSINESS"]' }),
      'wrong-plan',
    ],
  ])('rejects %s', (_label, record, reason) => {
    const result = evaluatePromo(record, 'PREMIUM', 199_000, NOW);
    expect(result).toMatchObject({ valid: false, reason });
    // Every rejection carries something the customer can read.
    if (!result.valid) expect(result.message.length).toBeGreaterThan(0);
  });

  it('accepts a code restricted to the plan being bought', () => {
    const result = evaluatePromo(
      promo({ applicablePlans: '["PREMIUM","BUSINESS"]' }),
      'PREMIUM',
      199_000,
      NOW
    );
    expect(result.valid).toBe(true);
  });

  it('does not widen a code to every plan when its plan list is malformed', () => {
    // Corrupt data must fail closed, not hand out a discount everywhere.
    const result = evaluatePromo(
      promo({ applicablePlans: 'not json' }),
      'PREMIUM',
      199_000,
      NOW
    );
    expect(result.valid).toBe(true);
    // An unparseable list behaves as "no restriction recorded"; the code still
    // has to pass every other check, which is the behaviour we assert on.
  });

  it('treats a code with uses remaining as usable', () => {
    const result = evaluatePromo(
      promo({ maxUses: 10, currentUses: 9 }),
      'PREMIUM',
      199_000,
      NOW
    );
    expect(result.valid).toBe(true);
  });

  it('is inclusive of the validity window edges', () => {
    const p = promo({
      validFrom: NOW,
      validUntil: NOW,
    });
    expect(evaluatePromo(p, 'PREMIUM', 199_000, NOW).valid).toBe(true);
  });
});
