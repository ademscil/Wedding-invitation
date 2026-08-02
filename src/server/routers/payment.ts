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

      const payment = await ctx.prisma.payment.create({
        data: {
          userId: ctx.session!.user.id,
          amount,
          currency: 'IDR',
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          gateway: 'midtrans',
          gatewayReferenceId: `INV-${Date.now()}`,
        },
      });

      // Return payment details — frontend can use Midtrans Snap with NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
      return {
        paymentId: payment.id,
        orderId: payment.gatewayReferenceId,
        amount,
        plan: input.plan,
        // Snap token would be fetched from Midtrans server API using MIDTRANS_SERVER_KEY
        // For now return the metadata needed to call Snap
        snapClientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
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
