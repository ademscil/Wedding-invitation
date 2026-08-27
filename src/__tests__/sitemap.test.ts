// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
process.env.NEXT_PUBLIC_APP_URL ||= 'https://wedinvite.example';

/**
 * The sitemap is what Google is told to crawl. Listing a URL that answers 404
 * spends crawl budget and costs the whole domain trust, so what it leaves out
 * matters as much as what it includes.
 */

const hasDatabase = Boolean(process.env.DATABASE_URL);
const EMAIL = 'zz-sitemap@example.invalid';

async function db() {
  const { prisma } = await import('@/lib/db');
  return prisma;
}

async function cleanup() {
  const prisma = await db();
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

async function urls(): Promise<string[]> {
  const sitemap = (await import('@/app/sitemap')).default;
  return (await sitemap()).map((entry) => entry.url);
}

describe.skipIf(!hasDatabase)('sitemap', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('lists live invitations and omits ones that would answer 404', async () => {
    const prisma = await db();
    const user = await prisma.user.create({
      data: { email: EMAIL, name: 'ZZ Sitemap' },
    });

    const base = { userId: user.id, brideName: 'A', groomName: 'B' };

    await prisma.invitation.createMany({
      data: [
        { ...base, slug: 'zz-sm-live', status: 'PUBLISHED' },
        {
          ...base,
          slug: 'zz-sm-future',
          status: 'PUBLISHED',
          expiresAt: new Date(Date.now() + 86_400_000),
        },
        {
          ...base,
          slug: 'zz-sm-expired',
          status: 'PUBLISHED',
          expiresAt: new Date(Date.now() - 1000),
        },
        { ...base, slug: 'zz-sm-draft', status: 'DRAFT' },
      ],
    });

    const listed = await urls();

    expect(listed.some((url) => url.endsWith('/zz-sm-live'))).toBe(true);
    expect(listed.some((url) => url.endsWith('/zz-sm-future'))).toBe(true);
    // Both of these return 404 to a crawler.
    expect(listed.some((url) => url.includes('zz-sm-expired'))).toBe(false);
    expect(listed.some((url) => url.includes('zz-sm-draft'))).toBe(false);
  });

  it('leaves out a couple who opted out of search', async () => {
    const prisma = await db();
    const user = await prisma.user.create({
      data: { email: EMAIL, name: 'ZZ Sitemap' },
    });

    await prisma.invitation.create({
      data: {
        userId: user.id,
        slug: 'zz-sm-private',
        status: 'PUBLISHED',
        settings: JSON.stringify({ showInSearch: false }),
        brideName: 'A',
        groomName: 'B',
      },
    });

    expect((await urls()).some((url) => url.includes('zz-sm-private'))).toBe(false);
  });

  it('always includes the legal pages a payment gateway checks for', async () => {
    const listed = await urls();
    expect(listed.some((url) => url.endsWith('/syarat-ketentuan'))).toBe(true);
    expect(listed.some((url) => url.endsWith('/kebijakan-privasi'))).toBe(true);
  });
});
