import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const wishRouter = router({
  list: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
      });

      if (!invitation) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const wishes = await ctx.prisma.wish.findMany({
        where: {
          invitationId: invitation.id,
          isApproved: true,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (wishes.length > input.limit) {
        const nextItem = wishes.pop();
        nextCursor = nextItem!.id;
      }

      return { wishes, nextCursor };
    }),

  create: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        guestName: z.string().min(1).max(100),
        message: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return ctx.prisma.wish.create({
        data: {
          invitationId: invitation.id,
          guestName: input.guestName,
          message: input.message,
        },
      });
    }),

  listAll: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.wish.findMany({
        where: { invitationId: input.invitationId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  moderate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isApproved: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.wish.update({
        where: { id: input.id },
        data: { isApproved: input.isApproved },
      });
    }),
});
