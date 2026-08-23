// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * The plan limits are what the product actually sells. The pure helpers are
 * covered elsewhere; this checks the enforcement that stands between a Free
 * account and everything it has not paid for, against a real database.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL);
const EMAIL = 'zz-quota@example.invalid';

async function db() {
  const { prisma } = await import('@/lib/db');
  return prisma;
}

async function cleanup() {
  const prisma = await db();
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

async function makeUser(tier: string) {
  const prisma = await db();
  return prisma.user.create({
    data: { email: EMAIL, name: 'ZZ Quota', subscriptionTier: tier },
  });
}

async function makeInvitation(userId: string, slug: string) {
  const prisma = await db();
  return prisma.invitation.create({
    data: { userId, slug, brideName: 'A', groomName: 'B' },
  });
}

describe.skipIf(!hasDatabase)('plan enforcement', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('stops a Free account at its one invitation', async () => {
    const prisma = await db();
    const { assertCanCreateInvitation } = await import('@/server/lib/limits');
    const user = await makeUser('FREE');

    // The first is allowed.
    await expect(assertCanCreateInvitation(prisma, user.id)).resolves.toBeUndefined();
    await makeInvitation(user.id, 'zz-quota-1');

    // The second is not, and says why.
    await expect(assertCanCreateInvitation(prisma, user.id)).rejects.toThrow(
      /hanya mengizinkan 1 undangan/i
    );
  });

  it('lets Business create without limit', async () => {
    const prisma = await db();
    const { assertCanCreateInvitation } = await import('@/server/lib/limits');
    const user = await makeUser('BUSINESS');

    for (let i = 0; i < 3; i++) {
      await makeInvitation(user.id, `zz-quota-b-${i}`);
    }

    await expect(assertCanCreateInvitation(prisma, user.id)).resolves.toBeUndefined();
  });

  it('caps guests on a Free account', async () => {
    const prisma = await db();
    const { assertCanAddGuests } = await import('@/server/lib/limits');
    const user = await makeUser('FREE');
    const invitation = await makeInvitation(user.id, 'zz-quota-guests');

    // Free allows 50.
    await expect(
      assertCanAddGuests(prisma, user.id, invitation.id, 50)
    ).resolves.toBeUndefined();

    await expect(
      assertCanAddGuests(prisma, user.id, invitation.id, 51)
    ).rejects.toThrow();
  });

  it('refuses a feature the plan does not include, and allows it once it does', async () => {
    const prisma = await db();
    const { assertFeature } = await import('@/server/lib/limits');
    const user = await makeUser('FREE');

    await expect(
      assertFeature(prisma, user.id, 'hasCustomDomain')
    ).rejects.toThrow(/domain kustom/i);

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionTier: 'PREMIUM' },
    });

    await expect(
      assertFeature(prisma, user.id, 'hasCustomDomain')
    ).resolves.toBeUndefined();
  });

  it('treats an unknown tier as Free rather than as unlimited', async () => {
    const prisma = await db();
    const { getUserLimits } = await import('@/server/lib/limits');
    // A typo or a hand-edited row must not hand out Business limits.
    const user = await makeUser('ENTERPRISE_TYPO');

    const { limits } = await getUserLimits(prisma, user.id);
    expect(limits.maxInvitations).toBe(1);
    expect(limits.hasCustomDomain).toBe(false);
  });

  it('caps gallery images on a Free account', async () => {
    const prisma = await db();
    const { assertContentWithinLimits } = await import('@/server/lib/limits');
    const user = await makeUser('FREE');
    const invitation = await makeInvitation(user.id, 'zz-quota-gallery');

    const images = (count: number) =>
      JSON.stringify(
        Array.from({ length: count }, (_, i) => ({ id: `g${i}`, url: `/${i}.jpg` }))
      );

    await expect(
      assertContentWithinLimits(
        prisma,
        user.id,
        { galleryImages: images(5) },
        invitation
      )
    ).resolves.toBeUndefined();

    await expect(
      assertContentWithinLimits(
        prisma,
        user.id,
        { galleryImages: images(6) },
        invitation
      )
    ).rejects.toThrow();
  });
});

describe.skipIf(!hasDatabase)('invitation visibility', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('stops serving an invitation once its paid window has closed', async () => {
    const prisma = await db();
    const { isLive } = await import('@/app/(invitation)/[slug]/invitation-view');
    const user = await makeUser('FREE');

    const live = await prisma.invitation.create({
      data: {
        userId: user.id,
        slug: 'zz-quota-live',
        status: 'PUBLISHED',
        expiresAt: new Date(Date.now() + 86_400_000),
        brideName: 'A',
        groomName: 'B',
      },
    });

    const expired = await prisma.invitation.create({
      data: {
        userId: user.id,
        slug: 'zz-quota-expired',
        status: 'PUBLISHED',
        expiresAt: new Date(Date.now() - 1000),
        brideName: 'A',
        groomName: 'B',
      },
    });

    const draft = await prisma.invitation.create({
      data: {
        userId: user.id,
        slug: 'zz-quota-draft',
        status: 'DRAFT',
        brideName: 'A',
        groomName: 'B',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isLive(live as any)).toBe(true);
    // A lapsed subscription must actually take the invitation down.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isLive(expired as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isLive(draft as any)).toBe(false);
    expect(isLive(null)).toBe(false);
  });
});
