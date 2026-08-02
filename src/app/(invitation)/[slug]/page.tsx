import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { InvitationRenderer } from '@/components/invitation/invitation-renderer';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: { slug: string };
  searchParams: { to?: string };
}

async function getInvitation(slug: string) {
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

  return invitation;
}

async function getGuestName(invitationId: string, personalLink: string) {
  const guest = await prisma.guest.findUnique({
    where: { personalLink },
  });

  if (guest && guest.invitationId === invitationId) {
    if (!guest.linkOpenedAt) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: { linkOpenedAt: new Date() },
      });
    }
    return guest.name;
  }

  return undefined;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const invitation = await getInvitation(params.slug);

  if (!invitation || invitation.status !== 'PUBLISHED') {
    return { title: 'Undangan Tidak Ditemukan' };
  }

  const title = `Undangan Pernikahan ${invitation.brideName} & ${invitation.groomName}`;
  const description = invitation.weddingDate
    ? `${formatDate(invitation.weddingDate)} - Anda diundang untuk merayakan hari bahagia kami`
    : 'Anda diundang untuk merayakan hari bahagia kami';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'WedInvite',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function InvitationPage({
  params,
  searchParams,
}: PageProps) {
  const invitation = await getInvitation(params.slug);

  if (!invitation || invitation.status !== 'PUBLISHED') {
    notFound();
  }

  let guestName: string | undefined;
  if (searchParams.to) {
    guestName = await getGuestName(invitation.id, searchParams.to);
  }

  // Track page view (fire and forget)
  prisma.analyticsEvent
    .create({
      data: {
        invitationId: invitation.id,
        eventType: 'PAGE_VIEW',
      },
    })
    .catch(() => {});

  return <InvitationRenderer invitation={invitation} guestName={guestName} />;
}
