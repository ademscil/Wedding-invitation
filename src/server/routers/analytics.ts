import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import { checkRateLimit } from '../lib/rate-limit';
import { assertFeature } from '../lib/limits';

export const analyticsRouter = router({
  track: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string().max(120),
        eventType: z.enum([
          'PAGE_VIEW',
          'RSVP_SUBMIT',
          'WISH_SUBMIT',
          'GIFT_CLICK',
          'MUSIC_PLAY',
          'SHARE',
        ]),
        // Written verbatim to a row on every page view; keep it small.
        metadata: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Tracking is fire-and-forget, so drop excess events silently rather than
      // erroring — otherwise inflated view counts would be trivial to produce.
      const { allowed } = checkRateLimit(`track:${ctx.ip}:${input.invitationSlug}`, {
        limit: 30,
        windowMs: 60_000,
      });

      if (!allowed) return { success: false };

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
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );
      await assertFeature(ctx.prisma, ctx.session.user.id, 'hasAnalytics');

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
