import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import {
  router,
  publicProcedure,
  protectedProcedure,
  requireOwnedInvitation,
} from '../trpc';
import { assertFeature, assertQuota, getUserTier, hasFeature } from '@/lib/subscription';

/** Slugs the app itself serves — an invitation may never claim one. */
const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'dashboard',
  'login',
  'register',
  'pricing',
  'templates',
  'sitemap.xml',
  'robots.txt',
  'favicon.ico',
  '_next',
  'to',
]);

const slugSchema = z
  .string()
  .min(3, 'Link minimal 3 karakter')
  .max(60, 'Link maksimal 60 karakter')
  .regex(/^[a-z0-9-]+$/, 'Link hanya boleh berisi huruf kecil, angka, dan tanda hubung')
  .refine((s) => !s.startsWith('-') && !s.endsWith('-'), 'Link tidak boleh diawali/diakhiri tanda hubung')
  .refine((s) => !RESERVED_SLUGS.has(s), 'Link ini sudah dipakai sistem');

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/** Counts entries in a JSON-array column, tolerating malformed values. */
function countJsonArray(value: string | null | undefined): number {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export const invitationRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.invitation.findMany({
      where: { userId: ctx.session.user.id },
      include: {
        template: true,
        _count: { select: { guests: true, wishes: true, analyticsEvents: true } },
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
          _count: { select: { guests: true, wishes: true, analyticsEvents: true } },
        },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Undangan tidak ditemukan' });
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
            take: 50,
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
        brideName: z.string().max(60).default(''),
        groomName: z.string().max(60).default(''),
        slug: slugSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);

      const existingCount = await ctx.prisma.invitation.count({
        where: { userId: ctx.session.user.id },
      });
      assertQuota(tier, 'maxInvitations', existingCount);

      // A premium template requires a paid plan.
      if (input.templateId) {
        const template = await ctx.prisma.template.findUnique({
          where: { id: input.templateId },
          select: { isPremium: true, isActive: true },
        });
        if (!template || !template.isActive) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Template tidak tersedia' });
        }
        if (template.isPremium && tier === 'FREE') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Template ini khusus paket berbayar. Upgrade untuk menggunakannya.',
          });
        }
      }

      const base =
        input.slug ||
        toSlug(`${input.brideName || 'undangan'}-dan-${input.groomName || 'kami'}`) ||
        'undangan';

      // Try the requested slug first, then fall back to suffixed variants.
      // Checking each candidate beats a single lookup, which would race a
      // concurrent create for the same name.
      const candidates = [
        input.slug ?? `${base}-${nanoid(6).toLowerCase()}`,
        ...Array.from({ length: 4 }, () => `${base}-${nanoid(6).toLowerCase()}`),
      ];

      let finalSlug: string | null = null;
      for (const candidate of candidates) {
        const taken = await ctx.prisma.invitation.findUnique({
          where: { slug: candidate },
          select: { id: true },
        });
        if (!taken) {
          finalSlug = candidate;
          break;
        }
      }

      if (!finalSlug) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Link undangan sudah dipakai, coba nama lain',
        });
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

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        templateId: z.string().optional(),
        brideName: z.string().max(60).optional(),
        groomName: z.string().max(60).optional(),
        brideParents: z.string().max(200).optional(),
        groomParents: z.string().max(200).optional(),
        bridePhoto: z.string().optional(),
        groomPhoto: z.string().optional(),
        weddingDate: z.string().optional(),
        slug: slugSchema.optional(),
        quote: z.string().max(500).optional(),
        dressCode: z.string().max(120).optional(),
        streamingUrl: z.string().optional(),
        settings: z.string().optional(),
        events: z.string().optional(),
        bankAccounts: z.string().optional(),
        galleryImages: z.string().optional(),
        loveStory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, weddingDate, slug, ...data } = input;

      await requireOwnedInvitation(ctx, id);
      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);

      // Enforce per-tier content quotas on the JSON collections.
      if (data.events !== undefined) {
        assertQuota(tier, 'maxEvents', 0, countJsonArray(data.events));
      }
      if (data.galleryImages !== undefined) {
        assertQuota(tier, 'maxGalleryImages', 0, countJsonArray(data.galleryImages));
      }
      if (data.bankAccounts !== undefined) {
        assertQuota(tier, 'maxBankAccounts', 0, countJsonArray(data.bankAccounts));
      }
      if (data.loveStory !== undefined && countJsonArray(data.loveStory) > 0) {
        assertFeature(tier, 'hasLoveStory');
      }

      // Custom background music is a paid feature.
      if (data.settings !== undefined) {
        try {
          const parsed = JSON.parse(data.settings) as { musicUrl?: string };
          if (parsed.musicUrl && !hasFeature(tier, 'hasCustomMusic')) {
            assertFeature(tier, 'hasCustomMusic');
          }
        } catch {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Pengaturan tidak valid' });
        }
      }

      if (data.templateId) {
        const template = await ctx.prisma.template.findUnique({
          where: { id: data.templateId },
          select: { isPremium: true, isActive: true },
        });
        if (!template || !template.isActive) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Template tidak tersedia' });
        }
        if (template.isPremium && tier === 'FREE') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Template ini khusus paket berbayar. Upgrade untuk menggunakannya.',
          });
        }
      }

      // A slug change must not collide with another invitation.
      if (slug) {
        const taken = await ctx.prisma.invitation.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (taken && taken.id !== id) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Link ini sudah dipakai' });
        }
      }

      let parsedDate: Date | undefined;
      if (weddingDate) {
        const d = new Date(weddingDate);
        if (Number.isNaN(d.getTime())) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tanggal tidak valid' });
        }
        parsedDate = d;
      }

      return ctx.prisma.invitation.update({
        where: { id },
        data: { ...data, ...(slug && { slug }), weddingDate: parsedDate },
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
      const invitation = await requireOwnedInvitation(ctx, input.id);

      // Publishing requires the minimum data a guest needs to act on.
      if (input.status === 'PUBLISHED') {
        const missing: string[] = [];
        if (!invitation.brideName.trim()) missing.push('nama mempelai wanita');
        if (!invitation.groomName.trim()) missing.push('nama mempelai pria');
        if (!invitation.weddingDate) missing.push('tanggal pernikahan');
        if (countJsonArray(invitation.events) === 0) missing.push('minimal 1 acara');

        if (missing.length > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Lengkapi dulu: ${missing.join(', ')}.`,
          });
        }
      }

      return ctx.prisma.invitation.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const source = await requireOwnedInvitation(ctx, input.id);
      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);

      const existingCount = await ctx.prisma.invitation.count({
        where: { userId: ctx.session.user.id },
      });
      assertQuota(tier, 'maxInvitations', existingCount);

      const base = toSlug(`${source.brideName}-dan-${source.groomName}`) || 'undangan';

      return ctx.prisma.invitation.create({
        data: {
          userId: ctx.session.user.id,
          slug: `${base}-${nanoid(6).toLowerCase()}`,
          status: 'DRAFT',
          templateId: source.templateId,
          brideName: source.brideName,
          groomName: source.groomName,
          brideParents: source.brideParents,
          groomParents: source.groomParents,
          bridePhoto: source.bridePhoto,
          groomPhoto: source.groomPhoto,
          weddingDate: source.weddingDate,
          settings: source.settings,
          events: source.events,
          bankAccounts: source.bankAccounts,
          galleryImages: source.galleryImages,
          loveStory: source.loveStory,
          quote: source.quote,
          dressCode: source.dressCode,
          streamingUrl: source.streamingUrl,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.id);
      return ctx.prisma.invitation.delete({ where: { id: input.id } });
    }),

  checkSlug: protectedProcedure
    .input(z.object({ slug: z.string(), excludeId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const parsed = slugSchema.safeParse(input.slug);
      if (!parsed.success) {
        return { available: false, reason: parsed.error.issues[0].message };
      }

      const existing = await ctx.prisma.invitation.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      });

      if (existing && existing.id !== input.excludeId) {
        return { available: false, reason: 'Link ini sudah dipakai' };
      }

      return { available: true, reason: null };
    }),
});
