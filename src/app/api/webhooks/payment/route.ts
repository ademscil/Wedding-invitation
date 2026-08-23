import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import {
  isFailedStatus,
  isMidtransConfigured,
  isPaidStatus,
  verifyWebhookSignature,
} from '@/lib/payment';

const PAID_PLANS = ['STARTER', 'PREMIUM', 'BUSINESS'] as const;
type PaidPlan = (typeof PAID_PLANS)[number];

const PLAN_DURATION_MONTHS: Record<PaidPlan, number> = {
  STARTER: 6,
  PREMIUM: 12,
  BUSINESS: 24,
};

/** Resolves the plan from the recorded amount rather than anything in the payload. */
function planForAmount(amount: number): PaidPlan | null {
  return PAID_PLANS.find((plan) => SUBSCRIPTION_TIERS[plan].price === amount) ?? null;
}

export async function POST(req: NextRequest) {
  if (!isMidtransConfigured()) {
    return NextResponse.json({ message: 'Gateway not configured' }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  const { order_id, transaction_status, fraud_status, signature_key, gross_amount, status_code } =
    body;

  if (!order_id || !transaction_status || !signature_key || !gross_amount || !status_code) {
    return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
  }

  if (
    !verifyWebhookSignature({
      order_id,
      status_code,
      gross_amount,
      signature_key,
    })
  ) {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payment = await prisma.payment.findFirst({
      where: { gatewayReferenceId: order_id },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    if (isFailedStatus(transaction_status)) {
      if (payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
      return NextResponse.json({ message: 'OK' });
    }

    if (!isPaidStatus({ transactionStatus: transaction_status, fraudStatus: fraud_status })) {
      return NextResponse.json({ message: 'OK' });
    }

    // Replays of an already-processed notification must not stack subscriptions.
    if (payment.status === 'PAID') {
      return NextResponse.json({ message: 'OK' });
    }

    // The settled amount must match what we charged.
    if (Math.round(Number(gross_amount)) !== payment.amount) {
      console.error(`Webhook amount mismatch for ${order_id}`);
      return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
    }

    const plan = planForAmount(payment.amount);
    if (!plan) {
      console.error(`Webhook: no plan matches amount ${payment.amount} for ${order_id}`);
      return NextResponse.json({ message: 'Unknown plan' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + PLAN_DURATION_MONTHS[plan]);

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID' } }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { subscriptionTier: plan },
      }),
      prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan,
          status: 'ACTIVE',
          paymentId: payment.id,
          startsAt: new Date(),
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({ message: 'OK' });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
