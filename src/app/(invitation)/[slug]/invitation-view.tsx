import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { InvitationRenderer } from '@/components/invitation/invitation-renderer';
import { formatDate } from '@/lib/utils';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/constants';

/**
 * Shared loader and renderer for the two public entry points:
 * `/[slug]` and the personalised `/[slug]/to/[guestSlug]`.
 * Keeping one implementation means the watermark, expiry and analytics rules
 * cannot drift between them.
 */
export async function getInvitation(slug: string) {
  return prisma.invitation.findUnique({
    where: { slug },
    include: {
      template: true,
      // The owner's plan decides whether the watermark is rendered.
      user: { select: { subscriptionTier: true } },
      wishes: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });
}

type PublicInvitation = NonNullable<Awaited<ReturnType<typeof getInvitation>>>;

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

export async function buildInvitationMetadata(slug: string): Promise<Metadata> {
  const invitation = await getInvitation(slug);

  if (!isLive(invitation)) {
    return { title: 'Undangan Tidak Ditemukan', robots: { index: false, follow: false } };
  }

  const couple = `${invitation.brideName} & ${invitation.groomName}`;
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

  return {
    title,
    description,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'id_ID',
      siteName: 'WedInvite',
      url: `/${slug}`,
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
  slug: string;
  personalLink?: string;
}

export async function InvitationView({ slug, personalLink }: InvitationViewProps) {
  const invitation = await getInvitation(slug);

  if (!isLive(invitation)) notFound();

  const guest = personalLink ? await resolveGuest(invitation.id, personalLink) : null;

  // Record the visit with the request metadata the analytics dashboard reports on.
  const requestHeaders = headers();
  await prisma.analyticsEvent
    .create({
      data: {
        invitationId: invitation.id,
        eventType: 'PAGE_VIEW',
        userAgent: requestHeaders.get('user-agent'),
        referrer: requestHeaders.get('referer'),
        visitorIp:
          requestHeaders.get('x-forwarded-for')?.split(',')[0].trim() ??
          requestHeaders.get('x-real-ip'),
        metadata: guest ? JSON.stringify({ guestId: guest.id }) : null,
      },
    })
    .catch(() => undefined);

  return (
    <InvitationRenderer
      invitation={invitation}
      guestName={guest?.name}
      personalLink={guest?.personalLink}
      showWatermark={hasWatermark(invitation.user.subscriptionTier)}
    />
  );
}
