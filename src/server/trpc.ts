import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export interface CreateContextOptions {
  req?: Request;
}

export const createTRPCContext = async (opts: CreateContextOptions = {}) => {
  const session = await getServerSession(authOptions);
  return {
    session,
    prisma,
    req: opts.req,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Admin check reads the role from the database rather than the JWT, so a role
 * revoked after the token was issued takes effect immediately.
 */
const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  const user = await ctx.prisma.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

/**
 * Loads an invitation and verifies the caller owns it.
 * Throws NOT_FOUND for both "missing" and "not yours" so ownership is not probeable.
 */
export async function requireOwnedInvitation(
  ctx: { prisma: typeof prisma; session: { user: { id: string } } },
  invitationId: string
) {
  const invitation = await ctx.prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Undangan tidak ditemukan' });
  }

  return invitation;
}

/** Loads a guest and verifies the caller owns the invitation the guest belongs to. */
export async function requireOwnedGuest(
  ctx: { prisma: typeof prisma; session: { user: { id: string } } },
  guestId: string
) {
  const guest = await ctx.prisma.guest.findUnique({
    where: { id: guestId },
    include: { invitation: { select: { userId: true } } },
  });

  if (!guest || guest.invitation.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Tamu tidak ditemukan' });
  }

  return guest;
}

/** Loads a wish and verifies the caller owns the invitation it belongs to. */
export async function requireOwnedWish(
  ctx: { prisma: typeof prisma; session: { user: { id: string } } },
  wishId: string
) {
  const wish = await ctx.prisma.wish.findUnique({
    where: { id: wishId },
    include: { invitation: { select: { userId: true } } },
  });

  if (!wish || wish.invitation.userId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Ucapan tidak ditemukan' });
  }

  return wish;
}
