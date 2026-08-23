import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import {
  assertCanCreateInvitation,
  assertCanUseTemplate,
  assertContentWithinLimits,
  assertSettingsWithinLimits,
  getUserLimits,
} from '../lib/limits';
import {
  assertSlugAvailable,
  assertValidSlug,
  buildUniqueSlug,
  isReservedSlug,
  slugify,
  SLUG_PATTERN,
} from '../lib/slug';

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
      const invitation = await ctx.prisma.invitation.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
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

      if (!invitation) {
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

      // The active window is what the plan actually sold; past it the public
      // page stops resolving even though the row is still PUBLISHED.
      if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Undangan ini sudah tidak aktif',
        });
      }

      return invitation;
    }),

  create: protectedProcedure
    .input(
      z.object({
        templateId: z.string().optional(),
        brideName: z.string().max(120).default(''),
        groomName: z.string().max(120).default(''),
        slug: z.string().max(80).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCanCreateInvitation(ctx.prisma, ctx.session.user.id);

      if (input.templateId) {
        await assertCanUseTemplate(
          ctx.prisma,
          ctx.session.user.id,
          input.templateId
        );
      }

      let finalSlug: string;
      if (input.slug) {
        // An explicitly chosen slug must be valid and free; we don't silently
        // rewrite it, otherwise the user ends up on a URL they didn't pick.
        finalSlug = assertValidSlug(slugify(input.slug));
        await assertSlugAvailable(ctx.prisma, finalSlug);
      } else {
        const base = slugify(
          `${input.brideName || 'bride'}-dan-${input.groomName || 'groom'}`
        );
        finalSlug = await buildUniqueSlug(ctx.prisma, base, () => nanoid(6));
      }

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

  /**
   * Copies an invitation's content into a new draft.
   *
   * A wedding organiser on the Business plan builds the same shape of
   * invitation over and over; retyping every event and bank account each time
   * is the difference between the plan being worth its price and not.
   *
   * Guests, wishes, analytics and the custom domain are deliberately not
   * copied: they belong to the original event, and the domain is unique.
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await assertOwnsInvitation(
        ctx.prisma,
        input.id,
        ctx.session.user.id
      );

      // The copy counts against the plan exactly like a new invitation.
      await assertCanCreateInvitation(ctx.prisma, ctx.session.user.id);

      const base = slugify(
        `${original.brideName || 'undangan'}-dan-${original.groomName || 'salinan'}`
      );
      const slug = await buildUniqueSlug(ctx.prisma, base, () => nanoid(6));

      return ctx.prisma.invitation.create({
        data: {
          userId: ctx.session.user.id,
          slug,
          templateId: original.templateId,
          // Always a draft: publishing is a decision, not something inherited.
          status: 'DRAFT',
          brideName: original.brideName,
          groomName: original.groomName,
          brideParents: original.brideParents,
          groomParents: original.groomParents,
          bridePhoto: original.bridePhoto,
          groomPhoto: original.groomPhoto,
          weddingDate: original.weddingDate,
          quote: original.quote,
          dressCode: original.dressCode,
          streamingUrl: original.streamingUrl,
          settings: original.settings,
          events: original.events,
          bankAccounts: original.bankAccounts,
          galleryImages: original.galleryImages,
          loveStory: original.loveStory,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        templateId: z.string().optional(),
        brideName: z.string().max(120).optional(),
        groomName: z.string().max(120).optional(),
        brideParents: z.string().max(300).optional(),
        groomParents: z.string().max(300).optional(),
        bridePhoto: z.string().max(2048).optional(),
        groomPhoto: z.string().max(2048).optional(),
        weddingDate: z.string().max(40).optional(),
        slug: z.string().max(80).optional(),
        quote: z.string().max(1000).optional(),
        dressCode: z.string().max(300).optional(),
        streamingUrl: z.string().max(2048).optional(),
        /*
         * The JSON columns are capped by size as well as by the per-plan item
         * counts checked below. The count limits alone would still allow a
         * single event with a megabyte-long address.
         */
        settings: z.string().max(20_000).optional(),
        events: z.string().max(20_000).optional(),
        bankAccounts: z.string().max(10_000).optional(),
        galleryImages: z.string().max(60_000).optional(),
        loveStory: z.string().max(40_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, weddingDate, slug, ...data } = input;

      const invitation = await assertOwnsInvitation(
        ctx.prisma,
        id,
        ctx.session.user.id
      );

      if (data.templateId) {
        await assertCanUseTemplate(
          ctx.prisma,
          ctx.session.user.id,
          data.templateId
        );
      }

      await assertContentWithinLimits(
        ctx.prisma,
        ctx.session.user.id,
        {
          events: data.events,
          galleryImages: data.galleryImages,
          bankAccounts: data.bankAccounts,
          loveStory: data.loveStory,
        },
        invitation
      );

      await assertSettingsWithinLimits(
        ctx.prisma,
        ctx.session.user.id,
        data.settings,
        invitation.settings
      );

      // Changing the slug changes the public URL, so validate it and make sure
      // it isn't already taken instead of letting the DB throw a raw P2002.
      // Slugs created before validation existed may not survive slugify(), so
      // only touch the column when the caller actually asked for a new value —
      // resaving a form must never silently rewrite a URL already shared out.
      let nextSlug: string | undefined;
      if (slug !== undefined && slug !== invitation.slug) {
        nextSlug = assertValidSlug(slugify(slug));
        if (nextSlug !== invitation.slug) {
          await assertSlugAvailable(ctx.prisma, nextSlug, id);
        }
      }

      let parsedWeddingDate: Date | undefined;
      if (weddingDate) {
        parsedWeddingDate = new Date(weddingDate);
        if (Number.isNaN(parsedWeddingDate.getTime())) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tanggal pernikahan tidak valid',
          });
        }
      }

      return ctx.prisma.invitation.update({
        where: { id },
        data: {
          ...data,
          ...(nextSlug !== undefined && { slug: nextSlug }),
          weddingDate: parsedWeddingDate,
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
      const invitation = await assertOwnsInvitation(
        ctx.prisma,
        input.id,
        ctx.session.user.id
      );

      // Start the paid-for active window at first publish. Re-publishing later
      // keeps the original expiry so the window can't be reset for free.
      let expiresAt: Date | undefined;
      if (input.status === 'PUBLISHED' && !invitation.expiresAt) {
        const { limits } = await getUserLimits(ctx.prisma, ctx.session.user.id);
        const stamp = new Date();
        stamp.setMonth(stamp.getMonth() + limits.durationMonths);
        expiresAt = stamp;
      }

      return ctx.prisma.invitation.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(expiresAt && { expiresAt }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnsInvitation(ctx.prisma, input.id, ctx.session.user.id);

      return ctx.prisma.invitation.delete({ where: { id: input.id } });
    }),

  checkSlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const slug = slugify(input.slug);

      if (slug.length < 3 || !SLUG_PATTERN.test(slug) || isReservedSlug(slug)) {
        return { available: false, slug };
      }

      const existing = await ctx.prisma.invitation.findUnique({
        where: { slug },
        select: { id: true },
      });

      return { available: !existing, slug };
    }),
});
