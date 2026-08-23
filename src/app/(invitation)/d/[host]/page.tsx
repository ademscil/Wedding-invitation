import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { InvitationView, buildInvitationMetadata } from '../../[slug]/invitation-view';
import { normalizeCustomDomain } from '@/lib/domain';

/**
 * Internal target for customer domains.
 *
 * Nobody navigates here: the middleware rewrites a request whose Host is a
 * customer's domain into `/d/<host>`, because the host cannot be turned into an
 * invitation on the edge runtime where Prisma is unavailable.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { host: string };
  searchParams: { to?: string };
}

/**
 * The host arrives from a header, so it is re-validated here rather than
 * trusted as a database lookup key.
 */
function resolveDomain(host: string): string {
  const domain = normalizeCustomDomain(decodeURIComponent(host));
  if (!domain) notFound();
  return domain;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildInvitationMetadata({ domain: resolveDomain(params.host) });
}

export default async function DomainInvitationPage({ params, searchParams }: PageProps) {
  return (
    <InvitationView
      lookup={{ domain: resolveDomain(params.host) }}
      personalLink={searchParams.to}
    />
  );
}
