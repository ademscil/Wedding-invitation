import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationView, buildInvitationMetadata } from '../../../../[slug]/invitation-view';
import { normalizeCustomDomain } from '@/lib/domain';

/** Personalised guest link served from the couple's own domain. */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { host: string; guestSlug: string };
}

function resolveDomain(host: string): string {
  const domain = normalizeCustomDomain(decodeURIComponent(host));
  if (!domain) notFound();
  return domain;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const metadata = await buildInvitationMetadata({ domain: resolveDomain(params.host) });

  // Personalised links are per-guest and must never be indexed.
  return { ...metadata, robots: { index: false, follow: false } };
}

export default async function DomainGuestPage({ params }: PageProps) {
  return (
    <InvitationView
      lookup={{ domain: resolveDomain(params.host) }}
      personalLink={params.guestSlug}
    />
  );
}
