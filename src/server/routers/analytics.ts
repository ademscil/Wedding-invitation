import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const analyticsRouter = router({
  track: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        eventType: z.enum([
          'PAGE_VIEW',
          'RSVP_SUBMIT',
          'WISH_SUBMIT',
          'GIFT_CLICK',
          'MUSIC_PLAY',
          'SHARE',
        ]),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
      });

      if (!invitation) return { success: false };

      await ctx.prisma.analyticsEvent.create({
        data: {
          invitationId: invitation.id,
          eventType: input.eventType,
          metadata: input.metadata,
        },
      });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [totalViews, totalRsvps, totalWishes, totalGiftClicks] =
        await Promise.all([
          ctx.prisma.analyticsEvent.count({
            where: {
              invitationId: input.invitationId,
              eventType: 'PAGE_VIEW',
            },
          }),
          ctx.prisma.analyticsEvent.count({
            where: {
              invitationId: input.invitationId,
              eventType: 'RSVP_SUBMIT',
            },
          }),
          ctx.prisma.analyticsEvent.count({
            where: {
              invitationId: input.invitationId,
              eventType: 'WISH_SUBMIT',
            },
          }),
          ctx.prisma.analyticsEvent.count({
            where: {
              invitationId: input.invitationId,
              eventType: 'GIFT_CLICK',
            },
          }),
        ]);

      const recentViews = await ctx.prisma.analyticsEvent.findMany({
        where: {
          invitationId: input.invitationId,
          eventType: 'PAGE_VIEW',
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { createdAt: true },
      });

      return {
        totalViews,
        totalRsvps,
        totalWishes,
        totalGiftClicks,
        recentViews,
      };
    }),
});
