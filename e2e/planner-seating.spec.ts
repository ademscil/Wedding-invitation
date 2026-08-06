import {
  test,
  expect,
  seedAccount,
  seedInvitation,
  dragElement,
  removeAccount,
  setTier,
  login,
} from './fixtures';

// One account for the file, but a fresh invitation per test so no state carries
// over between them.
let invitationId: string;

test.beforeAll(async ({ browser }) => {
  await seedAccount('BUSINESS');

  const warmupId = await seedInvitation('warmup');
  const page = await browser.newPage();
  await login(page);
  await page.goto(`/dashboard/invitations/${warmupId}/planner`);
  await page.getByRole('button', { name: /denah kursi/i }).click();
  await page.waitForTimeout(1000);
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  invitationId = await seedInvitation(
    testInfo.title.replace(/[^a-z0-9]+/gi, '').slice(0, 20).toLowerCase()
  );
});

test.afterAll(async () => {
  await removeAccount();
});

const plannerUrl = () => `/dashboard/invitations/${invitationId}/planner`;

test('budget item can be added and marked paid', async ({
  page,
  console: watcher,
}) => {
  await login(page);
  await page.goto(plannerUrl());

  await page.getByPlaceholder('Nama item (mis. Sewa gedung)').fill('Sewa Gedung');
  await page.getByPlaceholder('Estimasi biaya').fill('25000000');
  await page.getByRole('button', { name: /^tambah$/i }).click();

  await expect(page.getByText('Sewa Gedung')).toBeVisible();
  // Summary tile reflects the new item.
  await expect(page.getByText('Rp 25.000.000').first()).toBeVisible();

  const paidBox = page.getByRole('checkbox', { name: /tandai sewa gedung lunas/i });
  await paidBox.click();
  await expect(paidBox).toBeChecked({ timeout: 15_000 });

  watcher.assertClean();
});

test('vendor can be added and its status changed', async ({
  page,
  console: watcher,
}) => {
  await login(page);
  await page.goto(plannerUrl());
  await page.getByRole('button', { name: /^vendor$/i }).click();

  await page.getByPlaceholder('Nama vendor').fill('Katering Sejahtera');
  await page.getByPlaceholder('Harga').fill('15000000');
  await page.getByRole('button', { name: /^tambah$/i }).click();

  await expect(page.getByText('Katering Sejahtera')).toBeVisible();

  await page
    .getByRole('combobox', { name: /status vendor katering sejahtera/i })
    .selectOption('BOOKED');
  await expect(
    page.getByRole('combobox', { name: /status vendor katering sejahtera/i })
  ).toHaveValue('BOOKED');

  watcher.assertClean();
});

test('standard checklist seeds and a task can be ticked', async ({
  page,
  console: watcher,
}) => {
  await login(page);
  await page.goto(plannerUrl());
  await page.getByRole('button', { name: /^checklist$/i }).click();

  // Wait for the empty state before clicking: it proves the list query has
  // settled, so the seed button is acting on known-empty data.
  await expect(page.getByText('Belum ada tugas.', { exact: false })).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole('button', { name: /muat checklist standar/i }).click();

  // The toast confirms the mutation landed before we assert on the list.
  await expect(page.getByText(/tugas standar dimuat/i)).toBeVisible({
    timeout: 20_000,
  });

  const firstTask = page.getByText('Tentukan tanggal & anggaran pernikahan');

  await expect(firstTask).toBeVisible({ timeout: 20_000 });

  const checkbox = page
    .getByRole('checkbox', { name: /tandai tentukan tanggal/i })
    .first();
  await checkbox.click();
  await expect(checkbox).toBeChecked({ timeout: 15_000 });

  watcher.assertClean();
});

test('seating: create a table, drag it, and seat a guest', async ({
  page,
  console: watcher,
}) => {
  await login(page);
  await page.goto(plannerUrl());
  await page.getByRole('button', { name: /denah kursi/i }).click();

  await page.getByPlaceholder('Nama meja (mis. Meja Keluarga 1)').fill('Meja 1');
  await page.getByPlaceholder('Kapasitas').fill('4');
  await page.getByRole('button', { name: /tambah meja/i }).click();

  const table = page.getByRole('button', { name: /^Meja 1 0\/4$/ });
  await expect(table).toBeVisible({ timeout: 20_000 });

  // Drag the table across the canvas and confirm the position persisted.
  const before = await table.boundingBox();
  expect(before).not.toBeNull();

  await dragElement(page, table, 140, 50);

  await page.waitForTimeout(1500);
  const after = await table.boundingBox();
  expect(
    Math.abs(after!.x - before!.x),
    'table should have moved horizontally'
  ).toBeGreaterThan(40);

  // Position must survive a reload — proves it was saved, not just local state.
  await page.reload();
  await page.getByRole('button', { name: /denah kursi/i }).click();
  const reloaded = page.getByRole('button', { name: /^Meja 1 \d\/4$/ });
  await expect(reloaded).toBeVisible({ timeout: 20_000 });
  const afterReload = await reloaded.boundingBox();
  expect(Math.abs(afterReload!.x - after!.x)).toBeLessThan(30);

  // Seat a guest: select the table, then use the unassigned list.
  await reloaded.click();
  await page
    .getByRole('button', { name: /dudukkan/i })
    .first()
    .click();

  await expect(
    page.getByRole('button', { name: /^Meja 1 [1-9]\/4$/ })
  ).toBeVisible({ timeout: 20_000 });

  watcher.assertClean();
});

test('seating refuses a guest that does not fit', async ({ page }) => {
  await login(page);
  await page.goto(plannerUrl());
  await page.getByRole('button', { name: /denah kursi/i }).click();

  // Capacity 1 cannot take Andi Pratama, whose RSVP is for 2 people.
  await page.getByPlaceholder('Nama meja (mis. Meja Keluarga 1)').fill('Meja Kecil');
  await page.getByPlaceholder('Kapasitas').fill('1');
  await page.getByRole('button', { name: /tambah meja/i }).click();

  const smallTable = page.getByRole('button', { name: /^Meja Kecil \d\/1$/ });
  await expect(smallTable).toBeVisible({ timeout: 20_000 });
  await smallTable.click();

  const andiRow = page
    .locator('div.flex.items-center')
    .filter({ hasText: 'Andi Pratama' })
    .last();
  await andiRow.getByRole('button', { name: /dudukkan/i }).click();

  await expect(page.getByText(/kapasitas meja tidak cukup/i)).toBeVisible({
    timeout: 20_000,
  });
});

test('planner is locked for a FREE plan', async ({ page }) => {
  await setTier('FREE');
  await login(page);
  await page.goto(plannerUrl());

  await expect(page.getByText('Event Planner belum tersedia')).toBeVisible();
  await expect(page.getByRole('link', { name: /upgrade paket/i })).toBeVisible();

  await setTier('BUSINESS');
});
