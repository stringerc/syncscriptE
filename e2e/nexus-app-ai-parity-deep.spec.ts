/**
 * Deep signed-in parity: isolated sessions per tool (avoids huge multi-turn context → nexus-user 500).
 * Voice shell: lazy-loaded engine — wait for loading shell to clear, then assert immersive overlay + artifact rail.
 *
 * Credentials: E2E_LOGIN_* or NEXUS_LIVE_TEST_* (see bootstrap:nexus-verify-user).
 * Concierge / enqueue_playbook: not covered (needs stable playbook slug + worker); see contract tests.
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';
import { parseToolTrace, hasToolOk, hasToolCalled } from './helpers/nexus-tool-trace';
import {
  clickImmersiveVoiceEntry,
  assertImmersiveVoiceShell,
} from './helpers/nexus-voice-immersive-smoke';

const { email, password } = getNexusE2ECredentials();

async function postNexusChatMessage(
  page: import('@playwright/test').Page,
  composer: import('@playwright/test').Locator,
  text: string,
): Promise<unknown> {
  const respP = page.waitForResponse(
    (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
    { timeout: 270_000 },
  );
  await composer.fill(text);
  await composer.press('Enter');
  const res = await respP;
  const errText = await res.text().catch(() => '');
  expect(
    res.ok(),
    `nexus-user HTTP ${res.status()} body: ${errText.slice(0, 500)}`,
  ).toBeTruthy();
  try {
    return JSON.parse(errText);
  } catch {
    return {};
  }
}

async function openAppAIComposer(page: import('@playwright/test').Page) {
  await loginToSyncScript(page, email, password);
  await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
  const composer = page.getByRole('textbox', { name: /Message to Nexus/i });
  await expect(composer).toBeVisible({ timeout: 30_000 });
  return composer;
}

test.describe('Nexus App AI parity (deep)', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env (see bootstrap:nexus-verify-user)');

  test('chat: create_task in toolTrace', async ({ page }) => {
    test.setTimeout(300_000);
    const composer = await openAppAIComposer(page);
    const ts = Date.now();
    const body = await postNexusChatMessage(
      page,
      composer,
      `Create a task titled "E2E deep task ${ts}" with priority medium. Use create_task.`,
    );
    const trace = parseToolTrace(body);
    expect(hasToolOk(trace, 'create_task'), JSON.stringify(trace)).toBe(true);
  });

  test('chat: propose_calendar_hold in toolTrace', async ({ page }) => {
    test.setTimeout(300_000);
    const composer = await openAppAIComposer(page);
    const ts = Date.now();
    const body = await postNexusChatMessage(
      page,
      composer,
      `Schedule a 30-minute calendar hold titled "E2E deep cal ${ts}" tomorrow at 3:00 PM local time. Use propose_calendar_hold with title, start_iso, duration_minutes.`,
    );
    const trace = parseToolTrace(body);
    expect(hasToolOk(trace, 'propose_calendar_hold'), JSON.stringify(trace)).toBe(true);
  });

  test('chat: create_document in toolTrace', async ({ page }) => {
    test.setTimeout(300_000);
    const composer = await openAppAIComposer(page);
    const ts = Date.now();
    const body = await postNexusChatMessage(
      page,
      composer,
      `Use create_document to write a very short letter titled "E2E deep doc ${ts}" — two sentences about weekly planning. Put full Markdown in the tool (title + content).`,
    );
    const trace = parseToolTrace(body);
    expect(hasToolOk(trace, 'create_document'), JSON.stringify(trace)).toBe(true);
  });

  test('chat: search_places invoked in toolTrace', async ({ page }) => {
    test.skip(
      process.env.NEXUS_E2E_SKIP_PLACES === '1' ||
        (process.env.GITHUB_ACTIONS === 'true' && process.env.NEXUS_E2E_INCLUDE_PLACES !== '1'),
      'Opt-in on GitHub Actions: NEXUS_E2E_INCLUDE_PLACES=1. Local npm run includes this test; set NEXUS_E2E_SKIP_PLACES=1 to skip.',
    );
    test.setTimeout(300_000);
    const composer = await openAppAIComposer(page);
    const body = await postNexusChatMessage(
      page,
      composer,
      `Call search_places with query "coffee shops in Seattle Washington" and summarize one result.`,
    );
    const trace = parseToolTrace(body);
    expect(hasToolCalled(trace, 'search_places'), JSON.stringify(trace)).toBe(true);
  });

  test('immersive voice: overlay + orb + artifact rail', async ({ page, context }) => {
    test.skip(
      process.env.GITHUB_ACTIONS === 'true' && process.env.NEXUS_E2E_INCLUDE_VOICE !== '1',
      'Opt-in on GitHub Actions: set repository secret NEXUS_E2E_INCLUDE_VOICE=1 (mic + lazy chunk timing vary on runners). Run locally with npm run test:e2e:nexus-app-ai-parity-deep.',
    );
    test.setTimeout(180_000);
    await context.grantPermissions(['microphone']);

    await loginToSyncScript(page, email, password);
    /** AppLayout + AppAIPage — same surface as chat tests (`/app/ai-assistant`). */
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({ timeout: 30_000 });

    await clickImmersiveVoiceEntry(page);
    await assertImmersiveVoiceShell(page, {
      shellTimeoutMs: 90_000,
      closeTimeoutMs: 30_000,
      startTimeoutMs: 60_000,
      railTimeoutMs: 15_000,
    });
  });
});
