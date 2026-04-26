/**
 * Signed-in voice (classic shell): same API as immersive — `postNexusUserVoiceTurn` → `/api/ai/nexus-user`.
 * Classic mode exposes text input (toggle) so we can assert toolTrace without Web Speech.
 *
 * Credentials: E2E_LOGIN_* or NEXUS_LIVE_TEST_* (see bootstrap:nexus-verify-user).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';
import { parseToolTrace, hasToolOk } from './helpers/nexus-tool-trace';

const { email, password } = getNexusE2ECredentials();

test.describe('Nexus classic voice — create_task via voice API', () => {
  /** Align with chat parity — transient nexus-user 500 on cold/tool loop. */
  test.describe.configure({ retries: 2 });

  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env');

  test('Call Nexus (classic) + text → nexus-user + create_task', async ({ page, context }) => {
    test.setTimeout(300_000);
    await context.grantPermissions(['microphone']);

    await loginToSyncScript(page, email, password);
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({ timeout: 45_000 });

    const callNexus = page.getByRole('button', { name: /Call Nexus — full voice session/i }).first();
    await expect(callNexus).toBeVisible({ timeout: 15_000 });
    await callNexus.click();

    await page.getByTestId('nexus-voice-classic-overlay').waitFor({ state: 'visible', timeout: 120_000 });
    await page.getByTestId('voice-conversation-engine-root').waitFor({ state: 'visible', timeout: 120_000 });

    await page.getByRole('button', { name: /Toggle text input/i }).click();
    const voiceText = page.getByPlaceholder('Type a message...');
    await expect(voiceText).toBeVisible({ timeout: 15_000 });

    const ts = Date.now();
    const prompt = `Create a task titled "E2E voice classic ${ts}" with priority medium. Use create_task.`;

    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 270_000 },
    );

    const overlay = page.getByTestId('nexus-voice-classic-overlay');
    await voiceText.fill(prompt);
    await overlay.getByRole('button', { name: /^Send message$/ }).click();

    const response = await nexusResp;
    const errBody = await response.text().catch(() => '');
    expect(response.ok(), `nexus-user HTTP ${response.status()} ${errBody.slice(0, 400)}`).toBeTruthy();

    const body = JSON.parse(errBody || '{}');
    const trace = parseToolTrace(body);
    expect(hasToolOk(trace, 'create_task'), JSON.stringify({ toolTrace: trace })).toBe(true);
  });
});
