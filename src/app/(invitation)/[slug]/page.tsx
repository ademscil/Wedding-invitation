import type { Metadata } from 'next';
import { InvitationView, buildInvitationMetadata } from './invitation-view';

interface PageProps {
  params: { slug: string };
  searchParams: { to?: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return buildInvitationMetadata(params.slug);
}

export default async function InvitationPage({ params, searchParams }: PageProps) {
  // `?to=` is the legacy personal-link form and stays supported alongside /to/[guestSlug].
  return <InvitationView slug={params.slug} personalLink={searchParams.to} />;
}
