import { test, expect, seedAccount, removeAccount, login } from './fixtures';

/**
 * What every screen does when its data does not arrive.
 *
 * These pages previously showed a skeleton that never resolved, or — on the
 * invitation editor — told the owner their invitation did not exist when the
 * request had simply failed. Both leave someone stuck with no way forward.
 */

let seeded: Awaited<ReturnType<typeof seedAccount>>;

test.beforeAll(async () => {
  seeded = await seedAccount('BUSINESS');
});
test.afterAll(removeAccount);

/** Fails every tRPC read, leaving mutations and auth alone. */
async function breakQueries(page: import('@playwright/test').Page) {
  await page.route('**/api/trpc/**', (route) => {
    if (route.request().method() === 'GET') return route.abort('failed');
    return route.continue();
  });
}

const ROUTES = [
  ['/dashboard', 'dashboard'],
  ['/dashboard/invitations', 'invitation list'],
  ['/admin/users', 'admin users'],
  ['/admin/templates', 'admin templates'],
  ['/admin/wishes', 'admin wishes'],
  ['/admin/promos', 'admin promos'],
] as const;

test('a failed load offers a way forward, never a stuck skeleton', async ({
  page,
}) => {
  test.slow();

  const { prisma } = await import('../src/lib/db');
  await prisma.user.update({
    where: { id: seeded.userId },
    data: { role: 'ADMIN' },
  });

  await login(page);
  await breakQueries(page);

  const failures: string[] = [];

  for (const [route, label] of ROUTES) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });

    const retry = page.getByRole('button', { name: /coba lagi/i }).first();
    try {
      await expect(retry).toBeVisible({ timeout: 20_000 });
    } catch {
      failures.push(`${label} (${route}) showed no retry after a failed load`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('a failed editor load does not claim the invitation is missing', async ({
  page,
}) => {
  await login(page);
  await breakQueries(page);

  await page.goto(`/dashboard/invitations/${seeded.invitationId}`, {
    waitUntil: 'domcontentloaded',
  });

  // The old behaviour: telling someone whose connection dropped that their
  // wedding data was gone.
  await expect(page.getByText(/tidak ditemukan/i)).toHaveCount(0);
  await expect(page.getByText(/gagal memuat undangan/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /coba lagi/i })).toBeVisible();
});

test('retry recovers once the connection comes back', async ({ page }) => {
  await login(page);
  await breakQueries(page);

  await page.goto('/dashboard/invitations', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /coba lagi/i })).toBeVisible();

  // Let the requests through again; the button must actually recover the page.
  await page.unroute('**/api/trpc/**');
  await page.getByRole('button', { name: /coba lagi/i }).click();

  await expect(page.getByRole('button', { name: /coba lagi/i })).toHaveCount(0);
  await expect(page.getByText('Sinta')).toBeVisible();
});
