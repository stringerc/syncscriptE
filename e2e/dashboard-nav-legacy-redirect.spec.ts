import { test, expect } from '@playwright/test';

/** Same guest bootstrap as dashboard-nav.spec.ts */
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

test('legacy /dashboard/tasks URL redirects to /tasks (header search / bookmarks)', async ({ page }) => {
  await page.goto('/dashboard/tasks', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/tasks$/);
});
