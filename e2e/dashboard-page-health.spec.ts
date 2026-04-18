/**
 * Regression: dashboard shell loads without React runtime errors (e.g. missing hook imports).
 * Uses dev-guest localStorage shape — no Supabase login required.
 *
 * Run after deploy:
 *   PLAYWRIGHT_BASE_URL=https://www.syncscript.app npm run test:e2e:dashboard-health
 *
 * Local (uses preview server from playwright config or BASE_URL):
 *   CI=true npm run build && npm run test:e2e:dashboard-health
 */
import { test, expect } from '@playwright/test';

const GUEST_SESSION = {
  token: 'e2e-playwright-mock-token',
  user: {
    id: 'guest_e2e_dashboard_health',
    email: 'e2e-guest@syncscript.test',
    name: 'E2E Guest',
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    isGuest: true,
  },
};

test.beforeEach(async ({ context }) => {
  await context.addInitScript((payload) => {
    window.localStorage.setItem('syncscript_dev_guest_session_v1', JSON.stringify(payload));
  }, GUEST_SESSION);
});

test('dashboard loads with no page errors or useCurrentReadiness failures', async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleFailures: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (text.includes('[CursorBrowser]')) return;
    consoleFailures.push(text);
  });

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard$/);

  // Let React mount before asserting (prod can be slower than local preview).
  await page.waitForTimeout(4000);

  expect(
    pageErrors,
    `Uncaught page errors: ${pageErrors.join('\n')}`,
  ).toEqual([]);

  await expect(page.locator('#energy-meter')).toBeVisible({ timeout: 45_000 });

  const badConsole = consoleFailures.filter(
    (t) =>
      t.includes('useCurrentReadiness') ||
      t.includes('ReferenceError') ||
      t.includes('is not defined'),
  );
  expect(
    badConsole,
    `Console errors: ${badConsole.join('\n')}`,
  ).toEqual([]);
});
