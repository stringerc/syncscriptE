/**
 * Tight visual baselines (viewport) — 3 routes, Chromium only.
 * Update (local): npx playwright test e2e/visual-snapshots.spec.ts --update-snapshots
 */
import { test, expect } from '@playwright/test';
import { installChatAssistantClosed, installDevGuestSession } from './fixtures/guest-session';

const SNAPSHOT = {
  maxDiffPixels: 450,
  maxDiffPixelRatio: 0.02,
  animations: 'disabled' as const,
  caret: 'hide' as const,
  timeout: 20_000,
};

test.describe('visual baselines (viewport)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 60_000 });

  test('landing hero band', async ({ page }) => {
    await page.context().addInitScript(() => {
      try {
        localStorage.setItem('cookies_accepted', 'false');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await expect(page).toHaveScreenshot('landing-hero.png', {
      ...SNAPSHOT,
      clip: { x: 0, y: 0, width: 1280, height: 800 },
    });
  });

  test('login guest CTA', async ({ page }) => {
    await page.context().addInitScript(() => {
      try {
        localStorage.setItem('cookies_accepted', 'false');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/login?guest=true', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 20_000 });
    // Full-viewport login is flaky (background orbs / marketing shell). Scope to the centered card shell.
    const shell = page.locator('div.min-h-screen').first();
    await expect(shell).toBeVisible();
    await expect(shell).toHaveScreenshot('login-guest-cta.png', SNAPSHOT);
  });
});

test.describe('dashboard guest (chat closed)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ context }) => {
    await installDevGuestSession(context);
    await installChatAssistantClosed(context);
  });

  test('three-column hub (stable guest)', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#energy-meter')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: "TODAY'S ORCHESTRATION" })).toBeVisible({
      timeout: 20_000,
    });
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('dashboard-guest-three-col.png', {
      ...SNAPSHOT,
      fullPage: false,
    });
  });
});
