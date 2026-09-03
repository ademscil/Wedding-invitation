// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import dotenv from 'dotenv';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * Subscription activation against a real database.
 *
 * A webhook and a client-side confirmation routinely race for the same
 * payment. Both call activateSubscription, so running it twice must still mean
 * one upgrade, one subscription row, and one promo use.
 *
 * Skipped when no database is configured, so the suite still runs anywhere.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL);
const EMAIL = 'zz-activation@example.invalid';
const CODE = 'ZZACTIVATE50';

async function db() {
  const { prisma } = await import('@/lib/db');
  return prisma;
}

async function cleanup() {
  const prisma = await db();
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (user) {
    await prisma.subscription.deleteMany({ where: { userId: user.id } });
    await prisma.payment.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  await prisma.promoCode.deleteMany({ where: { code: CODE } });
}

async function seed(promoCode: string | null) {
  const prisma = await db();

  const user = await prisma.user.create({
    data: { email: EMAIL, name: 'ZZ Activation', subscriptionTier: 'FREE' },
  });

  await prisma.promoCode.create({
    data: {
      code: CODE,
      discountType: 'PERCENTAGE',
      discountValue: 50,
      maxUses: 10,
      validFrom: new Date(Date.now() - 86_400_000),
      validUntil: new Date(Date.now() + 86_400_000),
      applicablePlans: '[]',
    },
  });

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      amount: 99_500,
      type: 'SUBSCRIPTION',
      status: 'PENDING',
      gateway: 'midtrans',
      gatewayReferenceId: `ZZ-${Date.now()}`,
      plan: 'PREMIUM',
      promoCode,
    },
  });

  return { user, payment };
}

describe('planFromPayment', () => {
  it('uses the recorded plan, not one inferred from a discounted amount', async () => {
    const { planFromPayment } = await import('@/lib/payment');

    // 49_500 matches no tier price: inference alone returns null, and the
    // activation would be refused as an unrecognised amount.
    expect(planFromPayment({ plan: 'PREMIUM', amount: 49_500 })).toBe('PREMIUM');
    expect(planFromPayment({ plan: null, amount: 49_500 })).toBeNull();

    // Rows written before the column existed still resolve by amount.
    expect(
      planFromPayment({
        plan: null,
        amount: SUBSCRIPTION_TIERS.PREMIUM.price,
      })
    ).toBe('PREMIUM');

    // A value that is not a paid plan cannot invent a tier.
    expect(planFromPayment({ plan: 'FREE', amount: 1 })).toBeNull();
    expect(planFromPayment({ plan: 'nonsense', amount: 1 })).toBeNull();
  });
});

describe.skipIf(!hasDatabase)('activateSubscription', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('upgrades the user exactly once, however many times it runs', async () => {
    const prisma = await db();
    const { activateSubscription } = await import('@/lib/payment');
    const { user, payment } = await seed(CODE);

    expect(await activateSubscription(prisma, payment.id, user.id, 'PREMIUM')).toBe(
      true
    );
    // The retry a racing webhook produces.
    expect(await activateSubscription(prisma, payment.id, user.id, 'PREMIUM')).toBe(
      false
    );

    const after = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(after?.status).toBe('PAID');

    const upgraded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(upgraded?.subscriptionTier).toBe('PREMIUM');

    expect(
      await prisma.subscription.count({
        where: { userId: user.id, status: 'ACTIVE' },
      })
    ).toBe(1);

    const promo = await prisma.promoCode.findUnique({ where: { code: CODE } });
    expect(promo?.currentUses, 'a retry must not spend a second use').toBe(1);
  });

  it('leaves promo counters alone for a payment that used no code', async () => {
    const prisma = await db();
    const { activateSubscription } = await import('@/lib/payment');
    const { user, payment } = await seed(null);

    await activateSubscription(prisma, payment.id, user.id, 'PREMIUM');

    const promo = await prisma.promoCode.findUnique({ where: { code: CODE } });
    expect(promo?.currentUses).toBe(0);
  });

  it('supersedes the previous active subscription on a second purchase', async () => {
    const prisma = await db();
    const { activateSubscription } = await import('@/lib/payment');
    const { user, payment } = await seed(null);

    await activateSubscription(prisma, payment.id, user.id, 'PREMIUM');

    const upgrade = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 499_000,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        gateway: 'midtrans',
        gatewayReferenceId: `ZZ-UP-${Date.now()}`,
        plan: 'BUSINESS',
      },
    });

    await activateSubscription(prisma, upgrade.id, user.id, 'BUSINESS');

    // Two ACTIVE rows would make "which plan am I on" ambiguous.
    expect(
      await prisma.subscription.count({
        where: { userId: user.id, status: 'ACTIVE' },
      })
    ).toBe(1);

    const upgraded = await prisma.user.findUnique({ where: { id: user.id } });
    expect(upgraded?.subscriptionTier).toBe('BUSINESS');
  });
});
