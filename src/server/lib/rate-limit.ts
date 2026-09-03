import { TRPCError } from '@trpc/server';

type Bucket = { count: number; resetAt: number };

/**
 * Hybrid Rate Limiter:
 * - Supports Upstash Redis REST API when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * - Gracefully falls back to sliding-window in-memory bucket store for local dev, testing, or offline modes.
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

/**
 * Distributed rate limiter via Upstash Redis REST API.
 * Falls back to in-memory check if Redis is unavailable or unconfigured.
 */
export async function checkRateLimitDistributed(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return checkRateLimit(key, options);
  }

  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', `rl:${key}`],
        ['EXPIRE', `rl:${key}`, windowSec, 'NX'],
        ['TTL', `rl:${key}`],
      ]),
    });

    if (!res.ok) {
      return checkRateLimit(key, options);
    }

    const data = (await res.json()) as Array<{ result: number }>;
    const count = data[0]?.result ?? 1;
    const ttl = Math.max(1, data[2]?.result ?? windowSec);

    if (count > options.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: ttl,
      };
    }

    return {
      allowed: true,
      remaining: options.limit - count,
      retryAfterSeconds: 0,
    };
  } catch {
    return checkRateLimit(key, options);
  }
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

/** Asynchronous distributed assertion. */
export async function assertRateLimitDistributed(
  key: string,
  options: RateLimitOptions,
  message = 'Terlalu banyak permintaan. Silakan coba lagi sebentar lagi.'
) {
  const result = await checkRateLimitDistributed(key, options);

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
