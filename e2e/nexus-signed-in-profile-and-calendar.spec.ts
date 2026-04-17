/**
 * Signed-in prod/local smoke: Supabase Edge profile fetch (CORS + 200) and
 * Nexus text chat uses propose_calendar_hold for a calendar-style request (not create_task).
 *
 * Credentials: E2E_LOGIN_EMAIL + E2E_LOGIN_PASSWORD, or NEXUS_LIVE_TEST_EMAIL + NEXUS_LIVE_TEST_PASSWORD.
 * Bootstrap once: npm run bootstrap:nexus-verify-user (needs SUPABASE_SERVICE_ROLE_KEY in .env).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';
import { parseToolTrace } from './helpers/nexus-tool-trace';

const { email, password } = getNexusE2ECredentials();

test.describe('Signed-in profile + Nexus calendar tool', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env (see bootstrap:nexus-verify-user)');

  test('Edge GET /user/profile returns 200 after login', async ({ page }) => {
    test.setTimeout(120_000);
    const { profileResponse: profileRes } = await loginToSyncScript(page, email, password);
    expect(profileRes, 'profile response').toBeTruthy();
    expect(
      profileRes!.ok(),
      `profile HTTP ${profileRes!.status()} — check Edge CORS allowHeaders includes apikey`,
    ).toBeTruthy();
    const acao = profileRes!.headers()['access-control-allow-origin'];
    if (acao) {
      expect(acao === '*' || acao.includes('syncscript'), acao).toBeTruthy();
    }
  });

  test('App AI chat: calendar hold uses propose_calendar_hold in toolTrace', async ({ page }) => {
    test.setTimeout(300_000);

    await loginToSyncScript(page, email, password);

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
