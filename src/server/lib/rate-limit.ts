import { TRPCError } from '@trpc/server';

type Bucket = { count: number; resetAt: number };

/**
 * In-memory sliding-window rate limiter.
 *
 * Scope is per server instance. On a single container that is a hard limit; on
 * serverless it still caps the damage a single warm instance can do, which is
 * what makes casual spam uneconomical. Swap `store` for Redis/Upstash when the
 * deployment runs multiple instances and you need a global guarantee.
 */
const store = new Map<string, Bucket>();

// Bound the map so a flood of unique keys can't grow it without limit.
const MAX_KEYS = 10_000;

function sweep(now: number) {
  store.forEach((bucket, key) => {
    if (bucket.resetAt <= now) store.delete(key);
  });
}

export type RateLimitOptions = {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();

  if (store.size > MAX_KEYS) sweep(now);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/** Throws TOO_MANY_REQUESTS when the caller has exhausted its window. */
export function assertRateLimit(
  key: string,
  options: RateLimitOptions,
  message = 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi.'
) {
  const result = checkRateLimit(key, options);

  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `${message} (tunggu ${result.retryAfterSeconds} detik)`,
    });
  }

  return result;
}

/** Test-only: clears all buckets. */
export function resetRateLimits() {
  store.clear();
}
