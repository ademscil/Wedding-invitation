import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { hash, compare } from 'bcryptjs';
import { router, protectedProcedure } from '../trpc';
import { getUserLimits } from '../lib/limits';
import { assertRateLimit } from '../lib/rate-limit';
import {
  createVerificationToken,
  buildVerificationUrl,
} from '../lib/verification';
import { sendEmail, verificationEmail } from '@/lib/email';

export const userRouter = router({
  /**
   * Quota snapshot for the dashboard, so plan limits are visible before a user
   * runs into them rather than surfacing as a surprise error mid-action.
   */
  getQuota: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const { tier, limits } = await getUserLimits(ctx.prisma, userId);

    const [invitationCount, nearestExpiry] = await Promise.all([
      ctx.prisma.invitation.count({ where: { userId } }),
      ctx.prisma.invitation.findFirst({
        where: { userId, status: 'PUBLISHED', expiresAt: { not: null } },
        orderBy: { expiresAt: 'asc' },
        select: { expiresAt: true },
      }),
    ]);

    return {
      tier,
      tierName: limits.name,
      maxInvitations: limits.maxInvitations,
      invitationCount,
      // -1 means unlimited; surface it as null so the UI doesn't render "-1 left".
      remainingInvitations:
        limits.maxInvitations === -1
          ? null
          : Math.max(0, limits.maxInvitations - invitationCount),
      maxGuests: limits.maxGuests,
      maxGalleryImages: limits.maxGalleryImages,
      maxEvents: limits.maxEvents,
      maxBankAccounts: limits.maxBankAccounts,
      duration: limits.duration,
      expiresAt: nearestExpiry?.expiresAt ?? null,
      // Mirrors the server-side gates so the UI can offer an upgrade path
      // instead of letting the user click into a FORBIDDEN error.
      features: {
        hasLoveStory: limits.hasLoveStory,
        hasCustomMusic: limits.hasCustomMusic,
        hasCustomDomain: limits.hasCustomDomain,
        hasAnalytics: limits.hasAnalytics,
        hasBroadcast: limits.hasBroadcast,
        hasExport: limits.hasExport,
        hasQrCheckin: limits.hasQrCheckin,
        hasEventPlanner: limits.hasEventPlanner,
        hasWatermark: limits.hasWatermark,
      },
    };
  }),

  getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { email: true, emailVerified: true },
    });

    return {
      email: user?.email ?? null,
      isVerified: !!user?.emailVerified,
    };
  }),

  sendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Sending mail costs money and can be used to spam an address, so throttle
    // per account rather than per IP.
    assertRateLimit(
      `verify-email:${userId}`,
      { limit: 3, windowMs: 15 * 60_000 },
      'Terlalu banyak permintaan verifikasi.'
    );

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });

    if (user.emailVerified) {
      return { sent: false, alreadyVerified: true };
    }

    const token = await createVerificationToken(ctx.prisma, user.email);

    await sendEmail({
      to: user.email,
      subject: 'Verifikasi email WedInvite Anda',
      html: verificationEmail({
        name: user.name ?? 'Pengguna',
        url: buildVerificationUrl(token),
      }),
    });

    return { sent: true, alreadyVerified: false };
  }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { id: true, name: true, email: true, phone: true, image: true },
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
        phone: z
          .string()
          .trim()
          .max(25)
          .regex(/^[0-9+\-\s()]*$/, 'Nomor HP hanya boleh berisi angka dan tanda + - ( )')
          .optional()
          .or(z.literal('')),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { name: input.name, phone: input.phone || null },
        select: { id: true, name: true, phone: true },
      });
    }),

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
