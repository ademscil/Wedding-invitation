import path from 'node:path';
import dotenv from 'dotenv';
import { test, expect } from '@playwright/test';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * Password reset.
 *
 * Without this flow a customer who forgets their password is locked out of a
 * paid account permanently, with no route back that does not involve a human.
 */

const EMAIL = 'zz-reset@example.invalid';
const OLD_PASSWORD = 'OldPass123!';
const NEW_PASSWORD = 'BrandNewPass456!';

async function db() {
  const { prisma } = await import('../src/lib/db');
  return prisma;
}

async function createAccount() {
  const prisma = await db();
  const { hash } = await import('bcryptjs');

  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await prisma.user.create({
    data: {
      email: EMAIL,
      name: 'ZZ Reset',
      hashedPassword: await hash(OLD_PASSWORD, 12),
    },
  });
}

async function removeAccount() {
  const prisma = await db();
  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset-password:${EMAIL}` },
  });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

/** Reads the raw token by re-issuing one, since the emailed value is not stored. */
async function issueToken(): Promise<string> {
  const prisma = await db();
  const { createPasswordResetToken } = await import('../src/server/lib/password-reset');
  return createPasswordResetToken(prisma, EMAIL);
}

test.beforeEach(createAccount);
test.afterEach(removeAccount);

test('login offers a way out for a forgotten password', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /lupa password/i }).click();
  await page.waitForURL('**/forgot-password');
  await expect(page.getByRole('heading', { name: /lupa password/i })).toBeVisible();
});

test('the request form never reveals whether an email is registered', async ({
  page,
}) => {
  await page.goto('/forgot-password', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('nama@email.com').fill('definitely-not-a-user@example.invalid');
  await page.getByRole('button', { name: /kirim tautan reset/i }).click();

  // Same confirmation as for an address that does exist, so the form cannot be
  // used to enumerate accounts.
  await expect(page.getByText('Cek Email Anda')).toBeVisible();
});

test('a valid link lets the visitor set a new password and sign in with it', async ({
  page,
}) => {
  const token = await issueToken();

  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: /buat password baru/i })).toBeVisible();

  await page.getByPlaceholder('Minimal 8 karakter').fill(NEW_PASSWORD);
  await page.getByPlaceholder('Ulangi password baru').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /simpan password baru/i }).click();

  await expect(page.getByText('Password Diperbarui')).toBeVisible();

  // The whole point: the new password actually works.
  await page.goto('/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('nama@email.com').fill(EMAIL);
  await page.getByPlaceholder('Masukkan password').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /^masuk$/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
});

test('a link cannot be used twice', async ({ page }) => {
  const token = await issueToken();

  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Minimal 8 karakter').fill(NEW_PASSWORD);
  await page.getByPlaceholder('Ulangi password baru').fill(NEW_PASSWORD);
  await page.getByRole('button', { name: /simpan password baru/i }).click();
  await expect(page.getByText('Password Diperbarui')).toBeVisible();

  // Replaying the same link must not offer the form again.
  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  await expect(page.getByText('Tautan Tidak Valid')).toBeVisible();
});

test('an unrecognised link is refused before anything is typed', async ({ page }) => {
  await page.goto(`/reset-password?token=${'a'.repeat(64)}`, {
    waitUntil: 'networkidle',
  });

  await expect(page.getByText('Tautan Tidak Valid')).toBeVisible();
  await expect(page.getByRole('link', { name: /minta tautan baru/i })).toBeVisible();
});

test('a mismatched confirmation is caught before submitting', async ({ page }) => {
  const token = await issueToken();

  await page.goto(`/reset-password?token=${token}`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Minimal 8 karakter').fill(NEW_PASSWORD);
  await page.getByPlaceholder('Ulangi password baru').fill('something-else-entirely');
  await page.getByRole('button', { name: /simpan password baru/i }).click();

  await expect(page.getByText('Konfirmasi password tidak cocok')).toBeVisible();
});
