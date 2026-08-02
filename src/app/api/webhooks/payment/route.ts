import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Midtrans payment notification webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, transaction_status, fraud_status, signature_key, gross_amount } = body;

    // Verify signature: SHA512(order_id + status_code + gross_amount + server_key)
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
    const statusCode = body.status_code;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${statusCode}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const isPaid =
      transaction_status === 'capture'
        ? fraud_status === 'accept'
        : transaction_status === 'settlement';

    const payment = await prisma.payment.findFirst({
      where: { gatewayReferenceId: order_id },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    if (isPaid && payment.status !== 'PAID') {
      // Determine plan from amount
      let plan: 'STARTER' | 'PREMIUM' | 'BUSINESS' = 'STARTER';
      if (payment.amount >= 499000) plan = 'BUSINESS';
      else if (payment.amount >= 199000) plan = 'PREMIUM';

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID' },
        }),
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
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({ message: 'OK' });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
