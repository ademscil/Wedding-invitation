import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';

/**
 * Email verification built on the NextAuth `VerificationToken` table, which the
 * Prisma adapter already provisions — no extra model needed.
 *
 * Tokens are stored hashed. A leaked database row therefore cannot be replayed
 * as a verification link.
 */

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Namespaces our rows so they never collide with adapter-issued tokens. */
function identifierFor(email: string): string {
  return `verify-email:${email.toLowerCase()}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a fresh verification token, invalidating any earlier one for the
 * address so only the most recent email works.
 *
 * Returns the raw token — it is only ever sent by email, never stored.
 */
export async function createVerificationToken(
  prisma: PrismaClient,
  email: string
): Promise<string> {
  const identifier = identifierFor(email);

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  const rawToken = crypto.randomBytes(32).toString('hex');

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export type VerificationResult =
  | { status: 'verified'; email: string }
  | { status: 'already-verified'; email: string }
  | { status: 'invalid' }
  | { status: 'expired' };

/**
 * Consumes a verification token and marks the address verified.
 * The token is single-use: it is deleted whether or not it had expired.
 */
export async function consumeVerificationToken(
  prisma: PrismaClient,
  rawToken: string
): Promise<VerificationResult> {
  if (!rawToken) return { status: 'invalid' };

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!record || !record.identifier.startsWith('verify-email:')) {
    return { status: 'invalid' };
  }

  // Burn the token before acting on it so a replay cannot succeed.
  await prisma.verificationToken.deleteMany({
    where: { token: record.token },
  });

  if (record.expires.getTime() < Date.now()) {
    return { status: 'expired' };
  }

  const email = record.identifier.slice('verify-email:'.length);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!user) return { status: 'invalid' };

  if (user.emailVerified) {
    return { status: 'already-verified', email };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });

  return { status: 'verified', email };
}

/** Builds the absolute link that lands on the verification page. */
export function buildVerificationUrl(token: string): string {
  const base =
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';

  return `${base.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
}
