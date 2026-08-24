import { test, expect, seedAccount, removeAccount, login } from './fixtures';

/**
 * Protecting work in progress.
 *
 * The editor holds a couple of dozen fields. Someone can spend twenty minutes
 * on it and lose the lot to one stray click on the sidebar, which is the kind
 * of thing people do not come back from.
 */

let seeded: Awaited<ReturnType<typeof seedAccount>>;

test.beforeAll(async () => {
  seeded = await seedAccount('BUSINESS');
});
test.afterAll(removeAccount);

async function openEditor(page: import('@playwright/test').Page) {
  await page.goto(`/dashboard/invitations/${seeded.invitationId}`, {
    waitUntil: 'networkidle',
  });
  await expect(page.getByLabel('Nama Mempelai Pria')).toBeVisible();
}

test('an untouched editor does not claim to have unsaved work', async ({ page }) => {
  await login(page);
  await openEditor(page);

  // Nagging on a page nobody edited trains people to dismiss the prompt.
  await expect(page.getByText('Belum disimpan')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tersimpan' })).toBeDisabled();
});

test('editing a field marks the work as unsaved', async ({ page }) => {
  await login(page);
  await openEditor(page);

  await page.getByLabel('Nama Mempelai Pria').fill('Bagas Pratama');

  await expect(page.getByText('Belum disimpan')).toBeVisible();
  await expect(
    page.getByRole('button', { name: /simpan perubahan/i })
  ).toBeEnabled();
});

test('leaving with unsaved work asks first, and staying keeps the edit', async ({
  page,
}) => {
  await login(page);
  await openEditor(page);

  await page.getByLabel('Nama Mempelai Pria').fill('Bagas Pratama');
  await expect(page.getByText('Belum disimpan')).toBeVisible();

  // Decline the prompt: the navigation must not happen.
  page.once('dialog', (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toMatch(/belum disimpan/i);
    dialog.dismiss();
  });

  await page.getByRole('link', { name: /tamu/i }).first().click();
  await page.waitForTimeout(1000);

  expect(page.url()).toContain(seeded.invitationId);
  expect(page.url()).not.toContain('/guests');
  await expect(page.getByLabel('Nama Mempelai Pria')).toHaveValue('Bagas Pratama');
});

test('accepting the prompt lets the navigation through', async ({ page }) => {
  await login(page);
  await openEditor(page);

  await page.getByLabel('Nama Mempelai Pria').fill('Bagas Pratama');
  await expect(page.getByText('Belum disimpan')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('link', { name: /tamu/i }).first().click();

  await page.waitForURL('**/guests', { timeout: 30_000 });
});

test('saving clears the warning and navigation is free again', async ({ page }) => {
  await login(page);
  await openEditor(page);

  await page.getByLabel('Nama Mempelai Pria').fill('Bagas Pratama');
  await page.getByRole('button', { name: /simpan perubahan/i }).click();

  await expect(page.getByText('Belum disimpan')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tersimpan' })).toBeDisabled();

  // No dialog should appear now; if one does, this click would hang.
  let prompted = false;
  page.on('dialog', (dialog) => {
    prompted = true;
    dialog.accept();
  });

  await page.getByRole('link', { name: /tamu/i }).first().click();
  await page.waitForURL('**/guests', { timeout: 30_000 });
  expect(prompted, 'saved work must not prompt').toBe(false);
});
