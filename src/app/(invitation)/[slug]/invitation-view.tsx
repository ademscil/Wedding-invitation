import React from 'react';
import crypto from 'crypto';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { InvitationRenderer } from '@/components/invitation/invitation-renderer';
import { formatDate } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants';
import { parseSettings } from '@/lib/invitation-data';
import { coupleNames } from '@/lib/invitation-data';

export type InvitationLookup = { slug: string };

/** Salted hash for visitor IP to comply with data privacy regulations (UU PDP / GDPR). */
export function anonymizeIp(ip?: string | null): string | null {
  if (!ip || ip === 'unknown') return null;
  const secret = process.env.NEXTAUTH_SECRET || 'wedinvite-salt';
  return crypto.createHash('sha256').update(`${ip}:${secret}`).digest('hex').slice(0, 16);
}

// React.cache is provided by React in RSC environments. In test runners (Vitest/jsdom), fall back cleanly.
const memoize =
  typeof React.cache === 'function'
    ? React.cache
    : <T extends (arg: string) => Promise<unknown>>(fn: T): T => fn;

/**
 * Request-memoized loader by primitive slug so generateMetadata and InvitationView
 * never fire duplicate queries to PostgreSQL for the same page view.
 */
const getInvitationBySlug = memoize(async (slug: string) => {
  return prisma.invitation.findUnique({
    where: { slug },
    include: {
      template: true,
      user: { select: { subscriptionTier: true } },
      wishes: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
});

export async function getInvitationBy(lookup: InvitationLookup) {
  return getInvitationBySlug(lookup.slug);
}

/** Kept for callers that only ever resolve by slug. */
export async function getInvitation(slug: string) {
  return getInvitationBy({ slug });
}

type PublicInvitation = NonNullable<Awaited<ReturnType<typeof getInvitationBy>>>;

/** Published and still inside the active window sold by the plan. */
export function isLive(
  invitation: PublicInvitation | null
): invitation is PublicInvitation {
  if (!invitation || invitation.status !== 'PUBLISHED') return false;
  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
    return false;
  }
  return true;
}

function hasWatermark(tier: string): boolean {
  const config =
    SUBSCRIPTION_TIERS[tier as SubscriptionTier] ?? SUBSCRIPTION_TIERS.FREE;
  return config.hasWatermark;
}

/**
 * Resolves a guest from their personal link and stamps the first open.
 * Returns null when the link does not belong to this invitation.
 */
async function resolveGuest(invitationId: string, personalLink: string) {
  const guest = await prisma.guest.findUnique({ where: { personalLink } });

  if (!guest || guest.invitationId !== invitationId) return null;

  if (!guest.linkOpenedAt) {
    await prisma.guest
      .update({
        where: { id: guest.id },
        data: { linkOpenedAt: new Date() },
      })
      .catch(() => undefined);
  }

  return guest;
}

export async function buildInvitationMetadata(
  lookup: InvitationLookup
): Promise<Metadata> {
  const invitation = await getInvitationBy(lookup);
  const session = await getServerSession(authOptions).catch(() => null);
  const isOwner = Boolean(session?.user?.id && invitation?.userId === session.user.id);

  if (!invitation || (!isLive(invitation) && !isOwner)) {
    return { title: 'Undangan Tidak Ditemukan', robots: { index: false, follow: false } };
  }

  const couple = coupleNames(invitation);
  const title = `Undangan Pernikahan ${couple}`;
  const description = invitation.weddingDate
    ? `${formatDate(invitation.weddingDate)} — Anda diundang untuk merayakan hari bahagia kami`
    : 'Anda diundang untuk merayakan hari bahagia kami';

  // The first gallery photo doubles as the social share image when present.
  let image: string | undefined;
  try {
    const gallery = JSON.parse(invitation.galleryImages || '[]');
    const first = Array.isArray(gallery) ? gallery[0] : null;
    image = typeof first === 'string' ? first : first?.url;
  } catch {
    image = undefined;
  }
  image = image || invitation.bridePhoto || invitation.groomPhoto || undefined;

  const canonicalUrl = `/${invitation.slug}`;

  return {
    title,
    description,
    ...(parseSettings(invitation.settings).showInSearch === false && {
      robots: { index: false, follow: false },
    }),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      siteName: 'WedInvite',
      url: canonicalUrl,
      ...(image && { images: [{ url: image, alt: couple }] }),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

interface InvitationViewProps {
  lookup: InvitationLookup;
  personalLink?: string;
}

export async function InvitationView({ lookup, personalLink }: InvitationViewProps) {
  const invitation = await getInvitationBy(lookup);
  const session = await getServerSession(authOptions).catch(() => null);
  const isOwner = Boolean(session?.user?.id && invitation?.userId === session.user.id);

  if (!invitation) notFound();
  if (!isLive(invitation) && !isOwner) notFound();

  const guest = personalLink ? await resolveGuest(invitation.id, personalLink) : null;
  const isDraftPreview = isOwner && invitation.status !== 'PUBLISHED';

  // Record the visit asynchronously without blocking page render TTFB
  const requestHeaders = headers();
  const rawIp =
    requestHeaders.get('x-forwarded-for')?.split(',')[0].trim() ??
    requestHeaders.get('x-real-ip');

  prisma.analyticsEvent
    .create({
      data: {
        invitationId: invitation.id,
        eventType: 'PAGE_VIEW',
        userAgent: requestHeaders.get('user-agent'),
        referrer: requestHeaders.get('referer'),
        visitorIp: anonymizeIp(rawIp),
        metadata: guest ? JSON.stringify({ guestId: guest.id }) : null,
      },
    })
    .catch(() => undefined);

  return (
    <InvitationRenderer
      invitation={invitation}
      guestName={guest?.name}
      personalLink={guest?.personalLink}
      existingRsvp={
        guest && guest.rsvpStatus !== 'PENDING'
          ? {
              status: guest.rsvpStatus,
              guestCount: guest.rsvpGuestCount,
              dietaryNotes: guest.dietaryNotes,
            }
          : undefined
      }
      isDraftPreview={isDraftPreview}
      showWatermark={hasWatermark(invitation.user.subscriptionTier)}
    />
  );
}
