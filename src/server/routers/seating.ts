import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';
import { router, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import { assertFeature } from '../lib/limits';
import {
  computeAutoArrangement,
  fitsInTable,
  headcount,
  seatsTaken,
} from '../lib/seating-plan';

type Ctx = {
  prisma: PrismaClient;
  session: { user: { id: string } };
};

const SHAPE = z.enum(['ROUND', 'RECTANGLE']);

/** Positions are percentages of the canvas so the plan scales with the viewport. */
const percent = z.number().int().min(0).max(100);

async function authorize(ctx: Ctx, invitationId: string) {
  await assertOwnsInvitation(ctx.prisma, invitationId, ctx.session.user.id);
  await assertFeature(ctx.prisma, ctx.session.user.id, 'hasEventPlanner');
}

/** Resolves a table through its invitation so ownership is always checked. */
async function authorizeTable(ctx: Ctx, tableId: string) {
  const table = await ctx.prisma.seatingTable.findFirst({
    where: { id: tableId, invitation: { userId: ctx.session.user.id } },
    select: { id: true, invitationId: true, capacity: true },
  });

  if (!table) throw new TRPCError({ code: 'NOT_FOUND' });

  await assertFeature(ctx.prisma, ctx.session.user.id, 'hasEventPlanner');
  return table;
}

export const seatingRouter = router({
  /** Tables with their seated guests, plus everyone still unassigned. */
  getLayout: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const [tables, unassigned] = await Promise.all([
        ctx.prisma.seatingTable.findMany({
          where: { invitationId: input.invitationId },
          orderBy: { createdAt: 'asc' },
          include: {
            guests: {
              orderBy: { name: 'asc' },
              select: {
                id: true,
                name: true,
                groupName: true,
                rsvpStatus: true,
                rsvpGuestCount: true,
              },
            },
          },
        }),
        ctx.prisma.guest.findMany({
          where: { invitationId: input.invitationId, tableId: null },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            groupName: true,
            rsvpStatus: true,
            rsvpGuestCount: true,
          },
        }),
      ]);

      // Seats are counted per head, not per guest row: one RSVP can bring several.
      const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
      const seatsUsed = tables.reduce(
        (sum, t) => sum + seatsTaken(t.guests),
        0
      );

      return {
        tables: tables.map((table) => ({
          ...table,
          occupied: seatsTaken(table.guests),
        })),
        unassigned,
        summary: {
          tableCount: tables.length,
          totalSeats,
          seatsUsed,
          seatsFree: Math.max(0, totalSeats - seatsUsed),
          unassignedGuests: unassigned.length,
          unassignedHeads: seatsTaken(unassigned),
        },
      };
    }),

  createTable: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        name: z.string().min(1, 'Nama meja wajib diisi').max(60),
        capacity: z.number().int().min(1).max(50).default(8),
        shape: SHAPE.default('ROUND'),
        positionX: percent.default(50),
        positionY: percent.default(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);
      return ctx.prisma.seatingTable.create({ data: input });
    }),

  updateTable: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(60).optional(),
        capacity: z.number().int().min(1).max(50).optional(),
        shape: SHAPE.optional(),
        positionX: percent.optional(),
        positionY: percent.optional(),
        notes: z.string().max(300).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await authorizeTable(ctx, id);

      // Shrinking a table below its current occupancy would silently create an
      // over-capacity plan, so reject it and let the user unseat guests first.
      if (data.capacity !== undefined) {
        const seated = await ctx.prisma.guest.findMany({
          where: { tableId: id },
          select: { rsvpGuestCount: true },
        });
        const occupied = seatsTaken(seated);

        if (data.capacity < occupied) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Meja sudah terisi ${occupied} kursi. Pindahkan tamu dulu sebelum mengurangi kapasitas.`,
          });
        }
      }

      return ctx.prisma.seatingTable.update({ where: { id }, data });
    }),

  deleteTable: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorizeTable(ctx, input.id);
      // Guests are unseated by the SetNull relation, never deleted.
      return ctx.prisma.seatingTable.delete({ where: { id: input.id } });
    }),

  /** Seats a guest, or moves them between tables. Pass tableId: null to unseat. */
  assignGuest: protectedProcedure
    .input(
      z.object({
        guestId: z.string(),
        tableId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.prisma.guest.findFirst({
        where: {
          id: input.guestId,
          invitation: { userId: ctx.session.user.id },
        },
        select: { id: true, invitationId: true, rsvpGuestCount: true },
      });

      if (!guest) throw new TRPCError({ code: 'NOT_FOUND' });
      await assertFeature(ctx.prisma, ctx.session.user.id, 'hasEventPlanner');

      if (input.tableId === null) {
        return ctx.prisma.guest.update({
          where: { id: guest.id },
          data: { tableId: null },
        });
      }

      const table = await authorizeTable(ctx, input.tableId);

      // A table can only seat guests from its own invitation.
      if (table.invitationId !== guest.invitationId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Meja dan tamu berasal dari undangan berbeda',
        });
      }

      const seated = await ctx.prisma.guest.findMany({
        where: { tableId: table.id, id: { not: guest.id } },
        select: { rsvpGuestCount: true },
      });
      const occupied = seatsTaken(seated);
      const incoming = headcount(guest);

      if (!fitsInTable(occupied, incoming, table.capacity)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Kapasitas meja tidak cukup (terisi ${occupied} dari ${table.capacity}, butuh ${incoming} kursi).`,
        });
      }

      return ctx.prisma.guest.update({
        where: { id: guest.id },
        data: { tableId: table.id },
      });
    }),

  /** Clears every seat assignment for an invitation. */
  resetSeating: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const result = await ctx.prisma.guest.updateMany({
        where: { invitationId: input.invitationId, tableId: { not: null } },
        data: { tableId: null },
      });

      return { unseated: result.count };
    }),

  /**
   * Fills tables automatically, keeping each guest group together where it
   * fits. Only unseated guests are placed, so an existing plan is preserved.
   */
  autoArrange: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await authorize(ctx, input.invitationId);

      const [tables, guests] = await Promise.all([
        ctx.prisma.seatingTable.findMany({
          where: { invitationId: input.invitationId },
          orderBy: { createdAt: 'asc' },
          select: { id: true, capacity: true },
        }),
        ctx.prisma.guest.findMany({
          where: { invitationId: input.invitationId, tableId: null },
          select: { id: true, groupName: true, rsvpGuestCount: true },
        }),
      ]);

      // Asking to arrange before creating any table is an ordinary thing to do,
      // not a failure — answer with guidance instead of a 400 the client has to
      // catch and the browser logs as an error.
      if (tables.length === 0) {
        return { seated: 0, unseated: guests.length, noTables: true };
      }

      const seatedAlready = await ctx.prisma.guest.groupBy({
        by: ['tableId'],
        where: { invitationId: input.invitationId, tableId: { not: null } },
        _sum: { rsvpGuestCount: true },
      });

      const seatsUsedByTable: Record<string, number> = {};
      for (const row of seatedAlready) {
        if (row.tableId) {
          seatsUsedByTable[row.tableId] = row._sum.rsvpGuestCount ?? 0;
        }
      }

      const { assignments } = computeAutoArrangement(
        tables,
        guests,
        seatsUsedByTable
      );

      await ctx.prisma.$transaction(
        assignments.map(({ guestId, tableId }) =>
          ctx.prisma.guest.update({
            where: { id: guestId },
            data: { tableId },
          })
        )
      );

      return {
        seated: assignments.length,
        unseated: guests.length - assignments.length,
        noTables: false,
      };
    }),
});
