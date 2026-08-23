import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { router, protectedProcedure } from '../trpc';
import { assertOwnsInvitation } from '../lib/authorize';
import { assertFeature } from '../lib/limits';
import {
  normalizeCustomDomain,
  isReservedDomain,
  requiredDnsRecord,
} from '@/lib/domain';
import {
  attachDomain,
  removeDomain,
  getDomainStatus,
  isDomainApiConfigured,
} from '../lib/vercel-domains';

/**
 * Custom domains.
 *
 * Two systems have to agree: our database decides which invitation a host
 * resolves to, and Vercel decides whether the host reaches us at all. They are
 * kept in step by only writing the database after Vercel has accepted the
 * domain, so we never advertise an address that cannot serve traffic.
 */

const domainInput = z.object({
  invitationId: z.string().min(1),
  domain: z.string().min(1).max(253),
});

export const domainRouter = router({
  /** Current domain and what still has to happen at the registrar. */
  status: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invitation = await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      if (!invitation.customDomain) {
        return {
          domain: null,
          verified: false,
          attached: false,
          pending: [] as string[],
          dnsRecord: null,
          apiConfigured: isDomainApiConfigured(),
        };
      }

      const status = await getDomainStatus(invitation.customDomain);

      // Cache the moment it first went live, so the UI can stop polling.
      if (status.verified && !invitation.customDomainVerifiedAt) {
        await ctx.prisma.invitation
          .update({
            where: { id: invitation.id },
            data: { customDomainVerifiedAt: new Date() },
          })
          .catch(() => undefined);
      }

      return {
        domain: invitation.customDomain,
        verified: status.verified,
        attached: status.attached,
        pending: status.pending,
        dnsRecord: requiredDnsRecord(invitation.customDomain),
        apiConfigured: isDomainApiConfigured(),
      };
    }),

  set: protectedProcedure.input(domainInput).mutation(async ({ ctx, input }) => {
    await assertOwnsInvitation(ctx.prisma, input.invitationId, ctx.session.user.id);
    await assertFeature(ctx.prisma, ctx.session.user.id, 'hasCustomDomain');

    const domain = normalizeCustomDomain(input.domain);
    if (!domain) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Format domain tidak valid. Contoh: undangan-kami.com',
      });
    }

    if (isReservedDomain(domain)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Domain ini milik platform dan tidak bisa dipakai.',
      });
    }

    // Vercel first: if it refuses, nothing has been written and the customer
    // sees the real reason rather than a domain that never serves anything.
    const attached = await attachDomain(domain);
    if (!attached.ok) {
      throw new TRPCError({
        code: attached.reason === 'not-configured' ? 'PRECONDITION_FAILED' : 'BAD_REQUEST',
        message: attached.message,
      });
    }

    try {
      await ctx.prisma.invitation.update({
        where: { id: input.invitationId },
        data: { customDomain: domain, customDomainVerifiedAt: null },
      });
    } catch (error) {
      // The unique index is the real arbiter of who owns a domain.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Domain ini sudah dipakai undangan lain.',
        });
      }
      throw error;
    }

    return { domain, dnsRecord: requiredDnsRecord(domain) };
  }),

  /** Re-checks DNS on demand, so the customer is not left waiting on a poll. */
  verify: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      if (!invitation.customDomain) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Belum ada domain yang dihubungkan.',
        });
      }

      const status = await getDomainStatus(invitation.customDomain);

      await ctx.prisma.invitation
        .update({
          where: { id: invitation.id },
          data: {
            customDomainVerifiedAt: status.verified
              ? (invitation.customDomainVerifiedAt ?? new Date())
              : null,
          },
        })
        .catch(() => undefined);

      return {
        verified: status.verified,
        pending: status.pending,
        dnsRecord: requiredDnsRecord(invitation.customDomain),
      };
    }),

  remove: protectedProcedure
    .input(z.object({ invitationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await assertOwnsInvitation(
        ctx.prisma,
        input.invitationId,
        ctx.session.user.id
      );

      if (!invitation.customDomain) return { removed: false };

      // Database first here: releasing our claim matters more than tidying up
      // Vercel, and a leftover attachment is harmless.
      await ctx.prisma.invitation.update({
        where: { id: invitation.id },
        data: { customDomain: null, customDomainVerifiedAt: null },
      });

      await removeDomain(invitation.customDomain);

      return { removed: true };
    }),
});
