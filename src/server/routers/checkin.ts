import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import { assertFeature } from '../lib/limits';

export const checkinRouter = router({
  verifyGuest: protectedProcedure
    .input(z.object({ personalLink: z.string(), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Authorize first so an unauthorized caller cannot probe guest links.
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );
      await assertFeature(ctx.prisma, ctx.session.user.id, 'hasQrCheckin');

      const guest = await ctx.prisma.guest.findUnique({
        where: { personalLink: input.personalLink },
        include: {
          table: {
            select: { name: true },
          },
        },
      });

      if (!guest || guest.invitationId !== input.invitationId) {
        return { success: false, message: 'Tamu tidak ditemukan', guest: null };
      }

      if (guest.checkedIn) {
        return {
          success: false,
          message: 'Tamu sudah check-in sebelumnya',
          guest: {
            ...guest,
            tableName: guest.table?.name ?? null,
          },
        };
      }

      const updated = await ctx.prisma.guest.update({
        where: { id: guest.id },
        data: { checkedIn: true, checkedInAt: new Date() },
        include: {
          table: {
            select: { name: true },
          },
        },
      });

      return {
        success: true,
        message: `Selamat datang, ${guest.name}!`,
        guest: {
          ...updated,
          tableName: updated.table?.name ?? null,
        },
      };
    }),

  getCheckinStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );
      await assertFeature(ctx.prisma, ctx.session.user.id, 'hasQrCheckin');

      const [total, checkedIn] = await Promise.all([
        ctx.prisma.guest.count({ where: { invitationId: input.invitationId } }),
        ctx.prisma.guest.count({
          where: { invitationId: input.invitationId, checkedIn: true },
        }),
      ]);

      const recentCheckins = await ctx.prisma.guest.findMany({
        where: { invitationId: input.invitationId, checkedIn: true },
        orderBy: { checkedInAt: 'desc' },
        take: 10,
        select: { id: true, name: true, checkedInAt: true, rsvpGuestCount: true },
      });

      return { total, checkedIn, recentCheckins };
    }),
});
