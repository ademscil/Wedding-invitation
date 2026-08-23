import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, protectedProcedure } from '../trpc';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { evaluatePromo, normalizePromoCode } from '@/lib/promo';
import {
  activateSubscription,
  isSettled,
  planFromPayment,
  type MidtransStatus,
} from '@/lib/payment';

/** Looks a code up case-insensitively and scores it against a plan's price. */
async function resolvePromo(
  prisma: import('@prisma/client').PrismaClient,
  rawCode: string | undefined,
  plan: string,
  amount: number
) {
  if (!rawCode || rawCode.trim() === '') return null;

  const code = normalizePromoCode(rawCode);
  const record = await prisma.promoCode.findUnique({ where: { code } });
  const evaluation = evaluatePromo(record, plan, amount);

  if (!evaluation.valid) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: evaluation.message });
  }

  return evaluation;
}

export const paymentRouter = router({
  /**
   * Prices a code before the customer commits to paying.
   *
   * The checkout re-evaluates it server-side regardless — this exists so the
   * discount is visible on the button, not to be trusted as the final price.
   */
  previewPromo: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['STARTER', 'PREMIUM', 'BUSINESS']),
        code: z.string().min(1).max(40),
      })
    )
    .query(async ({ ctx, input }) => {
      const amount = SUBSCRIPTION_TIERS[input.plan].price;
      const evaluation = await resolvePromo(
        ctx.prisma,
        input.code,
        input.plan,
        amount
      );

      return {
        code: evaluation!.code,
        discount: evaluation!.discount,
        originalAmount: amount,
        finalAmount: evaluation!.finalAmount,
      };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { subscriptionTier: true },
    });
    const subscription = await ctx.prisma.subscription.findFirst({
      where: { userId: ctx.session.user.id, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });
    return { tier: user?.subscriptionTier ?? 'FREE', subscription };
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.payment.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['STARTER', 'PREMIUM', 'BUSINESS']),
        promoCode: z.string().max(40).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tierInfo = SUBSCRIPTION_TIERS[input.plan];
      const listPrice = tierInfo.price;

      // Re-evaluated here rather than trusting anything the client priced.
      const promo = await resolvePromo(
        ctx.prisma,
        input.promoCode,
        input.plan,
        listPrice
      );

      const amount = promo ? promo.finalAmount : listPrice;

      // nanoid suffix keeps order ids unique when two checkouts land in the same ms
      const orderId = `INV-${Date.now()}-${nanoid(6)}`;

      const payment = await ctx.prisma.payment.create({
        data: {
          userId: ctx.session.user.id,
          amount,
          currency: 'IDR',
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          gateway: 'midtrans',
          gatewayReferenceId: orderId,
          // Recorded now so activation never has to guess from the amount,
          // which a discount would make ambiguous.
          plan: input.plan,
          promoCode: promo?.code ?? null,
        },
      });

      /*
       * A code worth the full price leaves nothing to charge, and the gateway
       * rejects a zero-value order. The promo was validated on the server just
       * above, so the plan is granted directly instead of bouncing the customer
       * to a checkout that cannot succeed.
       */
      if (amount === 0) {
        await activateSubscription(
          ctx.prisma,
          payment.id,
          ctx.session.user.id,
          input.plan
        );

        return {
          paymentId: payment.id,
          orderId,
          amount,
          listPrice,
          discount: promo?.discount ?? 0,
          promoCode: promo?.code ?? null,
          plan: input.plan,
          snapToken: null,
          isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
          activated: true,
        };
      }

      const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const snapBaseUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

      let snapToken: string | null = null;

      if (serverKey) {
        try {
          const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session.user.id },
            select: { name: true, email: true },
          });

          const response = await fetch(snapBaseUrl, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
            },
            body: JSON.stringify({
              transaction_details: { order_id: orderId, gross_amount: amount },
              customer_details: { first_name: user?.name ?? 'Pelanggan', email: user?.email },
              item_details: [{ id: input.plan, price: amount, quantity: 1, name: `Paket ${tierInfo.name}` }],
            }),
          });

          if (response.ok) {
            const data = (await response.json()) as { token: string };
            snapToken = data.token;
          } else {
            console.error('[midtrans] Failed to create Snap transaction:', await response.text());
          }
        } catch (error) {
          console.error('[midtrans] Snap API error:', error);
        }
      }

      return {
        paymentId: payment.id,
        orderId,
        amount,
        listPrice,
        discount: promo?.discount ?? 0,
        promoCode: promo?.code ?? null,
        plan: input.plan,
        snapToken,
        isProduction,
        activated: false,
      };
    }),

  // Verifies a pending payment against the Midtrans API and activates the plan.
  // The plan is NEVER taken from the client: it is derived from the stored
  // payment amount, and activation only happens once the gateway reports
  // the transaction as settled.
  confirmPayment: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
      });

      // Ownership check: a payment may only be confirmed by the user it belongs to.
      if (!payment || payment.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (payment.status === 'PAID') {
        return { success: true, alreadyProcessed: true };
      }

      const plan = planFromPayment(payment);
      if (!plan) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nominal pembayaran tidak dikenali',
        });
      }

      const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';

      // Without a gateway key there is nothing to verify against, so we must not
      // grant a paid plan. The webhook remains the only path that can activate one.
      if (!serverKey) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message:
            'Gateway pembayaran belum dikonfigurasi. Hubungi administrator.',
        });
      }

      if (!payment.gatewayReferenceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Referensi pembayaran tidak ditemukan',
        });
      }

      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const statusBaseUrl = isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2';

      let status: MidtransStatus;
      try {
        const response = await fetch(
          `${statusBaseUrl}/${encodeURIComponent(payment.gatewayReferenceId)}/status`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
            },
          }
        );

        if (!response.ok) {
          console.error(
            '[midtrans] Status check failed:',
            await response.text()
          );
          throw new Error('status check failed');
        }

        status = (await response.json()) as MidtransStatus;
      } catch (error) {
        console.error('[midtrans] Status API error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Gagal memverifikasi pembayaran ke gateway',
        });
      }

      if (!isSettled(status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Pembayaran belum lunas',
        });
      }

      // Guard against a tampered/mismatched amount at the gateway.
      const paidAmount = Number.parseFloat(status.gross_amount ?? '0');
      if (!Number.isFinite(paidAmount) || paidAmount < payment.amount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Nominal pembayaran tidak sesuai',
        });
      }

      await activateSubscription(ctx.prisma, payment.id, payment.userId, plan);

      return { success: true, alreadyProcessed: false };
    }),
});
