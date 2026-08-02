import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const checkinRouter = router({
  verifyGuest: protectedProcedure
    .input(z.object({ personalLink: z.string(), invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.prisma.guest.findUnique({
        where: { personalLink: input.personalLink },
      });

      if (!guest || guest.invitationId !== input.invitationId) {
        return { success: false, message: 'Tamu tidak ditemukan', guest: null };
      }

      // Verify the invitation belongs to the current user
      const invitation = await ctx.prisma.invitation.findFirst({
        where: { id: input.invitationId, userId: ctx.session!.user.id },
      });
      if (!invitation) return { success: false, message: 'Akses ditolak', guest: null };

      if (guest.checkedIn) {
        return { success: false, message: 'Tamu sudah check-in sebelumnya', guest };
      }

      const updated = await ctx.prisma.guest.update({
        where: { id: guest.id },
        data: { checkedIn: true, checkedInAt: new Date() },
      });

      return { success: true, message: `Selamat datang, ${guest.name}!`, guest: updated };
    }),

  getCheckinStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
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
