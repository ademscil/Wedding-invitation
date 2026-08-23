import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import type { PrismaClient } from '@prisma/client';
import { router, protectedProcedure } from '../trpc';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import {
  createSnapTransaction,
  fetchTransactionStatus,
  isDemoPaymentMode,
  isFailedStatus,
  isMidtransConfigured,
  isPaidStatus,
} from '@/lib/payment';

const PAID_PLANS = ['STARTER', 'PREMIUM', 'BUSINESS'] as const;
type PaidPlan = (typeof PAID_PLANS)[number];

/** Months of access granted per plan. */
const PLAN_DURATION_MONTHS: Record<PaidPlan, number> = {
  STARTER: 6,
  PREMIUM: 12,
  BUSINESS: 24,
};

function expiryFor(plan: PaidPlan, from = new Date()): Date {
  const expires = new Date(from);
  expires.setMonth(expires.getMonth() + PLAN_DURATION_MONTHS[plan]);
  return expires;
}

/**
 * Grants a plan to a user and marks the payment paid, in one transaction.
 * Idempotent: a payment already marked PAID is left untouched.
 */
async function activatePlan(
  prisma: PrismaClient,
  paymentId: string,
  plan: PaidPlan
): Promise<boolean> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === 'PAID') return false;

  await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: { status: 'PAID' } }),
    prisma.user.update({
      where: { id: payment.userId },
      data: { subscriptionTier: plan },
    }),
    prisma.subscription.create({
      data: {
        userId: payment.userId,
        plan,
        status: 'ACTIVE',
        paymentId,
        startsAt: new Date(),
        expiresAt: expiryFor(plan),
      },
    }),
  ]);

  return true;
}

export const paymentRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const [user, subscription] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { subscriptionTier: true },
      }),
      ctx.prisma.subscription.findFirst({
        where: { userId: ctx.session.user.id, status: 'ACTIVE' },
        orderBy: { expiresAt: 'desc' },
      }),
    ]);

    return {
      tier: user?.subscriptionTier ?? 'FREE',
      subscription,
      demoMode: isDemoPaymentMode(),
    };
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.payment.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }),

  createCheckout: protectedProcedure
    .input(z.object({ plan: z.enum(PAID_PLANS) }))
    .mutation(async ({ ctx, input }) => {
      const tierInfo = SUBSCRIPTION_TIERS[input.plan];
      const amount = tierInfo.price;

      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { name: true, email: true },
      });

      const orderId = `WI-${Date.now()}-${nanoid(6).toUpperCase()}`;

      const payment = await ctx.prisma.payment.create({
        data: {
          userId: ctx.session.user.id,
          amount,
          currency: 'IDR',
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          gateway: isMidtransConfigured() ? 'MIDTRANS' : 'DEMO',
          gatewayReferenceId: orderId,
        },
      });

      // Without a gateway key there is nothing to redirect to; the client
      // falls back to the demo confirmation path when it is enabled.
      if (!isMidtransConfigured()) {
        if (!isDemoPaymentMode()) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message:
              'Pembayaran belum dikonfigurasi. Hubungi admin untuk mengaktifkan gateway pembayaran.',
          });
        }
        return {
          paymentId: payment.id,
          orderId,
          amount,
          plan: input.plan,
          snapToken: null,
          redirectUrl: null,
          demoMode: true,
        };
      }

      try {
        const snap = await createSnapTransaction({
          orderId,
          amount,
          customerName: user?.name,
          customerEmail: user?.email,
          itemName: `WedInvite ${tierInfo.name}`,
        });

        return {
          paymentId: payment.id,
          orderId,
          amount,
          plan: input.plan,
          snapToken: snap.token,
          redirectUrl: snap.redirectUrl,
          demoMode: false,
        };
      } catch (error) {
        await ctx.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        console.error('Snap transaction failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Gagal membuat transaksi pembayaran. Silakan coba lagi.',
        });
      }
    }),

  /**
   * Confirms a payment after the Snap widget reports success.
   * The plan is derived from the stored payment and the status is re-checked
   * against Midtrans, so a client claim alone can never grant a paid plan.
   */
  confirmPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
      });

      if (!payment || payment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      }

      if (payment.status === 'PAID') {
        return { success: true, alreadyProcessed: true };
      }

      // The plan comes from the recorded amount, never from client input.
      const plan = (Object.keys(SUBSCRIPTION_TIERS) as Array<keyof typeof SUBSCRIPTION_TIERS>)
        .filter((key): key is PaidPlan => PAID_PLANS.includes(key as PaidPlan))
        .find((key) => SUBSCRIPTION_TIERS[key].price === payment.amount);

      if (!plan) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Paket tidak dikenali' });
      }

      if (isMidtransConfigured()) {
        const status = await fetchTransactionStatus(payment.gatewayReferenceId ?? '');

        if (!status) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Transaksi belum ditemukan di gateway pembayaran.',
          });
        }

        if (isFailedStatus(status.transactionStatus)) {
          await ctx.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'FAILED' },
          });
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pembayaran gagal atau dibatalkan.' });
        }

        if (!isPaidStatus(status)) {
          return { success: false, pending: true };
        }

        // Guard against an order whose amount was tampered with client-side.
        if (Math.round(Number(status.grossAmount)) !== payment.amount) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nominal pembayaran tidak cocok.' });
        }
      } else if (!isDemoPaymentMode()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Gateway pembayaran belum dikonfigurasi.',
        });
      }

      await activatePlan(ctx.prisma, payment.id, plan);
      return { success: true, alreadyProcessed: false };
    }),

  /** Polls the gateway for a pending payment so the UI can update without a webhook. */
  checkStatus: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
      });

      if (!payment || payment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Transaksi tidak ditemukan' });
      }

      return { status: payment.status, amount: payment.amount };
    }),
});
