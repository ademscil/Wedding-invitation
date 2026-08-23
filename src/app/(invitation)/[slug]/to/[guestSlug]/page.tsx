import type { Metadata } from 'next';
import { InvitationView, buildInvitationMetadata } from '../../invitation-view';

interface PageProps {
  params: { slug: string; guestSlug: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const metadata = await buildInvitationMetadata(params.slug);

  // Personalised links are per-guest and must never be indexed.
  return { ...metadata, robots: { index: false, follow: false } };
}

export default async function PersonalInvitationPage({ params }: PageProps) {
  return <InvitationView slug={params.slug} personalLink={params.guestSlug} />;
}
