import path from 'node:path';
import dotenv from 'dotenv';
import { test, expect, request as playwrightRequest } from '@playwright/test';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * Custom domain routing.
 *
 * The Host header decides which invitation answers, so these assertions are
 * made at the HTTP level: a browser will not let a page forge its own Host.
 */

const SLUG = 'audit-demo';
const DOMAIN = 'rina-budi.test';

async function setDomain(domain: string | null) {
  const { prisma } = await import('../src/lib/db');
  await prisma.invitation.update({
    where: { slug: SLUG },
    data: { customDomain: domain, customDomainVerifiedAt: null },
  });
}

/** A context that sends an arbitrary Host, the way Vercel would after DNS. */
async function contextForHost(host: string, baseURL: string) {
  return playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Host: host },
  });
}

test.beforeAll(() => setDomain(DOMAIN));
test.afterAll(() => setDomain(null));

test('a request on the custom domain serves that invitation at the root', async ({
  baseURL,
}) => {
  const ctx = await contextForHost(DOMAIN, baseURL!);
  const response = await ctx.get('/');

  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('Buka Undangan');
  // The canonical URL must follow the domain guests were actually given.
  expect(body).toContain(`https://${DOMAIN}/`);

  await ctx.dispose();
});

test('the personalised guest link works on the custom domain', async ({ baseURL }) => {
  const { prisma } = await import('../src/lib/db');
  const invitation = await prisma.invitation.findUnique({
    where: { slug: SLUG },
    select: { id: true },
  });
  const guest = await prisma.guest.findFirst({
    where: { invitationId: invitation!.id },
    select: { personalLink: true },
  });
  test.skip(!guest, 'no seeded guest to address');

  const ctx = await contextForHost(DOMAIN, baseURL!);
  const response = await ctx.get(`/to/${guest!.personalLink}`);

  expect(response.status()).toBe(200);
  // Personal links must never be indexed.
  expect(await response.text()).toContain('noindex');

  await ctx.dispose();
});

test('a domain nobody has claimed is not served', async ({ baseURL }) => {
  const ctx = await contextForHost('nobody-owns-this.test', baseURL!);
  const response = await ctx.get('/');

  expect(response.status()).toBe(404);

  await ctx.dispose();
});

test('a released domain stops serving the invitation', async ({ baseURL }) => {
  await setDomain(null);

  const ctx = await contextForHost(DOMAIN, baseURL!);
  expect((await ctx.get('/')).status()).toBe(404);
  await ctx.dispose();

  await setDomain(DOMAIN);
});

test('platform pages redirect off the custom domain instead of looping', async ({
  baseURL,
}) => {
  const ctx = await contextForHost(DOMAIN, baseURL!);
  const response = await ctx.get('/dashboard', { maxRedirects: 0 });

  expect(response.status()).toBe(307);

  const location = response.headers()['location'];
  // Must be absolute and off this host; a relative value would resolve back to
  // the custom domain and redirect forever.
  expect(location).toMatch(/^https?:\/\//);
  expect(location).not.toContain(DOMAIN);
  expect(location).toContain('/dashboard');

  await ctx.dispose();
});

test('the internal rewrite target is not reachable directly', async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext({ baseURL });

  // Reachable on the platform host, this would serve a second copy of the
  // invitation at an address nobody was given.
  expect((await ctx.get(`/d/${DOMAIN}`)).status()).toBe(404);
  expect((await ctx.get(`/d/${DOMAIN}/to/auditguest`)).status()).toBe(404);

  await ctx.dispose();
});

test('the platform host is unaffected', async ({ baseURL }) => {
  const ctx = await playwrightRequest.newContext({ baseURL });

  expect((await ctx.get(`/${SLUG}`)).status()).toBe(200);

  // The dashboard still bounces anonymous visitors to sign in.
  const dashboard = await ctx.get('/dashboard', { maxRedirects: 0 });
  expect(dashboard.status()).toBe(307);
  expect(dashboard.headers()['location']).toContain('signin');

  await ctx.dispose();
});
