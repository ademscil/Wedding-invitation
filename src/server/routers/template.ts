import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const templateRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          isPremium: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.template.findMany({
        where: {
          isActive: true,
          ...(input?.category && { category: input.category }),
          ...(input?.isPremium !== undefined && {
            isPremium: input.isPremium,
          }),
        },
        orderBy: { createdAt: 'asc' },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.template.findUnique({
        where: { slug: input.slug },
      });
    }),
});
