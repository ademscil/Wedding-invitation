import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { InvitationRenderer } from '@/components/invitation/invitation-renderer';
import { formatDate } from '@/lib/utils';
import { siteConfig } from '@/config/site';

/** Shared loader for both the public URL and the personalised guest URL. */
export async function getPublishedInvitation(slug: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { slug },
    include: {
      template: true,
      wishes: {
        where: { isApproved: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!invitation || invitation.status !== 'PUBLISHED') return null;
  return invitation;
}

/**
 * Resolves a guest from their personal link and stamps the first open.
 * Returns null when the link does not belong to this invitation.
 */
export async function resolveGuest(invitationId: string, personalLink: string) {
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
  const invitation = await getPublishedInvitation(slug);

  if (!invitation) {
    return {
      title: 'Undangan Tidak Ditemukan',
      robots: { index: false, follow: false },
    };
  }

  const couple = `${invitation.brideName} & ${invitation.groomName}`;
  const title = `Undangan Pernikahan ${couple}`;
  const description = invitation.weddingDate
    ? `${formatDate(invitation.weddingDate)} — Dengan hormat kami mengundang Anda untuk hadir di hari bahagia kami.`
    : 'Dengan hormat kami mengundang Anda untuk hadir di hari bahagia kami.';

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
      siteName: siteConfig.name,
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
  const invitation = await getPublishedInvitation(slug);

  if (!invitation) notFound();

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
    />
  );
}
