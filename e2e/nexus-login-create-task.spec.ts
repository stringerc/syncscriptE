/**
 * E2E: sign in → App Nexus chat → ask to create a task → confirm toast or tasks UI.
 * Credentials: E2E_LOGIN_EMAIL + E2E_LOGIN_PASSWORD, or NEXUS_LIVE_TEST_EMAIL + NEXUS_LIVE_TEST_PASSWORD (from .env).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';

const { email, password } = getNexusE2ECredentials();

const uniqueTitle = `E2E Nexus task ${Date.now()}`;

test.describe('Nexus create task after login', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD or NEXUS_LIVE_TEST_* in .env');

  test('login, ask Nexus to create a task, see confirmation', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const acceptCookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await acceptCookies.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptCookies.click();
    }

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 });

    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    const composer = page.getByRole('textbox', { name: /Message to Nexus/i });
    await expect(composer).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Call Nexus — full voice session/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice — conversational AI/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Dictate with microphone/i })).toBeVisible();

    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );

    await composer.fill(
      `Create a task titled "${uniqueTitle}" with priority medium. Use your tools to save it.`,
    );
    await composer.press('Enter');

    const response = await nexusResp;
    expect(response.ok(), `nexus-user HTTP ${response.status()}`).toBeTruthy();
    const body = await response.json().catch(() => ({}));
    const trace = (body as { toolTrace?: Array<{ tool?: string; ok?: boolean }> }).toolTrace;
    const created = Array.isArray(trace) && trace.some((t) => t?.tool === 'create_task' && t?.ok);
    expect(created, JSON.stringify({ toolTrace: trace })).toBe(true);

    await page.goto('/tasks?tab=tasks', { waitUntil: 'domcontentloaded' });
    await page
      .waitForResponse(
        (r) => r.url().includes('make-server-57781ad9/tasks') && r.request().method() === 'GET' && r.ok(),
        { timeout: 45_000 },
      )
      .catch(() => null);
    await expect(page.getByText(uniqueTitle, { exact: false })).toBeVisible({ timeout: 60_000 });
  });
});
