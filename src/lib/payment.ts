import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

export type PaidPlan = 'STARTER' | 'PREMIUM' | 'BUSINESS';

/** Shape of the fields we rely on from Midtrans status/notification payloads. */
export type MidtransStatus = {
  transaction_status?: string;
  fraud_status?: string;
  gross_amount?: string;
  status_code?: string;
  order_id?: string;
  signature_key?: string;
};

/**
 * Resolves a paid plan from a stored payment amount.
 *
 * Matching is exact against the configured tier prices so an arbitrary amount
 * can never be rounded up into a higher tier.
 */
export function planFromAmount(amount: number): PaidPlan | null {
  const plans: PaidPlan[] = ['BUSINESS', 'PREMIUM', 'STARTER'];
  return plans.find((plan) => SUBSCRIPTION_TIERS[plan].price === amount) ?? null;
}

/** True only when the gateway reports the transaction as genuinely settled. */
export function isSettled(status: MidtransStatus): boolean {
  if (status.transaction_status === 'capture') {
    return status.fraud_status === 'accept';
  }
  return status.transaction_status === 'settlement';
}

/**
 * Verifies a Midtrans notification signature.
 *
 * Returns false when the server key is missing — without it there is nothing to
 * verify against and every payload would otherwise be trivially forgeable.
 */
export function verifyMidtransSignature(
  body: MidtransStatus,
  serverKey: string
): boolean {
  if (!serverKey) return false;

  const { order_id, status_code, gross_amount, signature_key } = body;
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return false;
  }

  const expected = crypto
    .createHash('sha512')
    .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
    .digest('hex');

  const received = Buffer.from(signature_key, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  // timingSafeEqual throws on length mismatch, so compare lengths first.
  if (received.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(received, expectedBuf);
}

/**
 * Marks a payment paid, upgrades the user and opens a subscription window.
 *
 * Runs in a single transaction and is idempotent: the payment update is
 * conditional on the row still being PENDING, so concurrent webhook retries and
 * client confirmations cannot stack duplicate subscriptions.
 */
export async function activateSubscription(
  prisma: PrismaClient,
  paymentId: string,
  userId: string,
  plan: PaidPlan
): Promise<boolean> {
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + SUBSCRIPTION_TIERS[plan].durationMonths);

  return prisma.$transaction(async (tx) => {
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: 'PAID' } },
      data: { status: 'PAID' },
    });

    // Another request already activated this payment.
    if (claimed.count === 0) return false;

    await tx.user.update({
      where: { id: userId },
      data: { subscriptionTier: plan },
    });

    // Supersede any previous active subscription so only one stays ACTIVE.
    await tx.subscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    await tx.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        paymentId,
        startsAt: new Date(),
        expiresAt,
      },
    });

    return true;
  });
}
