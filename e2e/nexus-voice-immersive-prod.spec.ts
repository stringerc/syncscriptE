/**
 * Voice-only prod E2E: first-touch surface before phone call — immersive shell + artifact rail.
 * Run locally or via workflow "E2E Nexus voice immersive (prod)" (longer timeouts than deep parity).
 *
 * Credentials: E2E_LOGIN_* or NEXUS_LIVE_TEST_* (bootstrap:nexus-verify-user).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';
import {
  clickImmersiveVoiceEntry,
  assertImmersiveVoiceShell,
} from './helpers/nexus-voice-immersive-smoke';

const { email, password } = getNexusE2ECredentials();

test.describe('Nexus immersive voice (prod)', () => {
  test.describe.configure({ retries: 2 });

  test.skip(!email || !password, 'Set E2E_LOGIN_* or NEXUS_LIVE_TEST_* in .env');

  test('overlay + orb + artifact rail', async ({ page, context }) => {
    test.setTimeout(360_000);
    await context.grantPermissions(['microphone']);

    await loginToSyncScript(page, email, password);
    /** Canonical signed-in path: AppLayout + AppAIPage (same as chat parity); `/ai` is alternate shell. */
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({
      timeout: 45_000,
    });
    /** Fails fast if deploy lacks `data-testid` on immersive Voice buttons (`AppAIPage`). */
    await expect(page.getByTestId('nexus-app-ai-open-immersive-voice').first()).toBeVisible({
      timeout: 45_000,
    });

    await clickImmersiveVoiceEntry(page);
    await assertImmersiveVoiceShell(page);
  });
});
