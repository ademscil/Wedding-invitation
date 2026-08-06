import { TRPCError } from '@trpc/server';
import type { PrismaClient } from '@prisma/client';

/**
 * Asserts the given invitation exists and belongs to the user.
 *
 * Throws NOT_FOUND (rather than FORBIDDEN) so the response cannot be used to
 * probe which invitation ids exist.
 */
export async function assertOwnsInvitation(
  prisma: PrismaClient,
  invitationId: string,
  userId: string
) {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, userId },
  });

  if (!invitation) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return invitation;
}

/** Asserts the guest exists and sits under an invitation owned by the user. */
export async function assertOwnsGuest(
  prisma: PrismaClient,
  guestId: string,
  userId: string
) {
  const guest = await prisma.guest.findFirst({
    where: { id: guestId, invitation: { userId } },
  });

  if (!guest) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return guest;
}

/** Asserts the wish exists and sits under an invitation owned by the user. */
export async function assertOwnsWish(
  prisma: PrismaClient,
  wishId: string,
  userId: string
) {
  const wish = await prisma.wish.findFirst({
    where: { id: wishId, invitation: { userId } },
  });

  if (!wish) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  return wish;
}
