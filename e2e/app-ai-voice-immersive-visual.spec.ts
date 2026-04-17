/**
 * Immersive Voice: after login, Voice opens overlay; minimal circle hero + artifact rail mount.
 * Screenshots optional — see parity-deep spec for same UI assertions.
 * Requires E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD (or NEXUS_LIVE_TEST_*).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';
import {
  clickImmersiveVoiceEntry,
  assertImmersiveVoiceShell,
} from './helpers/nexus-voice-immersive-smoke';

const { email, password } = getNexusE2ECredentials();

test.describe('App AI immersive voice visualizer', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD or NEXUS_LIVE_TEST_* in .env');

  test('Voice overlay shows orb + immersive main + artifact rail (screenshot)', async ({ page, context }, testInfo) => {
    test.skip(
      process.env.GITHUB_ACTIONS === 'true' && process.env.NEXUS_E2E_INCLUDE_VOICE !== '1',
      'Same as deep parity: opt-in with repository secret NEXUS_E2E_INCLUDE_VOICE=1 on GitHub Actions.',
    );
    test.setTimeout(120_000);
    await context.grantPermissions(['microphone']);

    await loginToSyncScript(page, email, password);
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({ timeout: 30_000 });

    await clickImmersiveVoiceEntry(page);
    await assertImmersiveVoiceShell(page, {
      shellTimeoutMs: 60_000,
      closeTimeoutMs: 30_000,
      startTimeoutMs: 45_000,
      railTimeoutMs: 15_000,
    });

    const shot = testInfo.outputPath('voice-immersive-overlay.png');
    await page.screenshot({ path: shot, fullPage: true });
  });
});
