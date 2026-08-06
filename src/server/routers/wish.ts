import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { sendEmail, wishNotificationEmail } from '@/lib/email';
import { assertOwnsInvitation, assertOwnsWish } from '../lib/authorize';
import { assertRateLimit } from '../lib/rate-limit';

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
      // Public and unauthenticated: cap per IP so the guestbook can't be flooded.
      assertRateLimit(
        `wish:${ctx.ip}`,
        { limit: 5, windowMs: 60_000 },
        'Terlalu banyak ucapan dikirim.'
      );

      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
        include: { user: { select: { email: true } } },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Reject an identical message repeated within the hour (double-submit or bot).
      const duplicate = await ctx.prisma.wish.findFirst({
        where: {
          invitationId: invitation.id,
          guestName: input.guestName,
          message: input.message,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ucapan yang sama sudah terkirim.',
        });
      }

      const wish = await ctx.prisma.wish.create({
        data: {
          invitationId: invitation.id,
          guestName: input.guestName,
          message: input.message,
        },
      });

      if (invitation.user.email) {
        sendEmail({
          to: invitation.user.email,
          subject: `Ucapan Baru dari ${input.guestName}`,
          html: wishNotificationEmail({
            brideName: invitation.brideName,
            groomName: invitation.groomName,
            guestName: input.guestName,
            message: input.message,
          }),
        }).catch(() => undefined);
      }

      return wish;
    }),

  listAll: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

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
      await assertOwnsWish(ctx.prisma, input.id, ctx.session.user.id);

      return ctx.prisma.wish.update({
        where: { id: input.id },
        data: { isApproved: input.isApproved },
      });
    }),
});
