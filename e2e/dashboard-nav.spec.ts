import { test, expect } from '@playwright/test';

/**
 * Regression: leaving /tasks via sidebar must change the URL (RR Outlet shell).
 * Uses dev-guest localStorage shape from AuthContext (no real Supabase session).
 */
const GUEST_SESSION = {
  token: 'e2e-playwright-mock-token',
  user: {
    id: 'guest_e2e_dashboard_nav',
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

test('from /tasks, sidebar navigates to /dashboard and /calendar', async ({ page }) => {
  await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/tasks$/);
  // Projects OS mounts heavy lazy chunks; wait so clicks are not lost to loading/teardown.
  await expect(page.getByRole('tablist', { name: 'Projects OS sections' })).toBeVisible({
    timeout: 20_000,
  });

  const rail = page.locator('#app-sidebar-rail');
  await rail.locator('[data-nav="sidebar-dashboard"]').click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(page.getByRole('tablist', { name: 'Projects OS sections' })).toBeVisible({
    timeout: 20_000,
  });

  await rail.locator('[data-nav="sidebar-calendar"]').click();
  await expect(page).toHaveURL(/\/calendar$/);
});

test('from /dashboard, sidebar navigates to /tasks', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator('#app-sidebar-rail').locator('[data-nav="sidebar-tasks"]').click();
  await expect(page).toHaveURL(/\/tasks$/);
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('from /tasks, bottom nav Home navigates to /dashboard', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tablist', { name: 'Projects OS sections' })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator('#app-sidebar-rail')).toBeHidden();

    await page.locator('#syncscript-mobile-bottom-nav').getByRole('button', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('from /tasks, bottom nav Calendar navigates to /calendar', async ({ page }) => {
    await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tablist', { name: 'Projects OS sections' })).toBeVisible({
      timeout: 20_000,
    });
    await page.locator('#syncscript-mobile-bottom-nav').getByRole('button', { name: 'Calendar' }).click();
    await expect(page).toHaveURL(/\/calendar$/);
  });
});
