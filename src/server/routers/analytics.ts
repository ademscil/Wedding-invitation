import { z } from 'zod';
import { subDays } from 'date-fns';
import { router, publicProcedure, protectedProcedure, requireOwnedInvitation } from '../trpc';
import { assertFeature, getUserTier } from '@/lib/subscription';

const EVENT_TYPES = [
  'PAGE_VIEW',
  'RSVP_SUBMIT',
  'WISH_SUBMIT',
  'GIFT_CLICK',
  'MUSIC_PLAY',
  'SHARE',
] as const;

/** Classifies a user-agent string into a coarse device bucket. */
function deviceFromUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'Lainnya';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

/** Reduces a referrer URL to its hostname, or labels it as direct traffic. */
function referrerLabel(referrer: string | null | undefined): string {
  if (!referrer) return 'Langsung';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (/wa\.me|whatsapp/i.test(host)) return 'WhatsApp';
    if (/instagram/i.test(host)) return 'Instagram';
    if (/facebook|fb\./i.test(host)) return 'Facebook';
    return host;
  } catch {
    return 'Lainnya';
  }
}

export const analyticsRouter = router({
  track: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        eventType: z.enum(EVENT_TYPES),
        metadata: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
        select: { id: true, status: true },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        return { success: false };
      }

      const headers = ctx.req?.headers;

      await ctx.prisma.analyticsEvent.create({
        data: {
          invitationId: invitation.id,
          eventType: input.eventType,
          metadata: input.metadata,
          userAgent: headers?.get('user-agent') ?? null,
          referrer: headers?.get('referer') ?? null,
          // Trust the left-most forwarded address; behind a proxy this is the client.
          visitorIp:
            headers?.get('x-forwarded-for')?.split(',')[0].trim() ??
            headers?.get('x-real-ip') ??
            null,
        },
      });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);
      assertFeature(tier, 'hasAnalytics');

      const where = { invitationId: input.invitationId };

      const [totalViews, totalRsvps, totalWishes, totalGiftClicks, totalShares] =
        await Promise.all([
          ctx.prisma.analyticsEvent.count({ where: { ...where, eventType: 'PAGE_VIEW' } }),
          ctx.prisma.analyticsEvent.count({ where: { ...where, eventType: 'RSVP_SUBMIT' } }),
          ctx.prisma.analyticsEvent.count({ where: { ...where, eventType: 'WISH_SUBMIT' } }),
          ctx.prisma.analyticsEvent.count({ where: { ...where, eventType: 'GIFT_CLICK' } }),
          ctx.prisma.analyticsEvent.count({ where: { ...where, eventType: 'SHARE' } }),
        ]);

      // Only the last 30 days feed the chart, so a long-lived invitation
      // does not drag the whole event table into memory.
      const since = subDays(new Date(), 30);
      const recentEvents = await ctx.prisma.analyticsEvent.findMany({
        where: { ...where, eventType: 'PAGE_VIEW', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 5000,
        select: { createdAt: true, userAgent: true, referrer: true },
      });

      const deviceCounts = new Map<string, number>();
      const referrerCounts = new Map<string, number>();
      for (const event of recentEvents) {
        const device = deviceFromUserAgent(event.userAgent);
        const source = referrerLabel(event.referrer);
        deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
        referrerCounts.set(source, (referrerCounts.get(source) ?? 0) + 1);
      }

      const toSortedList = (map: Map<string, number>) =>
        [...map.entries()]
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

      return {
        totalViews,
        totalRsvps,
        totalWishes,
        totalGiftClicks,
        totalShares,
        recentViews: recentEvents.map((e) => ({ createdAt: e.createdAt })),
        devices: toSortedList(deviceCounts),
        referrers: toSortedList(referrerCounts).slice(0, 6),
      };
    }),
});
