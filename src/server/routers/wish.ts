import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  router,
  publicProcedure,
  protectedProcedure,
  requireOwnedInvitation,
  requireOwnedWish,
} from '../trpc';

/** In-memory throttle for anonymous wish submissions, keyed by invitation + name. */
const recentSubmissions = new Map<string, number>();
const WISH_COOLDOWN_MS = 15_000;

function throttleWish(key: string) {
  const now = Date.now();

  // Opportunistically drop expired entries so the map cannot grow without bound.
  if (recentSubmissions.size > 500) {
    for (const [k, ts] of recentSubmissions) {
      if (now - ts > WISH_COOLDOWN_MS) recentSubmissions.delete(k);
    }
  }

  const last = recentSubmissions.get(key);
  if (last && now - last < WISH_COOLDOWN_MS) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Mohon tunggu sebentar sebelum mengirim ucapan lagi.',
    });
  }
  recentSubmissions.set(key, now);
}

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
        select: { id: true, status: true },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const wishes = await ctx.prisma.wish.findMany({
        where: { invitationId: invitation.id, isApproved: true },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        skip: input.cursor ? 1 : 0,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (wishes.length > input.limit) {
        nextCursor = wishes.pop()!.id;
      }

      return { wishes, nextCursor };
    }),

  create: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        guestName: z.string().trim().min(1, 'Nama wajib diisi').max(100),
        message: z.string().trim().min(1, 'Ucapan wajib diisi').max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
        select: { id: true, status: true },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Undangan tidak ditemukan' });
      }

      throttleWish(`${invitation.id}:${input.guestName.toLowerCase()}`);

      const wish = await ctx.prisma.wish.create({
        data: {
          invitationId: invitation.id,
          guestName: input.guestName,
          message: input.message,
        },
      });

      await ctx.prisma.analyticsEvent
        .create({
          data: { invitationId: invitation.id, eventType: 'WISH_SUBMIT' },
        })
        .catch(() => undefined);

      return wish;
    }),

  listAll: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      return ctx.prisma.wish.findMany({
        where: { invitationId: input.invitationId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  moderate: protectedProcedure
    .input(z.object({ id: z.string(), isApproved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedWish(ctx, input.id);

      return ctx.prisma.wish.update({
        where: { id: input.id },
        data: { isApproved: input.isApproved },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedWish(ctx, input.id);
      return ctx.prisma.wish.delete({ where: { id: input.id } });
    }),
});
