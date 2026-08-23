import { initTRPC, TRPCError } from '@trpc/server';
import { getServerSession } from 'next-auth';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Resolves the caller's IP for rate limiting.
 *
 * Only proxy headers are available in the fetch adapter. These are spoofable
 * unless the platform overwrites them (Vercel and most CDNs do), so treat the
 * result as best-effort and never as an identity.
 */
function getClientIp(headers?: Headers): string {
  if (!headers) return 'unknown';

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Left-most entry is the original client.
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return headers.get('x-real-ip') ?? 'unknown';
}

export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  const session = await getServerSession(authOptions);
  return {
    session,
    prisma,
    ip: getClientIp(opts?.headers),
  };
};

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
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user || ctx.session.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
