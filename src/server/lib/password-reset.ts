import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';

/**
 * Password reset, built on the same `VerificationToken` table as email
 * verification and namespaced separately so the two can never be swapped.
 *
 * Without this a customer who forgets their password is locked out of a paid
 * account permanently, with no path back that does not involve a human.
 *
 * Tokens are stored hashed, so a leaked database row cannot be replayed as a
 * reset link. The window is deliberately much shorter than email verification:
 * this token can take over an account.
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function identifierFor(email: string): string {
  return `reset-password:${email.toLowerCase()}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issues a reset token, invalidating any earlier one for the address so only
 * the most recent email works.
 *
 * Returns the raw token — it is only ever emailed, never stored.
 */
export async function createPasswordResetToken(
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

export type ResetTokenResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'invalid' | 'expired' };

/**
 * Checks a token without consuming it, so the reset form can tell the visitor
 * the link is stale before they type a new password.
 */
export async function peekPasswordResetToken(
  prisma: PrismaClient,
  rawToken: string
): Promise<ResetTokenResult> {
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!record || !record.identifier.startsWith('reset-password:')) {
    return { ok: false, reason: 'invalid' };
  }

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { token: record.token } });
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, email: record.identifier.slice('reset-password:'.length) };
}

/**
 * Validates and consumes a token in one step.
 * The row is deleted before the caller changes the password, so a token can
 * never be used twice even if two requests arrive together.
 */
export async function consumePasswordResetToken(
  prisma: PrismaClient,
  rawToken: string
): Promise<ResetTokenResult> {
  const hashed = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record || !record.identifier.startsWith('reset-password:')) {
    return { ok: false, reason: 'invalid' };
  }

  const deleted = await prisma.verificationToken.deleteMany({
    where: { token: hashed },
  });

  // Another request consumed it first.
  if (deleted.count === 0) {
    return { ok: false, reason: 'invalid' };
  }

  if (record.expires.getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, email: record.identifier.slice('reset-password:'.length) };
}

export function buildPasswordResetUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3000';

  return `${base.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
}
