import path from 'node:path';
import dotenv from 'dotenv';
import { test, expect } from '@playwright/test';
import { seedAuditDemo } from './fixtures';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

/**
 * Prewedding video.
 *
 * The embed is deliberately not mounted until the visitor presses play — most
 * guests open the invitation on mobile data, and an autoloading player would
 * cost them a megabyte before they ask for it.
 */

const SLUG = 'audit-demo';

// Deliberately different from the livestream video the seed uses, so the
// assertions below cannot be satisfied by that section's embed.
const VIDEO_ID = 'aBcD1234xyz';
const VIDEO_URL = `https://youtu.be/${VIDEO_ID}`;

/** Opens the cover, which is what a guest does before seeing any section. */
async function openInvitation(page: import('@playwright/test').Page) {
  await page.goto(`/${SLUG}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /buka undangan/i }).click();
  // The cover is a fixed z-50 overlay; nothing below it is reachable until the
  // open transition has taken it away.
  await expect(
    page.getByRole('button', { name: /buka undangan/i })
  ).toBeHidden();
}

async function setVideoUrl(url: string | null) {
  const { prisma } = await import('../src/lib/db');
  const invitation = await prisma.invitation.findUnique({
    where: { slug: SLUG },
    select: { settings: true },
  });
  const settings = JSON.parse(invitation?.settings || '{}');
  if (url) settings.videoUrl = url;
  else delete settings.videoUrl;
  await prisma.invitation.update({
    where: { slug: SLUG },
    data: { settings: JSON.stringify(settings) },
  });
}

test.beforeAll(async () => {
  await seedAuditDemo();
});

test.afterAll(async () => {
  await setVideoUrl(VIDEO_URL);
});

test('the video is a poster until the visitor asks for it', async ({ page }) => {
  await setVideoUrl(VIDEO_URL);
  await openInvitation(page);

  await expect(page.getByRole('heading', { name: 'Video Prewedding' })).toBeVisible();

  // Nothing is loaded from YouTube yet.
  expect(await page.locator(`iframe[src*="${VIDEO_ID}"]`).count()).toBe(0);

  const play = page.getByRole('button', { name: /putar video prewedding/i });
  await play.scrollIntoViewIfNeeded();
  await expect(play).toBeVisible();
  await play.click();

  const frame = page.locator(`iframe[src*="youtube.com/embed/${VIDEO_ID}"]`);
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('allowfullscreen', '');
});

test('an unrecognised link renders nothing rather than an empty box', async ({
  page,
}) => {
  await setVideoUrl('https://example.invalid/not-a-video');
  await openInvitation(page);

  await expect(page.getByRole('heading', { name: 'Video Prewedding' })).toHaveCount(0);
});

test('no video configured leaves the section out entirely', async ({ page }) => {
  await setVideoUrl(null);
  await openInvitation(page);

  await expect(page.getByRole('heading', { name: 'Video Prewedding' })).toHaveCount(0);
});

test('the video section does not introduce horizontal overflow', async ({ page }) => {
  await setVideoUrl(VIDEO_URL);

  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await openInvitation(page);
    await page.getByRole('heading', { name: 'Video Prewedding' }).scrollIntoViewIfNeeded();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
  }
});
