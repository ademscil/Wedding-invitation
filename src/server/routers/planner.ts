import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import { assertFeature } from '../lib/limits';
import {
  summarizeBudget,
  summarizeVendors,
  summarizeChecklist,
} from '../lib/planner-summary';

const CATEGORY = z.enum([
  'VENUE',
  'CATERING',
  'DECOR',
  'ATTIRE',
  'DOCUMENTATION',
  'ENTERTAINMENT',
  'OTHER',
]);

const VENDOR_STATUS = z.enum([
  'CONTACTED',
  'NEGOTIATING',
  'BOOKED',
  'PAID',
  'CANCELLED',
]);

const PHASE = z.enum([
  '12_MONTHS',
  '6_MONTHS',
  '3_MONTHS',
  '1_MONTH',
  '1_WEEK',
  'DAY_OF',
  'GENERAL',
]);

/** Rupiah amounts are stored as integers; reject negatives and absurd values. */
const money = z.number().int().min(0).max(100_000_000_000);

/**
 * Every planner procedure runs this first: the invitation must belong to the
 * caller AND their plan must include the planner.
 */
async function authorize(
  ctx: { prisma: import('@prisma/client').PrismaClient; session: { user: { id: string } } },
  invitationId: string
) {
  await assertOwnsInvitation(ctx.prisma, invitationId, ctx.session.user.id);
  await assertFeature(ctx.prisma, ctx.session.user.id, 'hasEventPlanner');
}

/**
 * Resolves a child row through its parent invitation so ownership and the
 * feature gate are both enforced before any write.
 */
async function authorizeChild(
  ctx: { prisma: import('@prisma/client').PrismaClient; session: { user: { id: string } } },
  model: 'budgetItem' | 'vendor' | 'checklistItem',
  id: string
) {
  const row = await (ctx.prisma[model] as {
    findFirst: (args: unknown) => Promise<{ invitationId: string } | null>;
  }).findFirst({
    where: { id, invitation: { userId: ctx.session.user.id } },
    select: { invitationId: true },
  });

  if (!row) throw new TRPCError({ code: 'NOT_FOUND' });

  await assertFeature(ctx.prisma, ctx.session.user.id, 'hasEventPlanner');
  return row;
}

export const plannerRouter = router({
  /** Headline numbers for the planner dashboard. */
  getSummary: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const [budgetItems, vendors, checklist] = await Promise.all([
        ctx.prisma.budgetItem.findMany({
          where: { invitationId: input.invitationId },
          select: { estimatedCost: true, actualCost: true, isPaid: true },
        }),
        ctx.prisma.vendor.findMany({
          where: { invitationId: input.invitationId },
          select: { status: true, price: true },
        }),
        ctx.prisma.checklistItem.findMany({
          where: { invitationId: input.invitationId },
          select: { isDone: true, dueDate: true },
        }),
      ]);

      return {
        budget: summarizeBudget(budgetItems),
        vendors: summarizeVendors(vendors),
        checklist: summarizeChecklist(checklist),
      };
    }),

  /* ---------------------------- Budget ---------------------------- */

  listBudget: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      return ctx.prisma.budgetItem.findMany({
        where: { invitationId: input.invitationId },
        orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
      });
    }),

  createBudget: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        category: CATEGORY,
        name: z.string().min(1, 'Nama item wajib diisi').max(120),
        estimatedCost: money.default(0),
        actualCost: money.optional(),
        isPaid: z.boolean().default(false),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      return ctx.prisma.budgetItem.create({ data: input });
    }),

  updateBudget: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        category: CATEGORY.optional(),
        name: z.string().min(1).max(120).optional(),
        estimatedCost: money.optional(),
        actualCost: money.nullable().optional(),
        isPaid: z.boolean().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await authorizeChild(ctx, 'budgetItem', id);
      return ctx.prisma.budgetItem.update({ where: { id }, data });
    }),

  deleteBudget: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorizeChild(ctx, 'budgetItem', input.id);
      return ctx.prisma.budgetItem.delete({ where: { id: input.id } });
    }),

  /* ---------------------------- Vendors --------------------------- */

  listVendors: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      return ctx.prisma.vendor.findMany({
        where: { invitationId: input.invitationId },
        orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
      });
    }),

  createVendor: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        name: z.string().min(1, 'Nama vendor wajib diisi').max(120),
        category: CATEGORY,
        contactName: z.string().max(120).optional(),
        phone: z.string().max(30).optional(),
        email: z.string().email('Email tidak valid').max(160).optional().or(z.literal('')),
        price: money.optional(),
        status: VENDOR_STATUS.default('CONTACTED'),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      const { email, ...rest } = input;
      return ctx.prisma.vendor.create({
        data: { ...rest, email: email || null },
      });
    }),

  updateVendor: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(120).optional(),
        category: CATEGORY.optional(),
        contactName: z.string().max(120).nullable().optional(),
        phone: z.string().max(30).nullable().optional(),
        email: z.string().max(160).nullable().optional(),
        price: money.nullable().optional(),
        status: VENDOR_STATUS.optional(),
        notes: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await authorizeChild(ctx, 'vendor', id);
      return ctx.prisma.vendor.update({ where: { id }, data });
    }),

  deleteVendor: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorizeChild(ctx, 'vendor', input.id);
      return ctx.prisma.vendor.delete({ where: { id: input.id } });
    }),

  /* --------------------------- Checklist -------------------------- */

  listChecklist: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      return ctx.prisma.checklistItem.findMany({
        where: { invitationId: input.invitationId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
    }),

  createChecklist: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        title: z.string().min(1, 'Judul tugas wajib diisi').max(200),
        phase: PHASE.default('GENERAL'),
        dueDate: z.string().optional(),
        notes: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const { dueDate, ...rest } = input;
      let parsedDue: Date | null = null;
      if (dueDate) {
        parsedDue = new Date(dueDate);
        if (Number.isNaN(parsedDue.getTime())) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tanggal tenggat tidak valid',
          });
        }
      }

      return ctx.prisma.checklistItem.create({
        data: { ...rest, dueDate: parsedDue },
      });
    }),

  updateChecklist: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        phase: PHASE.optional(),
        dueDate: z.string().nullable().optional(),
        isDone: z.boolean().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, isDone, ...rest } = input;
      await authorizeChild(ctx, 'checklistItem', id);

      let parsedDue: Date | null | undefined;
      if (dueDate === null) {
        parsedDue = null;
      } else if (dueDate !== undefined) {
        parsedDue = new Date(dueDate);
        if (Number.isNaN(parsedDue.getTime())) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Tanggal tenggat tidak valid',
          });
        }
      }

      return ctx.prisma.checklistItem.update({
        where: { id },
        data: {
          ...rest,
          ...(parsedDue !== undefined && { dueDate: parsedDue }),
          ...(isDone !== undefined && {
            isDone,
            // Keep the completion timestamp in step with the flag.
            completedAt: isDone ? new Date() : null,
          }),
        },
      });
    }),

  deleteChecklist: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorizeChild(ctx, 'checklistItem', input.id);
      return ctx.prisma.checklistItem.delete({ where: { id: input.id } });
    }),

  /** Seeds a standard Indonesian wedding checklist for an empty planner. */
  seedChecklist: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const existing = await ctx.prisma.checklistItem.count({
        where: { invitationId: input.invitationId },
      });

      // Idempotent: a double-click must not raise, it just has nothing to do.
      if (existing > 0) {
        return { created: 0, alreadySeeded: true };
      }

      const defaults: Array<{ title: string; phase: z.infer<typeof PHASE> }> = [
        { title: 'Tentukan tanggal & anggaran pernikahan', phase: '12_MONTHS' },
        { title: 'Susun daftar tamu awal', phase: '12_MONTHS' },
        { title: 'Survei dan booking gedung/tempat acara', phase: '12_MONTHS' },
        { title: 'Pilih vendor katering', phase: '6_MONTHS' },
        { title: 'Pilih vendor dekorasi', phase: '6_MONTHS' },
        { title: 'Booking fotografer & videografer', phase: '6_MONTHS' },
        { title: 'Fitting baju pengantin', phase: '3_MONTHS' },
        { title: 'Urus dokumen KUA / catatan sipil', phase: '3_MONTHS' },
        { title: 'Sebar undangan digital', phase: '1_MONTH' },
        { title: 'Konfirmasi ulang semua vendor', phase: '1_MONTH' },
        { title: 'Finalisasi jumlah tamu ke katering', phase: '1_WEEK' },
        { title: 'Siapkan seserahan & mahar', phase: '1_WEEK' },
        { title: 'Gladi bersih acara', phase: '1_WEEK' },
        { title: 'Siapkan kotak angpau & buku tamu', phase: 'DAY_OF' },
        { title: 'Briefing panitia & MC', phase: 'DAY_OF' },
      ];

      await ctx.prisma.checklistItem.createMany({
        data: defaults.map((task, index) => ({
          invitationId: input.invitationId,
          title: task.title,
          phase: task.phase,
          sortOrder: index,
        })),
      });

      return { created: defaults.length, alreadySeeded: false };
    }),
});
