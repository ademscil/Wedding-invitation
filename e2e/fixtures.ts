import path from 'node:path';
import dotenv from 'dotenv';
import { test as base, expect, type Page } from '@playwright/test';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export const E2E_EMAIL = 'zz-e2e@example.invalid';
export const E2E_PASSWORD = 'E2ePass123!';
export const E2E_SLUG_PREFIX = 'zz-e2e';

/**
 * Prisma is imported lazily everywhere in this file: ESM hoists static imports
 * above `dotenv.config()`, which would build the client before DATABASE_URL
 * exists.
 */
async function db() {
  const { prisma } = await import('../src/lib/db');
  return prisma;
}

export type SeedResult = {
  userId: string;
  invitationId: string;
  slug: string;
  guestIds: string[];
};

/** Creates a clearly-labelled BUSINESS account with one published invitation. */
export async function seedAccount(tier = 'BUSINESS'): Promise<SeedResult> {
  const prisma = await db();
  const { hash } = await import('bcryptjs');

  await removeAccount();

  const user = await prisma.user.create({
    data: {
      email: E2E_EMAIL,
      name: 'ZZ E2E',
      hashedPassword: await hash(E2E_PASSWORD, 12),
      subscriptionTier: tier,
    },
  });

  const template = await prisma.template.findFirst({ where: { isActive: true } });

  const invitation = await prisma.invitation.create({
    data: {
      userId: user.id,
      slug: `${E2E_SLUG_PREFIX}-undangan`,
      brideName: 'Sinta',
      groomName: 'Bagas',
      status: 'PUBLISHED',
      templateId: template?.id,
      weddingDate: new Date('2027-06-12'),
      events: JSON.stringify([
        {
          id: 'e1',
          name: 'Akad Nikah',
          date: '12 Juni 2027',
          startTime: '09.00',
          venue: 'Masjid Agung',
          address: 'Jakarta',
        },
      ]),
    },
  });

  const guests = await Promise.all(
    [
      { name: 'Andi Pratama', groupName: 'Keluarga', rsvpGuestCount: 2 },
      { name: 'Bunga Lestari', groupName: 'Teman', rsvpGuestCount: 1 },
      { name: 'Citra Dewi', groupName: 'Kantor', rsvpGuestCount: 1 },
    ].map((g, i) =>
      prisma.guest.create({
        data: { ...g, invitationId: invitation.id, personalLink: `zze2e00${i}` },
      })
    )
  );

  return {
    userId: user.id,
    invitationId: invitation.id,
    slug: invitation.slug,
    guestIds: guests.map((g) => g.id),
  };
}

/**
 * Creates an extra invitation (with guests) for the existing E2E user.
 *
 * Planner and seating tests each take their own invitation so accumulated
 * budget items, tables and checklists from one test can never leak into the
 * next one's assertions.
 */
export async function seedInvitation(label: string) {
  const prisma = await db();
  const user = await prisma.user.findUniqueOrThrow({ where: { email: E2E_EMAIL } });
  const template = await prisma.template.findFirst({ where: { isActive: true } });

  const invitation = await prisma.invitation.create({
    data: {
      userId: user.id,
      slug: `${E2E_SLUG_PREFIX}-${label}-${Date.now()}`,
      brideName: 'Sinta',
      groomName: 'Bagas',
      status: 'DRAFT',
      templateId: template?.id,
    },
  });

  await prisma.guest.createMany({
    data: [
      { invitationId: invitation.id, name: 'Andi Pratama', groupName: 'Keluarga', personalLink: `zz-${label}-1-${Date.now()}`, rsvpGuestCount: 2 },
      { invitationId: invitation.id, name: 'Bunga Lestari', groupName: 'Teman', personalLink: `zz-${label}-2-${Date.now()}`, rsvpGuestCount: 1 },
    ],
  });

  return invitation.id;
}

/** Deletes the E2E account; cascades remove invitations, guests and planner rows. */
export async function removeAccount() {
  const prisma = await db();
  await prisma.user.deleteMany({ where: { email: E2E_EMAIL } });
  await prisma.invitation.deleteMany({
    where: { slug: { startsWith: E2E_SLUG_PREFIX } },
  });
}

export async function setTier(tier: string) {
  const prisma = await db();
  await prisma.user.updateMany({
    where: { email: E2E_EMAIL },
    data: { subscriptionTier: tier },
  });
}

/** Signs in through the real form so the session cookie is genuine. */
export async function login(page: Page) {
  await page.goto('/login');
  await page.getByPlaceholder('nama@email.com').fill(E2E_EMAIL);
  await page.getByPlaceholder('Masukkan password').fill(E2E_PASSWORD);
  await page.getByRole('button', { name: /masuk/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

/**
 * Console noise we accept: Next's dev-mode React DevTools hint, favicon
 * preloads, and the hydration warning React logs for browser-extension DOM
 * edits. Anything else fails the test.
 */
const IGNORED_CONSOLE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /was preloaded using link preload/i,
  /*
   * Next prefetches the links on a page; navigating away cancels those
   * requests and logs this. The message itself says it falls back to a browser
   * navigation, so nothing is broken — it is an artefact of a test moving
   * faster than a person would.
   */
  /Failed to fetch RSC payload/i,
  /*
   * Same cause: next-auth logs this when its /api/auth/session request is
   * aborted, which is what a navigation does to an in-flight fetch. A sweep
   * that visits ten routes back to back produces it; a person clicking
   * through does not.
   */
  /\[next-auth\]\[error\]\[CLIENT_FETCH_ERROR\]/i,
];

export type ConsoleWatcher = { errors: string[]; assertClean: () => void };

/** Records console errors and page exceptions for later assertion. */
export function watchConsole(page: Page): ConsoleWatcher {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text}`);
  });

  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });

  return {
    errors,
    assertClean() {
      expect(errors, `Browser reported errors:\n${errors.join('\n')}`).toEqual(
        []
      );
    },
  };
}

export const test = base.extend<{ console: ConsoleWatcher }>({
  console: async ({ page }, use) => {
    const watcher = watchConsole(page);
    await use(watcher);
  },
});

export { expect };

/**
 * Drags an element by dispatching a real pointerdown and then moving the mouse.
 *
 * Playwright's `mouse.down()` does not produce a `pointerdown` in this Chromium
 * build, so a pure mouse drag never starts. Everything after the initial press —
 * the move tracking and the save — is exercised for real.
 */
export async function dragElement(
  page: Page,
  locator: ReturnType<Page['locator']>,
  dx: number,
  dy: number
) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no bounding box');

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  await locator.evaluate((el, [x, y]) => {
    el.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: 1,
        isPrimary: true,
      })
    );
  }, [cx, cy]);

  await page.mouse.down();
  await page.mouse.move(cx + dx / 2, cy + dy / 2, { steps: 8 });
  await page.mouse.move(cx + dx, cy + dy, { steps: 8 });
  await page.waitForTimeout(100);
  await page.mouse.up();
}

/**
 * The published invitation the public-page specs read.
 *
 * It used to be a row somebody created by hand and left in the database, so
 * the specs passed or failed depending on whether that row still existed —
 * and it eventually did not. Seeding it here makes those specs self-contained:
 * they describe the invitation they need rather than assuming one.
 *
 * Idempotent, so it is safe to call from several specs in the same run.
 */
export const AUDIT_SLUG = 'audit-demo';
export const AUDIT_EMAIL = 'zz-audit@example.invalid';

export async function seedAuditDemo() {
  const prisma = await db();

  const user = await prisma.user.upsert({
    where: { email: AUDIT_EMAIL },
    update: { subscriptionTier: 'BUSINESS' },
    create: {
      email: AUDIT_EMAIL,
      name: 'ZZ Audit',
      subscriptionTier: 'BUSINESS',
    },
  });

  const template = await prisma.template.findFirst({ where: { isActive: true } });

  const content = {
    brideName: 'Siti Nurhaliza Ramadhani',
    groomName: 'Muhammad Rizky Pratama',
    brideParents: 'Bapak Slamet & Ibu Ratna',
    groomParents: 'Bapak Hendra & Ibu Sari',
    status: 'PUBLISHED',
    templateId: template?.id,
    weddingDate: new Date('2027-06-12'),
    expiresAt: null,
    events: JSON.stringify([
      {
        id: 'e1',
        name: 'Akad Nikah',
        date: '2027-06-12',
        startTime: '08:00',
        endTime: '10:00',
        venue: 'Masjid Agung',
        address: 'Jl. Merdeka No. 1, Bandung',
      },
      {
        id: 'e2',
        name: 'Resepsi',
        date: '2027-06-12',
        startTime: '11:00',
        endTime: '14:00',
        venue: 'Gedung Serbaguna',
        address: 'Jl. Merdeka No. 1, Bandung',
      },
    ]),
    // The video specs overwrite this key; it starts set so the section exists.
    settings: JSON.stringify({ videoUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
  };

  await prisma.invitation.upsert({
    where: { slug: AUDIT_SLUG },
    update: content,
    create: { ...content, slug: AUDIT_SLUG, userId: user.id },
  });
}
