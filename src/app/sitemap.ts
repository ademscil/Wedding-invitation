import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { parseSettings } from '@/lib/invitation-data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://saas-wedding-two.vercel.app';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    // Payment gateways check that these are reachable, and so do customers.
    { url: `${baseUrl}/syarat-ketentuan`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/kebijakan-privasi`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  const publishedInvitations = await prisma.invitation.findMany({
    where: {
      status: 'PUBLISHED',
      /*
       * An invitation past its paid window returns 404. Listing it here was
       * handing Google a sitemap full of dead URLs, which costs the whole
       * domain crawl budget and trust.
       */
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { slug: true, updatedAt: true, settings: true },
  });

  const invitationPages: MetadataRoute.Sitemap = publishedInvitations
    // A couple who asked to stay out of search stays out of the sitemap too.
    .filter((inv) => parseSettings(inv.settings).showInSearch !== false)
    .map((inv) => ({
      url: `${baseUrl}/${inv.slug}`,
      lastModified: inv.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...invitationPages];
}
