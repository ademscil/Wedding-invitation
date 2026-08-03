import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { hash, compare } from 'bcryptjs';
import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  getAuthMethods: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { hashedPassword: true },
    });
    return { hasPassword: !!user?.hashedPassword };
  }),

  // Sets a password for accounts that don't have one yet (e.g. Google sign-in),
  // or changes it when the correct current password is provided.
  setPassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, 'Password minimal 6 karakter'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (user.hashedPassword) {
        if (!input.currentPassword) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Password saat ini wajib diisi' });
        }
        const isValid = await compare(input.currentPassword, user.hashedPassword);
        if (!isValid) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Password saat ini salah' });
        }
      }

      const hashedPassword = await hash(input.newPassword, 12);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      });

      return { success: true };
    }),
});
