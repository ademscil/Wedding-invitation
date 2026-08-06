import { describe, it, expect, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import {
  checkRateLimit,
  assertRateLimit,
  resetRateLimits,
} from '@/server/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit('a', { limit: 3, windowMs: 1000 }).allowed).toBe(true);
    }
  });

  it('blocks the request that exceeds the limit', () => {
    const opts = { limit: 2, windowMs: 1000 };
    checkRateLimit('b', opts);
    checkRateLimit('b', opts);

    const blocked = checkRateLimit('b', opts);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('counts each key independently', () => {
    const opts = { limit: 1, windowMs: 1000 };
    expect(checkRateLimit('x', opts).allowed).toBe(true);
    expect(checkRateLimit('y', opts).allowed).toBe(true);
    expect(checkRateLimit('x', opts).allowed).toBe(false);
  });

  it('reports remaining budget', () => {
    const opts = { limit: 3, windowMs: 1000 };
    expect(checkRateLimit('c', opts).remaining).toBe(2);
    expect(checkRateLimit('c', opts).remaining).toBe(1);
    expect(checkRateLimit('c', opts).remaining).toBe(0);
  });

  it('starts a fresh window once the old one expires', async () => {
    const opts = { limit: 1, windowMs: 20 };
    expect(checkRateLimit('d', opts).allowed).toBe(true);
    expect(checkRateLimit('d', opts).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(checkRateLimit('d', opts).allowed).toBe(true);
  });
});

describe('assertRateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('throws TOO_MANY_REQUESTS past the limit', () => {
    const opts = { limit: 1, windowMs: 1000 };
    assertRateLimit('e', opts);

    try {
      assertRateLimit('e', opts);
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe('TOO_MANY_REQUESTS');
    }
  });

  it('does not throw while within the limit', () => {
    expect(() => assertRateLimit('f', { limit: 2, windowMs: 1000 })).not.toThrow();
  });
});
