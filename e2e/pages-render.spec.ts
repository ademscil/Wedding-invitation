import { test, expect, seedAccount, removeAccount, login } from './fixtures';

/**
 * Every authenticated page, loaded for real.
 *
 * This exists because the whole admin group was returning 500 for months: its
 * layout was missing the tRPC provider, so every page that ran a query threw.
 * It went unnoticed because /admin itself is the one admin page with no query.
 * A sweep that simply opens each route catches that class of breakage.
 */

let seeded: Awaited<ReturnType<typeof seedAccount>>;

test.beforeAll(async () => {
  seeded = await seedAccount('BUSINESS');
});
test.afterAll(removeAccount);

test('every dashboard page renders without console errors', async ({
  page,
  console: watcher,
}) => {
  // Ten routes in one test, each compiled on demand by the dev server.
  test.slow();
  await login(page);

  const base = `/dashboard/invitations/${seeded.invitationId}`;
  const routes = [
    '/dashboard',
    '/dashboard/invitations',
    '/dashboard/invitations/new',
    '/dashboard/profile',
    '/dashboard/upgrade',
    base,
    `${base}/guests`,
    `${base}/planner`,
    `${base}/analytics`,
    `${base}/checkin`,
  ];

  const failures: string[] = [];

  for (const route of routes) {
    const before = watcher.errors.length;
    const response = await page.goto(route, { waitUntil: 'networkidle' });

    if ((response?.status() ?? 0) >= 400) {
      failures.push(`${route} -> HTTP ${response?.status()}`);
      continue;
    }

    // A page that rendered its error boundary is a failure even at HTTP 200.
    const body = await page.locator('body').innerText();
    if (/Application error|Gagal memuat data|does not exist in the current/i.test(body)) {
      failures.push(`${route} -> error state on screen`);
    }

    const newErrors = watcher.errors.slice(before);
    if (newErrors.length > 0) {
      failures.push(`${route} -> ${newErrors.join(' | ')}`);
    }
  }

  expect(failures, `Pages with problems:\n${failures.join('\n')}`).toEqual([]);
});

test('admin pages render for an admin', async ({ page, console: watcher }) => {
  test.slow();
  const { prisma } = await import('../src/lib/db');
  await prisma.user.update({
    where: { id: seeded.userId },
    data: { role: 'ADMIN' },
  });

  await login(page);

  const failures: string[] = [];
  for (const route of [
    '/admin',
    '/admin/users',
    '/admin/invitations',
    '/admin/templates',
    '/admin/wishes',
    '/admin/promos',
  ]) {
    const before = watcher.errors.length;
    const response = await page.goto(route, { waitUntil: 'networkidle' });

    if ((response?.status() ?? 0) >= 400) {
      failures.push(`${route} -> HTTP ${response?.status()}`);
      continue;
    }

    const body = await page.locator('body').innerText();
    if (/Application error|Gagal memuat/i.test(body)) {
      failures.push(`${route} -> error state on screen`);
    }

    const newErrors = watcher.errors.slice(before);
    if (newErrors.length > 0) failures.push(`${route} -> ${newErrors.join(' | ')}`);
  }

  expect(failures, `Admin pages with problems:\n${failures.join('\n')}`).toEqual([]);
});

test('a promo code created in admin is usable on the upgrade page', async ({
  page,
}) => {
  const { prisma } = await import('../src/lib/db');
  const CODE = 'ZZSWEEP25';

  await prisma.promoCode.deleteMany({ where: { code: CODE } });
  await prisma.promoCode.create({
    data: {
      code: CODE,
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxUses: null,
      validFrom: new Date(Date.now() - 86_400_000),
      validUntil: new Date(Date.now() + 86_400_000),
      applicablePlans: '[]',
    },
  });

  await login(page);
  await page.goto('/dashboard/upgrade', { waitUntil: 'networkidle' });

  await page.getByLabel('Kode promo').fill(CODE);
  await page.getByRole('button', { name: /gunakan/i }).click();

  // The field prices the code against each plan and keeps the first that is
  // accepted, so this lands on Starter: 25% of Rp 99.000 is Rp 24.750.
  await expect(
    page.getByText('Kode ZZSWEEP25 aktif — hemat Rp 24.750 untuk paket STARTER')
  ).toBeVisible();

  // And the applied state replaces the input, so the code cannot be re-entered.
  await expect(page.getByRole('button', { name: /hapus kode promo/i })).toBeVisible();

  await prisma.promoCode.deleteMany({ where: { code: CODE } });
});

test('an unknown promo code is refused with a readable reason', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/upgrade', { waitUntil: 'networkidle' });

  await page.getByLabel('Kode promo').fill('DEFINITELYNOTACODE');
  await page.getByRole('button', { name: /gunakan/i }).click();

  await expect(page.getByText(/tidak ditemukan|tidak valid/i)).toBeVisible();
});

test('duplicating an invitation opens a fresh draft copy', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/invitations', { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /salin/i }).first().click();

  // The copy opens in the editor, which means a new id in the URL.
  await page.waitForURL(/\/dashboard\/invitations\/[^/]+$/, { timeout: 30_000 });

  const { prisma } = await import('../src/lib/db');
  const copies = await prisma.invitation.findMany({
    where: { userId: seeded.userId },
    select: { id: true, status: true, brideName: true },
  });

  expect(copies.length, 'a copy should exist alongside the original').toBe(2);
  const copy = copies.find((row) => row.id !== seeded.invitationId);
  // Publishing is a decision, never inherited from the original.
  expect(copy?.status).toBe('DRAFT');
  expect(copy?.brideName).toBe('Sinta');

  await prisma.invitation.deleteMany({
    where: { userId: seeded.userId, id: { not: seeded.invitationId } },
  });
});

test('every control has a name a screen reader can announce', async ({ page }) => {
  test.slow();

  const { prisma } = await import('../src/lib/db');
  await prisma.user.update({
    where: { id: seeded.userId },
    data: { role: 'ADMIN' },
  });

  await login(page);

  const base = `/dashboard/invitations/${seeded.invitationId}`;
  const routes = [
    '/dashboard',
    '/dashboard/invitations',
    base,
    `${base}/guests`,
    `${base}/planner`,
    '/admin/users',
    '/admin/invitations',
    '/admin/promos',
  ];

  const findings: string[] = [];

  for (const route of routes) {
    await page.goto(route, { waitUntil: 'networkidle' });

    /*
     * A control with no text, no aria-label and no associated <label> is
     * announced as just "button" or "combobox" — the icon means nothing to
     * anyone not looking at the screen.
     */
    const unnamed = await page.evaluate(() => {
      const problems: string[] = [];
      const controls = document.querySelectorAll<HTMLElement>(
        'button, select, a[href], input:not([type="hidden"])'
      );

      controls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const text = (el.textContent ?? '').trim();
        const aria = el.getAttribute('aria-label')?.trim();
        const labelledBy = el.getAttribute('aria-labelledby');
        const title = el.getAttribute('title')?.trim();
        const placeholder = el.getAttribute('placeholder')?.trim();
        const labelled =
          el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`);

        if (text || aria || labelledBy || title || placeholder || labelled) return;

        problems.push(
          `<${el.tagName.toLowerCase()} class="${el.className}">`.slice(0, 90)
        );
      });

      return problems;
    });

    for (const problem of unnamed) findings.push(`${route}  ${problem}`);
  }

  expect(findings, `Controls with no accessible name:\n${findings.join('\n')}`).toEqual(
    []
  );
});
