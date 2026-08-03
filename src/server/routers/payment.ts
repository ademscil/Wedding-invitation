import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';

export const paymentRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session!.user.id },
      select: { subscriptionTier: true },
    });
    const subscription = await ctx.prisma.subscription.findFirst({
      where: { userId: ctx.session!.user.id, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    });
    return { tier: user?.subscriptionTier ?? 'FREE', subscription };
  }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.payment.findMany({
      where: { userId: ctx.session!.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(['STARTER', 'PREMIUM', 'BUSINESS']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tierInfo = SUBSCRIPTION_TIERS[input.plan];
      const amount = tierInfo.price;

      const orderId = `INV-${Date.now()}`;

      const payment = await ctx.prisma.payment.create({
        data: {
          userId: ctx.session!.user.id,
          amount,
          currency: 'IDR',
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          gateway: 'midtrans',
          gatewayReferenceId: orderId,
        },
      });

      const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const snapBaseUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

      let snapToken: string | null = null;

      if (serverKey) {
        try {
          const user = await ctx.prisma.user.findUnique({
            where: { id: ctx.session!.user.id },
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
        plan: input.plan,
        snapToken,
        isProduction,
      };
    }),

  // Called after successful Midtrans payment (simulated / webhook fallback)
  confirmPayment: protectedProcedure
    .input(
      z.object({
        paymentId: z.string(),
        plan: z.enum(['STARTER', 'PREMIUM', 'BUSINESS']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await ctx.prisma.$transaction([
        ctx.prisma.payment.update({
          where: { id: input.paymentId },
          data: { status: 'PAID' },
        }),
        ctx.prisma.user.update({
          where: { id: ctx.session!.user.id },
          data: { subscriptionTier: input.plan },
        }),
        ctx.prisma.subscription.create({
          data: {
            userId: ctx.session!.user.id,
            plan: input.plan,
            status: 'ACTIVE',
            paymentId: input.paymentId,
            startsAt: new Date(),
            expiresAt,
          },
        }),
      ]);

      return { success: true };
    }),
});
