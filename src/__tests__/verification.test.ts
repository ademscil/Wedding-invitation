import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  createVerificationToken,
  consumeVerificationToken,
  buildVerificationUrl,
} from '@/server/lib/verification';

type TokenRow = { identifier: string; token: string; expires: Date };
type UserRow = { id: string; email: string; emailVerified: Date | null };

/**
 * Minimal in-memory stand-in for the two tables this module touches, so the
 * token lifecycle can be exercised without a database.
 */
function createFakePrisma(users: UserRow[]) {
  let tokens: TokenRow[] = [];

  return {
    tokens: () => tokens,
    users: () => users,
    client: {
      verificationToken: {
        deleteMany: vi.fn(async ({ where }: { where: Partial<TokenRow> }) => {
          const before = tokens.length;
          tokens = tokens.filter((t) =>
            Object.entries(where).every(
              ([key, value]) => t[key as keyof TokenRow] !== value
            )
          );
          return { count: before - tokens.length };
        }),
        create: vi.fn(async ({ data }: { data: TokenRow }) => {
          tokens.push(data);
          return data;
        }),
        findUnique: vi.fn(async ({ where }: { where: { token: string } }) => {
          return tokens.find((t) => t.token === where.token) ?? null;
        }),
      },
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
          return users.find((u) => u.email === where.email) ?? null;
        }),
        update: vi.fn(
          async ({
            where,
            data,
          }: {
            where: { id: string };
            data: { emailVerified: Date };
          }) => {
            const user = users.find((u) => u.id === where.id);
            if (user) user.emailVerified = data.emailVerified;
            return user;
          }
        ),
      },
    } as unknown as PrismaClient,
  };
}

describe('email verification tokens', () => {
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    fake = createFakePrisma([
      { id: 'u1', email: 'adam@example.com', emailVerified: null },
    ]);
  });

  it('never stores the raw token', async () => {
    const raw = await createVerificationToken(fake.client, 'adam@example.com');
    const stored = fake.tokens()[0];

    expect(stored.token).not.toBe(raw);
    expect(stored.token).toHaveLength(64); // sha256 hex
  });

  it('verifies a user with a valid token', async () => {
    const raw = await createVerificationToken(fake.client, 'adam@example.com');
    const result = await consumeVerificationToken(fake.client, raw);

    expect(result).toEqual({ status: 'verified', email: 'adam@example.com' });
    expect(fake.users()[0].emailVerified).toBeInstanceOf(Date);
  });

  it('rejects a token that has already been used', async () => {
    const raw = await createVerificationToken(fake.client, 'adam@example.com');
    await consumeVerificationToken(fake.client, raw);

    const replay = await consumeVerificationToken(fake.client, raw);
    expect(replay.status).toBe('invalid');
  });

  it('invalidates the previous token when a new one is issued', async () => {
    const first = await createVerificationToken(fake.client, 'adam@example.com');
    await createVerificationToken(fake.client, 'adam@example.com');

    expect(await consumeVerificationToken(fake.client, first)).toEqual({
      status: 'invalid',
    });
  });

  it('reports an expired token and burns it', async () => {
    const raw = await createVerificationToken(fake.client, 'adam@example.com');
    fake.tokens()[0].expires = new Date(Date.now() - 1000);

    expect(await consumeVerificationToken(fake.client, raw)).toEqual({
      status: 'expired',
    });
    expect(fake.tokens()).toHaveLength(0);
    expect(fake.users()[0].emailVerified).toBeNull();
  });

  it('rejects an empty or unknown token', async () => {
    expect(await consumeVerificationToken(fake.client, '')).toEqual({
      status: 'invalid',
    });
    expect(await consumeVerificationToken(fake.client, 'bogus')).toEqual({
      status: 'invalid',
    });
  });

  it('reports already-verified without re-stamping the date', async () => {
    const verifiedAt = new Date('2020-01-01');
    fake.users()[0].emailVerified = verifiedAt;

    const raw = await createVerificationToken(fake.client, 'adam@example.com');
    const result = await consumeVerificationToken(fake.client, raw);

    expect(result.status).toBe('already-verified');
    expect(fake.users()[0].emailVerified).toBe(verifiedAt);
  });

  it('matches the address case-insensitively', async () => {
    const raw = await createVerificationToken(fake.client, 'Adam@Example.com');
    expect((await consumeVerificationToken(fake.client, raw)).status).toBe(
      'verified'
    );
  });
});

describe('buildVerificationUrl', () => {
  it('encodes the token into the verify path', () => {
    const url = buildVerificationUrl('abc+123');
    expect(url).toContain('/verify-email?token=');
    expect(url).toContain(encodeURIComponent('abc+123'));
  });
});
