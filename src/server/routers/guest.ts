import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { sendEmail, rsvpNotificationEmail } from '@/lib/email';

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
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

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
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

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
        guests: z.array(
          z.object({
            name: z.string().min(1),
            phone: z.string().optional(),
            email: z.string().optional(),
            groupName: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.invitationId },
      });

      if (!invitation || invitation.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

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
      return ctx.prisma.guest.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.guest.delete({ where: { id: input.id } });
    }),

  submitRsvp: publicProcedure
    .input(
      z.object({
        invitationSlug: z.string(),
        personalLink: z.string().optional(),
        name: z.string().min(1),
        status: z.enum(['ATTENDING', 'NOT_ATTENDING', 'MAYBE']),
        guestCount: z.number().min(1).max(10).default(1),
        session: z.string().optional(),
        dietaryNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
