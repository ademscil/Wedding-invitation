import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import {
  router,
  publicProcedure,
  protectedProcedure,
  requireOwnedInvitation,
  requireOwnedGuest,
} from '../trpc';
import { assertFeature, assertQuota, getUserTier } from '@/lib/subscription';

const RSVP_STATUSES = ['PENDING', 'ATTENDING', 'NOT_ATTENDING', 'MAYBE'] as const;

const guestInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama tamu wajib diisi').max(100),
  phone: z.string().trim().max(25).optional(),
  email: z.string().trim().email('Email tidak valid').max(120).optional().or(z.literal('')),
  groupName: z.string().trim().max(50).optional(),
});

/** Generates a personal link that is not already taken. */
async function uniquePersonalLink(
  prisma: { guest: { findUnique: (a: { where: { personalLink: string }; select: { id: true } }) => Promise<unknown> } }
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const candidate = nanoid(10);
    const taken = await prisma.guest.findUnique({
      where: { personalLink: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal membuat link tamu' });
}

export const guestRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        status: z.enum(RSVP_STATUSES).optional(),
        group: z.string().optional(),
        search: z.string().trim().max(100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      return ctx.prisma.guest.findMany({
        where: {
          invitationId: input.invitationId,
          ...(input.status && { rsvpStatus: input.status }),
          ...(input.group && { groupName: input.group }),
          ...(input.search && { name: { contains: input.search } }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  create: protectedProcedure
    .input(guestInputSchema.extend({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);
      const currentCount = await ctx.prisma.guest.count({
        where: { invitationId: input.invitationId },
      });
      assertQuota(tier, 'maxGuests', currentCount);

      const { invitationId, ...guest } = input;

      return ctx.prisma.guest.create({
        data: {
          ...guest,
          email: guest.email || null,
          invitationId,
          personalLink: await uniquePersonalLink(ctx.prisma),
        },
      });
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        guests: z.array(guestInputSchema).min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);
      const currentCount = await ctx.prisma.guest.count({
        where: { invitationId: input.invitationId },
      });
      assertQuota(tier, 'maxGuests', currentCount, input.guests.length);

      // Pre-generate links in one pass and verify none collide with existing rows.
      const links = new Set<string>();
      while (links.size < input.guests.length) {
        links.add(nanoid(10));
      }
      const linkList = [...links];

      const collisions = await ctx.prisma.guest.findMany({
        where: { personalLink: { in: linkList } },
        select: { personalLink: true },
      });
      const taken = new Set(collisions.map((c) => c.personalLink));

      const guestsData = input.guests.map((guest, i) => ({
        ...guest,
        email: guest.email || null,
        invitationId: input.invitationId,
        personalLink: taken.has(linkList[i]) ? nanoid(12) : linkList[i],
      }));

      return ctx.prisma.guest.createMany({ data: guestsData });
    }),

  update: protectedProcedure
    .input(
      guestInputSchema.partial().extend({
        id: z.string(),
        rsvpStatus: z.enum(RSVP_STATUSES).optional(),
        rsvpGuestCount: z.number().int().min(1).max(20).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await requireOwnedGuest(ctx, id);

      return ctx.prisma.guest.update({
        where: { id },
        data: { ...data, ...(data.email !== undefined && { email: data.email || null }) },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedGuest(ctx, input.id);
      return ctx.prisma.guest.delete({ where: { id: input.id } });
    }),

  deleteMany: protectedProcedure
    .input(z.object({ invitationId: z.string(), ids: z.array(z.string()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      // Scoping the delete to the owned invitation prevents deleting other people's guests
      // even if an unrelated id is smuggled into the list.
      return ctx.prisma.guest.deleteMany({
        where: { id: { in: input.ids }, invitationId: input.invitationId },
      });
    }),

  /** Marks guests as having been sent their invitation (used by the broadcast flow). */
  markMessageSent: protectedProcedure
    .input(z.object({ invitationId: z.string(), ids: z.array(z.string()).min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);
      const tier = await getUserTier(ctx.prisma, ctx.session.user.id);
      assertFeature(tier, 'hasBroadcast');

      return ctx.prisma.guest.updateMany({
        where: { id: { in: input.ids }, invitationId: input.invitationId },
        data: { messageSent: true },
      });
    }),

  /** Public: looks up a guest by personal link so the invitation can greet them. */
  getByPersonalLink: publicProcedure
    .input(z.object({ invitationSlug: z.string(), personalLink: z.string() }))
    .query(async ({ ctx, input }) => {
      const guest = await ctx.prisma.guest.findUnique({
        where: { personalLink: input.personalLink },
        include: { invitation: { select: { slug: true, status: true } } },
      });

      if (
        !guest ||
        guest.invitation.slug !== input.invitationSlug ||
        guest.invitation.status !== 'PUBLISHED'
      ) {
        return null;
      }

      return {
        name: guest.name,
        rsvpStatus: guest.rsvpStatus,
        rsvpGuestCount: guest.rsvpGuestCount,
      };
    }),

  submitRsvp: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        personalLink: z.string().optional(),
        name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
        status: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
        guestCount: z.number().int().min(1).max(20).default(1),
        session: z.string().max(60).optional(),
        dietaryNotes: z.string().max(500).optional(),
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

      // Guests who are not attending should not reserve seats.
      const guestCount = input.status === 'ATTENDING' ? input.guestCount : 1;

      const record = await (async () => {
        if (input.personalLink) {
          const guest = await ctx.prisma.guest.findUnique({
            where: { personalLink: input.personalLink },
          });

          if (guest && guest.invitationId === invitation.id) {
            return ctx.prisma.guest.update({
              where: { id: guest.id },
              data: {
                rsvpStatus: input.status,
                rsvpGuestCount: guestCount,
                rsvpSession: input.session,
                dietaryNotes: input.dietaryNotes,
              },
            });
          }
        }

        return ctx.prisma.guest.create({
          data: {
            invitationId: invitation.id,
            name: input.name,
            personalLink: await uniquePersonalLink(ctx.prisma),
            rsvpStatus: input.status,
            rsvpGuestCount: guestCount,
            rsvpSession: input.session,
            dietaryNotes: input.dietaryNotes,
            groupName: 'Walk-in',
          },
        });
      })();

      // Record the RSVP so the analytics dashboard reflects it.
      await ctx.prisma.analyticsEvent
        .create({
          data: {
            invitationId: invitation.id,
            eventType: 'RSVP_SUBMIT',
            metadata: JSON.stringify({ status: input.status, guestCount }),
          },
        })
        .catch(() => undefined);

      return { success: true, id: record.id };
    }),

  getStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireOwnedInvitation(ctx, input.invitationId);

      const where = { invitationId: input.invitationId };

      const [total, attending, notAttending, maybe, pending, sums, opened, checkedIn] =
        await Promise.all([
          ctx.prisma.guest.count({ where }),
          ctx.prisma.guest.count({ where: { ...where, rsvpStatus: 'ATTENDING' } }),
          ctx.prisma.guest.count({ where: { ...where, rsvpStatus: 'NOT_ATTENDING' } }),
          ctx.prisma.guest.count({ where: { ...where, rsvpStatus: 'MAYBE' } }),
          ctx.prisma.guest.count({ where: { ...where, rsvpStatus: 'PENDING' } }),
          ctx.prisma.guest.aggregate({
            where: { ...where, rsvpStatus: 'ATTENDING' },
            _sum: { rsvpGuestCount: true },
          }),
          ctx.prisma.guest.count({ where: { ...where, linkOpenedAt: { not: null } } }),
          ctx.prisma.guest.count({ where: { ...where, checkedIn: true } }),
        ]);

      return {
        total,
        attending,
        notAttending,
        maybe,
        pending,
        totalGuestCount: sums._sum.rsvpGuestCount || 0,
        opened,
        checkedIn,
      };
    }),
});
