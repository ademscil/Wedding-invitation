import { describe, it, expect } from 'vitest';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

describe('SUBSCRIPTION_TIERS', () => {
  it('FREE tier has price 0', () => {
    expect(SUBSCRIPTION_TIERS.FREE.price).toBe(0);
  });

  it('BUSINESS tier has unlimited guests', () => {
    expect(SUBSCRIPTION_TIERS.BUSINESS.maxGuests).toBe(-1);
  });

  it('all tiers have required fields', () => {
    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      expect(tier).toHaveProperty('name');
      expect(tier).toHaveProperty('price');
      expect(tier).toHaveProperty('maxGuests');
    }
  });

  it('tier prices are non-negative', () => {
    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      expect(tier.price).toBeGreaterThanOrEqual(0);
    }
  });
});
