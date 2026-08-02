import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const invitationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.invitation.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        template: true,
        _count: {
          select: {
            guests: true,
            wishes: true,
            analyticsEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.id },
        include: {
          template: true,
          guests: { orderBy: { createdAt: 'desc' } },
          wishes: { orderBy: { createdAt: 'desc' } },
          _count: {
            select: {
              guests: true,
              wishes: true,
              analyticsEvents: true,
            },
          },
        },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return invitation;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.slug },
        include: {
          template: true,
          wishes: {
            where: { isApproved: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return invitation;
    }),

  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string().optional(),
        brideName: z.string().default(''),
        groomName: z.string().default(''),
        slug: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slug =
        input.slug ||
        `${input.brideName || 'bride'}-dan-${input.groomName || 'groom'}-${nanoid(6)}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-');

      const existingSlug = await ctx.prisma.invitation.findUnique({
        where: { slug },
      });

      const finalSlug = existingSlug ? `${slug}-${nanoid(4)}` : slug;

      return ctx.prisma.invitation.create({
        data: {
          userId: ctx.session.user.id,
          slug: finalSlug,
          templateId: input.templateId,
          brideName: input.brideName,
          groomName: input.groomName,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        templateId: z.string().optional(),
        brideName: z.string().optional(),
        groomName: z.string().optional(),
        brideParents: z.string().optional(),
        groomParents: z.string().optional(),
        bridePhoto: z.string().optional(),
        groomPhoto: z.string().optional(),
        weddingDate: z.string().optional(),
        slug: z.string().optional(),
        quote: z.string().optional(),
        dressCode: z.string().optional(),
        streamingUrl: z.string().optional(),
        settings: z.string().optional(),
        events: z.string().optional(),
        bankAccounts: z.string().optional(),
        galleryImages: z.string().optional(),
        loveStory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, weddingDate, ...data } = input;

      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return ctx.prisma.invitation.update({
        where: { id },
        data: {
          ...data,
          weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        },
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'EXPIRED']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.id },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return ctx.prisma.invitation.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.id },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return ctx.prisma.invitation.delete({ where: { id: input.id } });
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.invitation.findUnique({
        where: { slug: input.slug },
      });
      return { available: !existing };
    }),
});
