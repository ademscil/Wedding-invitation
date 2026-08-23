import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import { normalizePromoCode } from '@/lib/promo';

export const adminRouter = router({
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalInvitations, totalGuests, totalWishes, publishedInvitations] =
      await Promise.all([
        ctx.prisma.user.count(),
        ctx.prisma.invitation.count(),
        ctx.prisma.guest.count(),
        ctx.prisma.wish.count(),
        ctx.prisma.invitation.count({ where: { status: 'PUBLISHED' } }),
      ]);
    return { totalUsers, totalInvitations, totalGuests, totalWishes, publishedInvitations };
  }),

  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.search
        ? {
            OR: [
              { name: { contains: input.search } },
              { email: { contains: input.search } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            subscriptionTier: true,
            createdAt: true,
            _count: { select: { invitations: true } },
          },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return { users, total, pages: Math.ceil(total / input.limit) };
    }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.string(), role: z.enum(['USER', 'ADMIN']) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });
    }),

  updateUserTier: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tier: z.enum(['FREE', 'STARTER', 'PREMIUM', 'BUSINESS']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { subscriptionTier: input.tier },
      });
    }),

  listInvitations: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const [invitations, total] = await Promise.all([
        ctx.prisma.invitation.findMany({
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true, email: true } },
            template: { select: { name: true } },
            _count: { select: { guests: true, wishes: true } },
          },
        }),
        ctx.prisma.invitation.count(),
      ]);
      return { invitations, total, pages: Math.ceil(total / input.limit) };
    }),

  listTemplates: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
  }),

  updateTemplate: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isActive: z.boolean().optional(),
        isPremium: z.boolean().optional(),
        price: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.template.update({ where: { id }, data });
    }),

  listWishes: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        isApproved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.isApproved !== undefined ? { isApproved: input.isApproved } : {};
      const [wishes, total] = await Promise.all([
        ctx.prisma.wish.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            invitation: { select: { brideName: true, groomName: true, slug: true } },
          },
        }),
        ctx.prisma.wish.count({ where }),
      ]);
      return { wishes, total, pages: Math.ceil(total / input.limit) };
    }),

  moderateWish: adminProcedure
    .input(z.object({ wishId: z.string(), isApproved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.wish.update({
        where: { id: input.wishId },
        data: { isApproved: input.isApproved },
      });
    }),

  listPromos: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  }),

  createPromo: adminProcedure
    .input(
      z.object({
        code: z.string().min(3).max(40),
        discountType: z.enum(['PERCENTAGE', 'FIXED']),
        discountValue: z.number().positive(),
        maxUses: z.number().int().positive().nullable().default(null),
        validFrom: z.string(),
        validUntil: z.string(),
        applicablePlans: z.array(z.enum(['STARTER', 'PREMIUM', 'BUSINESS'])).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const code = normalizePromoCode(input.code);

      if (!/^[A-Z0-9-]+$/.test(code)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Kode hanya boleh huruf, angka, dan tanda hubung.',
        });
      }

      // A percentage above 100 would compute a discount larger than the price.
      // evaluatePromo clamps it anyway, but storing it invites confusion later.
      if (input.discountType === 'PERCENTAGE' && input.discountValue > 100) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Diskon persentase tidak boleh lebih dari 100%.',
        });
      }

      const validFrom = new Date(input.validFrom);
      const validUntil = new Date(input.validUntil);

      if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tanggal tidak valid.' });
      }

      if (validUntil < validFrom) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Tanggal berakhir harus setelah tanggal mulai.',
        });
      }

      const existing = await ctx.prisma.promoCode.findUnique({ where: { code } });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Kode ini sudah ada.',
        });
      }

      return ctx.prisma.promoCode.create({
        data: {
          code,
          discountType: input.discountType,
          discountValue: input.discountValue,
          maxUses: input.maxUses,
          validFrom,
          validUntil,
          applicablePlans: JSON.stringify(input.applicablePlans),
        },
      });
    }),

  updatePromo: adminProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.promoCode.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),

  deletePromo: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Deactivating keeps the history; deleting is for codes never used.
      const promo = await ctx.prisma.promoCode.findUnique({
        where: { id: input.id },
        select: { currentUses: true },
      });

      if (promo && promo.currentUses > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Kode ini sudah pernah dipakai. Nonaktifkan saja agar riwayat pembayaran tetap bisa ditelusuri.',
        });
      }

      return ctx.prisma.promoCode.delete({ where: { id: input.id } });
    }),
});
