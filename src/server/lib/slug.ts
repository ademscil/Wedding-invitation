import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';

/**
 * Slugs resolve at the app root (`/[slug]`), so anything matching a real route
 * would be shadowed by it and the invitation would be unreachable.
 */
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'dashboard',
  'login',
  'register',
  'pricing',
  'robots.txt',
  'sitemap.xml',
  'favicon.ico',
  '_next',
  'static',
  'public',
  'about',
  'terms',
  'privacy',
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Normalises arbitrary text into a URL-safe slug. Returns '' if nothing survives. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/**
 * Validates a user-supplied slug, throwing a friendly BAD_REQUEST when unusable.
 */
export function assertValidSlug(slug: string): string {
  if (slug.length < 3) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Slug minimal 3 karakter',
    });
  }

  if (slug.length > 80) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Slug maksimal 80 karakter',
    });
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message:
        'Slug hanya boleh berisi huruf kecil, angka, dan tanda strip di antaranya',
    });
  }

  if (RESERVED_SLUGS.has(slug)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Slug "${slug}" sudah digunakan sistem, silakan pilih yang lain`,
    });
  }

  return slug;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/**
 * Throws CONFLICT when the slug is taken by a different invitation.
 * `excludeId` lets an invitation keep its own slug on update.
 */
export async function assertSlugAvailable(
  prisma: PrismaClient,
  slug: string,
  excludeId?: string
) {
  const existing = await prisma.invitation.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing && existing.id !== excludeId) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: 'Slug sudah digunakan, silakan pilih yang lain',
    });
  }
}

/**
 * Builds a unique slug from a base, appending a numeric suffix on collision.
 * Bounded retries; the caller still relies on the unique index as final arbiter.
 */
export async function buildUniqueSlug(
  prisma: PrismaClient,
  base: string,
  randomSuffix: () => string
): Promise<string> {
  const seed = base || 'undangan';
  let candidate = isReservedSlug(seed) ? `${seed}-${randomSuffix()}` : seed;

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await prisma.invitation.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${seed}-${randomSuffix()}`;
  }

  return `${seed}-${randomSuffix()}${randomSuffix()}`;
}
