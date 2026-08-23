import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  activateSubscription,
  isSettled,
  planFromPayment,
  verifyMidtransSignature,
  type MidtransStatus,
} from '@/lib/payment';

// Midtrans payment notification webhook
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MidtransStatus;
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';

    // Reject outright when no server key is configured: an empty key would make
    // the signature reproducible by anyone and let callers grant themselves plans.
    if (!serverKey) {
      console.error('[webhook] MIDTRANS_SERVER_KEY is not configured');
      return NextResponse.json(
        { message: 'Gateway not configured' },
        { status: 503 }
      );
    }

    if (!verifyMidtransSignature(body, serverKey)) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    const orderId = body.order_id;
    if (!orderId) {
      return NextResponse.json({ message: 'Missing order_id' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { gatewayReferenceId: orderId },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 });
    }

    if (isSettled(body)) {
      // Take the plan from the row we wrote at checkout, never from the
      // notification body, and confirm the gateway charged at least that much.
      const plan = planFromPayment(payment);
      if (!plan) {
        console.error(
          `[webhook] Unrecognised amount ${payment.amount} for payment ${payment.id}`
        );
        return NextResponse.json({ message: 'Unknown plan' }, { status: 400 });
      }

      const paidAmount = Number.parseFloat(body.gross_amount ?? '0');
      if (!Number.isFinite(paidAmount) || paidAmount < payment.amount) {
        console.error(
          `[webhook] Amount mismatch for ${orderId}: paid ${body.gross_amount}, expected ${payment.amount}`
        );
        return NextResponse.json({ message: 'Amount mismatch' }, { status: 400 });
      }

      // Idempotent: a replayed notification will not create a second subscription.
      await activateSubscription(prisma, payment.id, payment.userId, plan);
    } else if (
      ['cancel', 'deny', 'expire', 'failure'].includes(
        body.transaction_status ?? ''
      )
    ) {
      // Never downgrade a payment that already settled.
      await prisma.payment.updateMany({
        where: { id: payment.id, status: { not: 'PAID' } },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({ message: 'OK' });
  } catch (err) {
    console.error('Payment webhook error:', err);
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
