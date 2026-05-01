/**
 * Signed-in (non-guest) smoke against live Supabase Edge productivity routes:
 * - GET /activity/summary (profile heatmap on Team → Individual)
 * - PAT create + revoke (Settings → Privacy → CursorPatTokensCard)
 * - GET /friends/activity-feed (AI sidebar → Social → Friends strip)
 *
 * Credentials: same as other signed-in E2E — E2E_LOGIN_EMAIL + E2E_LOGIN_PASSWORD
 * or NEXUS_LIVE_TEST_EMAIL + NEXUS_LIVE_TEST_PASSWORD in repo-root `.env`.
 *
 * Run (prod):
 *   npm run test:e2e:signed-in-productivity
 *
 * Local preview:
 *   CI=true npm run build && npx vite preview --port 4173 --strictPort --host 127.0.0.1 &
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173 npm run test:e2e:signed-in-productivity
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';

const { email, password } = getNexusE2ECredentials();

async function dismissFloatingChecklistIfPresent(page: import('@playwright/test').Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Dismiss checklist/i });
  if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await btn.click();
  }
}

test.describe('Signed-in productivity Edge (PAT, heatmap, friend feed)', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env');

  test('Team individual profile loads activity heatmap (GET /activity/summary)', async ({ page }) => {
    test.setTimeout(120_000);
    await loginToSyncScript(page, email, password);
    await dismissFloatingChecklistIfPresent(page);

    const summary = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9') &&
        r.url().includes('/activity/summary') &&
        r.request().method() === 'GET',
      { timeout: 60_000 },
    );

    await page.goto('/team?view=individual', { waitUntil: 'domcontentloaded' });
    const res = await summary;
    expect(res.ok(), `activity/summary HTTP ${res.status()}`).toBeTruthy();

    const card = page.getByTestId('profile-activity-heatmap-card');
    await expect(card).toBeVisible({ timeout: 30_000 });
    const grid = page.getByTestId('profile-activity-heatmap-grid');
    await expect(grid).toBeVisible();
    await expect(grid.locator('.rounded-sm').first()).toBeVisible();
  });

  test('Settings Privacy: create PAT then revoke (POST + DELETE /api-tokens)', async ({ page }) => {
    test.setTimeout(120_000);
    await loginToSyncScript(page, email, password);
    await dismissFloatingChecklistIfPresent(page);

    const listWait = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9') &&
        r.url().includes('/api-tokens') &&
        !r.url().includes('/api-tokens/') &&
        r.request().method() === 'GET',
      { timeout: 60_000 },
    );

    await page.goto('/settings?tab=privacy', { waitUntil: 'domcontentloaded' });
    const listRes = await listWait;
    expect(listRes.ok(), `list api-tokens HTTP ${listRes.status()}`).toBeTruthy();

    const createBtn = page.getByTestId('cursor-pat-create-token');
    await expect(createBtn).toBeVisible({ timeout: 30_000 });

    const postWait = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9') &&
        r.url().includes('/api-tokens') &&
        r.request().method() === 'POST',
      { timeout: 60_000 },
    );

    await createBtn.click();
    const postRes = await postWait;
    expect(postRes.ok(), `create PAT HTTP ${postRes.status()}`).toBeTruthy();
    const body = (await postRes.json().catch(() => ({}))) as { id?: string };
    expect(body.id, 'POST response should include token id').toBeTruthy();

    const revoke = page.getByTestId(`cursor-pat-revoke-${body.id}`);
    await expect(revoke).toBeVisible({ timeout: 15_000 });

    const delWait = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9') &&
        r.url().includes('/api-tokens/') &&
        r.request().method() === 'DELETE',
      { timeout: 60_000 },
    );
    await revoke.click();
    const delRes = await delWait;
    expect(delRes.ok(), `revoke PAT HTTP ${delRes.status()}`).toBeTruthy();
  });

  test('AI sidebar Social → Friends loads friend activity feed (GET /friends/activity-feed)', async ({ page }) => {
    test.setTimeout(120_000);
    await loginToSyncScript(page, email, password);
    await dismissFloatingChecklistIfPresent(page);

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    const toggle = page.getByRole('button', { name: /Open Chat Assistant/i });
    await expect(toggle).toBeVisible({ timeout: 30_000 });
    await toggle.click();

    const panel = page.getByTestId('ai-assistant-panel');
    await expect(panel).toBeVisible({ timeout: 15_000 });

    const feedWait = page.waitForResponse(
      (r) =>
        r.url().includes('make-server-57781ad9') &&
        r.url().includes('/friends/activity-feed') &&
        r.request().method() === 'GET',
      { timeout: 60_000 },
    );

    await panel.getByRole('tab', { name: 'Social' }).click();
    await panel.getByRole('tab', { name: 'Friends' }).click();

    const feedRes = await feedWait;
    expect(feedRes.ok(), `friends/activity-feed HTTP ${feedRes.status()}`).toBeTruthy();

    const strip = page.getByTestId('friends-activity-feed-panel');
    await expect(strip).toBeVisible({ timeout: 15_000 });
    await expect(strip.getByText(/Friend activity/i)).toBeVisible();
  });
});
