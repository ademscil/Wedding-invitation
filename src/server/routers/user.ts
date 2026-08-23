import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        subscriptionTier: true,
        createdAt: true,
        // Presence of a password decides whether the change-password form applies;
        // the hash itself never leaves the server.
        hashedPassword: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan' });
    }

    const { hashedPassword, ...safe } = user;
    return { ...safe, hasPassword: Boolean(hashedPassword) };
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
        phone: z
          .string()
          .trim()
          .max(25)
          .regex(/^[0-9+\-\s()]*$/, 'Nomor HP tidak valid')
          .optional()
          .or(z.literal('')),
        image: z.string().url('URL foto tidak valid').optional().or(z.literal('')),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          name: input.name,
          phone: input.phone || null,
          image: input.image || null,
        },
        select: { id: true, name: true, phone: true, image: true },
      });

      return updated;
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z
          .string()
          .min(8, 'Password baru minimal 8 karakter')
          .max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { hashedPassword: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan' });
      }

      // Accounts created through OAuth have no password yet and may set one
      // without proving a previous one.
      if (user.hashedPassword) {
        if (!input.currentPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Masukkan password lama Anda',
          });
        }

        const matches = await bcrypt.compare(input.currentPassword, user.hashedPassword);
        if (!matches) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Password lama salah' });
        }
      }

      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { hashedPassword: await bcrypt.hash(input.newPassword, 10) },
      });

      return { success: true };
    }),

  /** Aggregate counters for the dashboard overview. */
  getUsageSummary: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [invitationCount, guestCount, wishCount, viewCount] = await Promise.all([
      ctx.prisma.invitation.count({ where: { userId } }),
      ctx.prisma.guest.count({ where: { invitation: { userId } } }),
      ctx.prisma.wish.count({ where: { invitation: { userId } } }),
      ctx.prisma.analyticsEvent.count({
        where: { invitation: { userId }, eventType: 'PAGE_VIEW' },
      }),
    ]);

    return { invitationCount, guestCount, wishCount, viewCount };
  }),
});
