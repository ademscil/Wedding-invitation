import { z } from 'zod';
import { router, protectedProcedure, requireOwnedInvitation } from '../trpc';
import { assertFeature, getUserTier } from '@/lib/subscription';

/** Accepts a raw scan and extracts the personal link from a full URL or bare code. */
function extractPersonalLink(raw: string): string {
  const value = raw.trim();
  try {
    const url = new URL(value);
    const fromQuery = url.searchParams.get('to');
    if (fromQuery) return fromQuery;
    const segments = url.pathname.split('/').filter(Boolean);
    const toIndex = segments.indexOf('to');
    if (toIndex !== -1 && segments[toIndex + 1]) return segments[toIndex + 1];
    return segments[segments.length - 1] ?? value;
  } catch {
    return value;
  }
}

export const checkinRouter = router({
  verifyGuest: protectedProcedure
    .input(z.object({ personalLink: z.string().min(1), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);
      assertFeature(tier, 'hasQrCheckin');

      const code = extractPersonalLink(input.personalLink);

      const guest = await ctx.prisma.guest.findUnique({
        where: { personalLink: code },
      });

      if (!guest || guest.invitationId !== input.invitationId) {
        return { success: false, message: 'Tamu tidak ditemukan', guest: null };
      }

      if (guest.checkedIn) {
        return {
          success: false,
          message: `${guest.name} sudah check-in sebelumnya`,
          guest,
        };
      }

      const updated = await ctx.prisma.guest.update({
        where: { id: guest.id },
        data: { checkedIn: true, checkedInAt: new Date() },
      });

      return {
        success: true,
        message: `Selamat datang, ${guest.name}!`,
        guest: updated,
      };
    }),

  /** Reverses a check-in made by mistake. */
  undoCheckin: protectedProcedure
    .input(z.object({ guestId: z.string(), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const result = await ctx.prisma.guest.updateMany({
        where: { id: input.guestId, invitationId: input.invitationId },
        data: { checkedIn: false, checkedInAt: null },
      });

      return { success: result.count > 0 };
    }),

  getCheckinStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const where = { invitationId: input.invitationId };

      const [total, checkedIn, attending, arrivedSum] = await Promise.all([
        ctx.prisma.guest.count({ where }),
        ctx.prisma.guest.count({ where: { ...where, checkedIn: true } }),
        ctx.prisma.guest.count({ where: { ...where, rsvpStatus: 'ATTENDING' } }),
        ctx.prisma.guest.aggregate({
          where: { ...where, checkedIn: true },
          _sum: { rsvpGuestCount: true },
        }),
      ]);

      const recentCheckins = await ctx.prisma.guest.findMany({
        where: { ...where, checkedIn: true },
        orderBy: { checkedInAt: 'desc' },
        take: 15,
        select: { id: true, name: true, checkedInAt: true, rsvpGuestCount: true },
      });

      return {
        total,
        checkedIn,
        attending,
        headcount: arrivedSum._sum.rsvpGuestCount || 0,
        recentCheckins,
      };
    }),
});
