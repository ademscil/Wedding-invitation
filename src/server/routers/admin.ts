import { z } from 'zod';
import { router, adminProcedure } from '../trpc';

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
});
