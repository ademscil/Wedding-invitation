import type { Metadata } from 'next';
import { InvitationView, buildInvitationMetadata } from './invitation-view';

/**
 * Always rendered per request: the page reads `searchParams.to` and looks the
 * invitation up in the database, so it can never be statically generated.
 *
 * Declaring this also keeps Next's static-paths worker from loading the route
 * in a separate process during dev, which fails to resolve its vendor chunks.
 */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
  searchParams: { to?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildInvitationMetadata(params.slug);
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  // `?to=` is the legacy personal-link form, kept working alongside
  // the /to/[guestSlug] path so links already sent to guests do not break.
  return <InvitationView slug={params.slug} personalLink={searchParams.to} />;
}
