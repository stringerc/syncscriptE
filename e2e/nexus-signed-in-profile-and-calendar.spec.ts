/**
 * Signed-in prod/local smoke: Supabase Edge profile fetch (CORS + 200) and
 * Nexus text chat uses propose_calendar_hold for a calendar-style request (not create_task).
 *
 * Credentials: E2E_LOGIN_EMAIL + E2E_LOGIN_PASSWORD, or NEXUS_LIVE_TEST_EMAIL + NEXUS_LIVE_TEST_PASSWORD.
 * Bootstrap once: npm run bootstrap:nexus-verify-user (needs SUPABASE_SERVICE_ROLE_KEY in .env).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';

const { email, password } = getNexusE2ECredentials();

type ToolTraceEntry = { tool?: string; ok?: boolean; error?: string };

function parseToolTrace(body: unknown): ToolTraceEntry[] {
  if (!body || typeof body !== 'object') return [];
  const t = (body as { toolTrace?: unknown }).toolTrace;
  return Array.isArray(t) ? (t as ToolTraceEntry[]) : [];
}

async function loginAndOpenAppAI(page: import('@playwright/test').Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const acceptCookies = page.getByRole('button', { name: /Accept All Cookies/i });
  if (await acceptCookies.isVisible({ timeout: 5000 }).catch(() => false)) {
    await acceptCookies.click();
  }

  const profileWait = page.waitForResponse(
    (r) =>
      r.url().includes('make-server-57781ad9/user/profile') &&
      r.request().method() === 'GET',
    { timeout: 90_000 },
  );

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/ }).click();

  const profileRes = await profileWait;
  await expect(page).not.toHaveURL(/\/login/, { timeout: 60_000 });
  return profileRes;
}

test.describe('Signed-in profile + Nexus calendar tool', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env (see bootstrap:nexus-verify-user)');

  test('Edge GET /user/profile returns 200 after login', async ({ page }) => {
    test.setTimeout(120_000);
    const profileRes = await loginAndOpenAppAI(page);
    expect(
      profileRes.ok(),
      `profile HTTP ${profileRes.status()} — check Edge CORS allowHeaders includes apikey`,
    ).toBeTruthy();
    const acao = profileRes.headers()['access-control-allow-origin'];
    if (acao) {
      expect(acao === '*' || acao.includes('syncscript'), acao).toBeTruthy();
    }
  });

  test('App AI chat: calendar hold uses propose_calendar_hold in toolTrace', async ({ page }) => {
    test.setTimeout(300_000);

    await loginAndOpenAppAI(page);

    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    const composer = page.getByRole('textbox', { name: /Message to Nexus/i });
    await expect(composer).toBeVisible({ timeout: 30_000 });

    const unique = `E2E Cal Hold ${Date.now()}`;
    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 270_000 },
    );

    await composer.fill(
      `Schedule a calendar time block titled "${unique}" for 30 minutes starting tomorrow at 4:00 PM local time. ` +
        `Call propose_calendar_hold with title, start_iso, and duration_minutes (calendar hold, not a generic todo).`,
    );
    await composer.press('Enter');

    const response = await nexusResp;
    expect(response.ok(), `nexus-user HTTP ${response.status()}`).toBeTruthy();
    const body = await response.json().catch(() => ({}));
    const trace = parseToolTrace(body);

    const holdOk = trace.some((t) => t?.tool === 'propose_calendar_hold' && t?.ok === true);

    expect(
      holdOk,
      `Expected at least one propose_calendar_hold with ok:true in toolTrace, got: ${JSON.stringify(trace)}`,
    ).toBe(true);
    // Note: the LLM may also call create_task in the same multi-round loop despite instructions;
    // we only require a successful calendar hold trace for regression on propose_calendar_hold.
  });
});
