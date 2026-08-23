import { test, expect } from '@playwright/test';

/**
 * Sign-in regressions.
 *
 * The Google button used to be shown by a `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH`
 * flag set independently of the credentials the server needs to register the
 * provider. When the two drifted apart the button either offered a flow that
 * did not exist — dropping the visitor on NextAuth's raw "Server error, check
 * the server logs" page — or hid one that would have worked.
 *
 * The button now follows /api/auth/providers, so these assertions hold in both
 * directions depending on how the environment running them is configured.
 */

test.describe('provider discovery', () => {
  test('the offered buttons match the providers the server registered', async ({
    page,
    request,
  }) => {
    const response = await request.get('/api/auth/providers');
    expect(response.ok()).toBe(true);

    const providers = (await response.json()) as Record<string, unknown>;

    // Credentials sign-in is always available; without it there is no way in.
    expect(providers.credentials).toBeTruthy();

    await page.goto('/login', { waitUntil: 'networkidle' });

    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toHaveCount(providers.google ? 1 : 0);
  });

  test('email and password sign-in is always offered', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });

    await expect(page.getByPlaceholder('nama@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Masukkan password')).toBeVisible();
    await expect(page.getByRole('button', { name: /^masuk$/i })).toBeVisible();
  });
});

test.describe('auth error page', () => {
  test('explains a configuration failure without operator jargon', async ({ page }) => {
    await page.goto('/auth-error?error=Configuration', { waitUntil: 'networkidle' });

    await expect(page.getByText('Masuk sedang bermasalah')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /kembali ke halaman masuk/i })
    ).toBeVisible();

    // NextAuth's own wording tells the visitor to read server logs.
    await expect(page.getByText(/check the server logs/i)).toHaveCount(0);
    await expect(page.getByText(/server error/i)).toHaveCount(0);
  });

  test('names a linked-account clash so the visitor knows what to do', async ({
    page,
  }) => {
    await page.goto('/auth-error?error=OAuthAccountNotLinked', {
      waitUntil: 'networkidle',
    });

    await expect(page.getByText('Email sudah terdaftar')).toBeVisible();
  });

  test('falls back to a usable message for an unrecognised code', async ({ page }) => {
    await page.goto('/auth-error?error=SomethingUnexpected', {
      waitUntil: 'networkidle',
    });

    await expect(page.getByText('Gagal masuk')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /kembali ke halaman masuk/i })
    ).toBeVisible();
  });
});
