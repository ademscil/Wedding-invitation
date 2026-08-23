import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { sendEmail, rsvpNotificationEmail } from '@/lib/email';
import { assertOwnsGuest, assertOwnsInvitation } from '../lib/authorize';
import { assertCanAddGuests } from '../lib/limits';
import { assertRateLimit } from '../lib/rate-limit';

export const guestRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        status: z.string().optional(),
        group: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      return ctx.prisma.guest.findMany({
        where: {
          invitationId: input.invitationId,
          ...(input.status && { rsvpStatus: input.status }),
          ...(input.group && { groupName: input.group }),
        },
        orderBy: { createdAt: 'desc' },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        name: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        groupName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      await assertCanAddGuests(
        ctx.prisma,
        ctx.session.user.id,
        input.invitationId,
        1
      );

      const personalLink = nanoid(10);

      return ctx.prisma.guest.create({
        data: {
          ...input,
          personalLink,
        },
      });
    }),

  createMany: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
        guests: z
          .array(
            z.object({
              name: z.string().min(1),
              phone: z.string().optional(),
              email: z.string().optional(),
              groupName: z.string().optional(),
            })
          )
          .min(1, 'Minimal satu tamu')
          .max(1000, 'Maksimal 1000 tamu per impor'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      await assertCanAddGuests(
        ctx.prisma,
        ctx.session.user.id,
        input.invitationId,
        input.guests.length
      );

      const guestsData = input.guests.map((guest) => ({
        ...guest,
        invitationId: input.invitationId,
        personalLink: nanoid(10),
      }));

      return ctx.prisma.guest.createMany({ data: guestsData });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        groupName: z.string().optional(),
        rsvpStatus: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await assertOwnsGuest(ctx.prisma, id, ctx.session.user.id);
      return ctx.prisma.guest.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnsGuest(ctx.prisma, input.id, ctx.session.user.id);
      return ctx.prisma.guest.delete({ where: { id: input.id } });
    }),

  submitRsvp: publicProcedure
    .input(
      z.object({
        // Anyone with the invitation link can post here, so every field is
        // bounded: without a cap a single request can store megabytes.
        invitationSlug: z.string().max(120),
        personalLink: z.string().max(64).optional(),
        name: z.string().min(1).max(100),
        status: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
        guestCount: z.number().int().min(1).max(10).default(1),
        session: z.string().max(60).optional(),
        dietaryNotes: z.string().max(300).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Public endpoint that can create guest rows — cap it per IP.
      assertRateLimit(
        `rsvp:${ctx.ip}`,
        { limit: 10, windowMs: 60_000 },
        'Terlalu banyak pengiriman RSVP.'
      );

      const invitation = await ctx.prisma.invitation.findUnique({
        where: { slug: input.invitationSlug },
        include: { user: { select: { email: true } } },
      });

      if (!invitation || invitation.status !== 'PUBLISHED') {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      let guestRecord;
      if (input.personalLink) {
        const guest = await ctx.prisma.guest.findUnique({
          where: { personalLink: input.personalLink },
        });

        if (guest && guest.invitationId === invitation.id) {
          guestRecord = await ctx.prisma.guest.update({
            where: { id: guest.id },
            data: {
              rsvpStatus: input.status,
              rsvpGuestCount: input.guestCount,
              rsvpSession: input.session,
              dietaryNotes: input.dietaryNotes,
            },
          });
        }
      }

      if (!guestRecord) {
        // Walk-in RSVPs count against the owner's plan quota, otherwise this
        // public endpoint would be an unbounded way to create guest rows.
        await assertCanAddGuests(
          ctx.prisma,
          invitation.userId,
          invitation.id,
          1
        );

        guestRecord = await ctx.prisma.guest.create({
          data: {
            invitationId: invitation.id,
            name: input.name,
            personalLink: nanoid(10),
            rsvpStatus: input.status,
            rsvpGuestCount: input.guestCount,
            rsvpSession: input.session,
            dietaryNotes: input.dietaryNotes,
            groupName: 'Walk-in',
          },
        });
      }

      if (invitation.user.email) {
        sendEmail({
          to: invitation.user.email,
          subject: `RSVP Baru dari ${input.name}`,
          html: rsvpNotificationEmail({
            brideName: invitation.brideName,
            groomName: invitation.groomName,
            guestName: input.name,
            status: input.status,
            guestCount: input.guestCount,
          }),
        }).catch(() => undefined);
      }

      return guestRecord;
    }),

  getStats: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .query(async ({ ctx, input }) => {
      await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      const [total, attending, notAttending, maybe, pending] =
        await Promise.all([
          ctx.prisma.guest.count({
            where: { invitationId: input.invitationId },
          }),
          ctx.prisma.guest.count({
            where: {
              invitationId: input.invitationId,
              rsvpStatus: 'ATTENDING',
            },
          }),
          ctx.prisma.guest.count({
            where: {
              invitationId: input.invitationId,
              rsvpStatus: 'NOT_ATTENDING',
            },
          }),
          ctx.prisma.guest.count({
            where: {
              invitationId: input.invitationId,
              rsvpStatus: 'MAYBE',
            },
          }),
          ctx.prisma.guest.count({
            where: {
              invitationId: input.invitationId,
              rsvpStatus: 'PENDING',
            },
          }),
        ]);

      const [totalAttendingGuests, opened, checkedIn] = await Promise.all([
        ctx.prisma.guest.aggregate({
          where: {
            invitationId: input.invitationId,
            rsvpStatus: 'ATTENDING',
          },
          _sum: { rsvpGuestCount: true },
        }),
        ctx.prisma.guest.count({
          where: {
            invitationId: input.invitationId,
            linkOpenedAt: { not: null },
          },
        }),
        ctx.prisma.guest.count({
          where: {
            invitationId: input.invitationId,
            checkedIn: true,
          },
        }),
      ]);

      return {
        total,
        attending,
        notAttending,
        maybe,
        pending,
        totalGuestCount: totalAttendingGuests._sum.rsvpGuestCount || 0,
        opened,
        checkedIn,
      };
    }),
});
