import { test, expect, seedAccount, removeAccount, login } from './fixtures';

let seed: Awaited<ReturnType<typeof seedAccount>>;

test.beforeAll(async () => {
  seed = await seedAccount();
});

test.afterAll(async () => {
  await removeAccount();
});

test('dashboard loads with quota and verification banners', async ({
  page,
  console: watcher,
}) => {
  await login(page);

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Selamat datang'
  );
  // Quota banner is driven by user.getQuota — proves the query resolved.
  await expect(page.getByText(/Paket Business/i)).toBeVisible();
  // Seeded account has emailVerified = null.
  await expect(page.getByText('Email belum diverifikasi')).toBeVisible();

  watcher.assertClean();
});

test('guest list renders seeded guests and adds a new one', async ({
  page,
  console: watcher,
}) => {
  await login(page);
  await page.goto(`/dashboard/invitations/${seed.invitationId}/guests`);

  await expect(page.getByText('Andi Pratama')).toBeVisible();
  await expect(page.getByText('Bunga Lestari')).toBeVisible();

  await page.getByRole('button', { name: /tambah tamu/i }).first().click();

  const dialog = page.getByRole('dialog', { name: 'Tambah Tamu' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Nama lengkap tamu').fill('Dewi Sartika');
  await dialog.getByRole('button', { name: 'Tambah Tamu', exact: true }).click();

  await expect(page.getByText('Dewi Sartika')).toBeVisible();
  watcher.assertClean();
});

test('Escape closes the add-guest dialog', async ({ page }) => {
  await login(page);
  await page.goto(`/dashboard/invitations/${seed.invitationId}/guests`);

  await page.getByRole('button', { name: /tambah tamu/i }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Tambah Tamu' });
  await expect(dialog).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('public invitation renders and accepts an RSVP', async ({
  page,
  console: watcher,
}) => {
  await page.goto(`/${seed.slug}`);

  // The cover has to be opened before the body becomes interactive.
  const openButton = page.getByRole('button', { name: /buka undangan/i });
  if (await openButton.isVisible().catch(() => false)) {
    await openButton.click();
  }

  await expect(page.getByText(/Sinta/).first()).toBeVisible();

  const rsvpName = page.locator('#rsvp-name');
  await rsvpName.scrollIntoViewIfNeeded();
  await rsvpName.fill('Tamu Uji');

  // Attendance is a set of choice buttons, not a native select.
  await page.getByRole('button', { name: /^hadir$/i }).first().click();
  await page.getByRole('button', { name: /kirim konfirmasi|kirim rsvp/i }).click();

  await expect(page.getByText(/terima kasih|berhasil/i).first()).toBeVisible({
    timeout: 20_000,
  });
  watcher.assertClean();
});

test('public guestbook accepts a wish', async ({ page, console: watcher }) => {
  await page.goto(`/${seed.slug}`);

  const openButton = page.getByRole('button', { name: /buka undangan/i });
  if (await openButton.isVisible().catch(() => false)) {
    await openButton.click();
  }

  const wishName = page.locator('#wish-name');
  await wishName.scrollIntoViewIfNeeded();
  await wishName.fill('Pengirim Uji');
  await page.locator('#wish-message').fill('Selamat menempuh hidup baru!');
  await page.getByRole('button', { name: /kirim ucapan/i }).click();

  await expect(page.getByText('Selamat menempuh hidup baru!')).toBeVisible({
    timeout: 20_000,
  });
  watcher.assertClean();
});

test('expired invitation is not reachable', async ({ page }) => {
  const { prisma } = await import('../src/lib/db');
  await prisma.invitation.update({
    where: { id: seed.invitationId },
    data: { expiresAt: new Date(Date.now() - 86_400_000) },
  });

  const response = await page.goto(`/${seed.slug}`);
  expect(response?.status()).toBe(404);

  await prisma.invitation.update({
    where: { id: seed.invitationId },
    data: { expiresAt: null },
  });
});
