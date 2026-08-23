import { test, expect, type Page } from '@playwright/test';

/**
 * Responsive regression guard.
 *
 * A page whose content is wider than its viewport forces the reader to scroll
 * sideways, which is the single most visible way a layout "breaks" on a phone.
 * These tests load each public page at a spread of widths and assert nothing
 * overflows, and report which element caused it when something does.
 */

const VIEWPORTS = [
  { name: 'phone-small', width: 320, height: 640 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'phone-large', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop-wide', width: 1920, height: 1080 },
];

const PUBLIC_PAGES = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'invitation', path: '/audit-demo' },
];

/** Elements sticking out past the viewport, with enough detail to find them. */
async function findOverflowingElements(page: Page) {
  return page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const offenders: { tag: string; cls: string; width: number; right: number }[] = [];

    document.querySelectorAll<HTMLElement>('body *').forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Ignore zero-size and deliberately off-screen elements (drawers, sr-only).
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.right <= 0) return;

      // A 1px tolerance absorbs sub-pixel rounding.
      if (rect.right > docWidth + 1) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 120),
          width: Math.round(rect.width),
          right: Math.round(rect.right),
        });
      }
    });

    return { docWidth, offenders: offenders.slice(0, 8) };
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    for (const target of PUBLIC_PAGES) {
      test(`${target.name} has no horizontal overflow`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(target.path, { waitUntil: 'networkidle' });

        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth
        );
        const clientWidth = await page.evaluate(
          () => document.documentElement.clientWidth
        );

        if (scrollWidth > clientWidth + 1) {
          const { offenders } = await findOverflowingElements(page);
          const detail = offenders
            .map((o) => `<${o.tag} class="${o.cls}"> w=${o.width} right=${o.right}`)
            .join('\n  ');
          throw new Error(
            `${target.path} overflows at ${viewport.width}px ` +
              `(scroll ${scrollWidth} > client ${clientWidth}).\n  ${detail}`
          );
        }

        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      });
    }
  });
}

test.describe('touch targets', () => {
  test('primary actions are large enough to tap on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login', { waitUntil: 'networkidle' });

    // 40px is a pragmatic floor; below that a control is awkward on a phone.
    const tooSmall = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>('button, a[href]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.height < 40 && (el.textContent ?? '').trim().length > 0) {
          bad.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" h=${Math.round(rect.height)}`);
        }
      });
      return bad;
    });

    // Inline text links are expected to be short; only flag real controls.
    const buttons = tooSmall.filter((entry) => entry.startsWith('button'));
    expect(buttons, `Undersized buttons:\n  ${buttons.join('\n  ')}`).toEqual([]);
  });
});

/**
 * Dashboard pages behind auth. These are the screens an owner spends the most
 * time in, and the ones a floating sidebar button used to cover on a phone.
 */
test.describe('dashboard', () => {
  test.beforeAll(async () => {
    const { seedAccount } = await import('./fixtures');
    await seedAccount('BUSINESS');
  });

  test.afterAll(async () => {
    const { removeAccount } = await import('./fixtures');
    await removeAccount();
  });

  for (const viewport of VIEWPORTS) {
    test(`no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      const { login } = await import('./fixtures');
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await login(page);

      const pages = [
        '/dashboard',
        '/dashboard/invitations',
        '/dashboard/invitations/new',
        '/dashboard/profile',
        '/dashboard/upgrade',
      ];

      for (const path of pages) {
        await page.goto(path, { waitUntil: 'networkidle' });

        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));

        if (scrollWidth > clientWidth + 1) {
          const { offenders } = await findOverflowingElements(page);
          const detail = offenders
            .map((o) => `<${o.tag} class="${o.cls}"> w=${o.width} right=${o.right}`)
            .join('\n  ');
          throw new Error(
            `${path} overflows at ${viewport.width}px ` +
              `(scroll ${scrollWidth} > client ${clientWidth}).\n  ${detail}`
          );
        }
      }
    });
  }

  test('page heading is not hidden behind the mobile bar', async ({ page }) => {
    const { login } = await import('./fixtures');
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    const heading = page.getByRole('heading', { level: 1 }).first();
    const box = await heading.boundingBox();
    expect(box, 'dashboard heading should be visible').not.toBeNull();

    // The sticky bar is 56px tall; the heading must start below it.
    expect(box!.y).toBeGreaterThanOrEqual(56);
  });

  test('sidebar is reachable and closes after navigating', async ({ page }) => {
    const { login } = await import('./fixtures');
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /buka menu/i }).click();
    const drawer = page.getByRole('dialog', { name: /menu navigasi/i });
    await expect(drawer).toBeVisible();

    await drawer.getByRole('link', { name: /undangan/i }).first().click();
    await page.waitForURL('**/dashboard/invitations');

    // Navigating must dismiss the drawer, or it covers the page just opened.
    await expect(drawer).not.toBeInViewport();
  });
});
