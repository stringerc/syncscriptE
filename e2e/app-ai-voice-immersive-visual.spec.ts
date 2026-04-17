/**
 * Immersive Voice: after login, Voice opens overlay; minimal circle hero + artifact rail mount.
 * Screenshots optional — see parity-deep spec for same UI assertions.
 * Requires E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD (or NEXUS_LIVE_TEST_*).
 */
import { test, expect } from '@playwright/test';
import { getNexusE2ECredentials } from './helpers/nexus-e2e-env';
import { loginToSyncScript } from './helpers/nexus-app-ai-login';

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
    await page.goto('/ai', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /Voice — conversational AI/i }).first().click();

    await expect(page.locator('[data-voice-shell="immersive"]').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /^Close voice$/ })).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole('button', { name: /Start voice session/ }).or(page.getByRole('img', { name: /Voice level/ })),
    ).toBeVisible({ timeout: 45_000 });
    const rail = page
      .locator('[data-testid="nexus-voice-artifact-rail"]')
      .or(page.getByLabel('Nexus voice tool confirmations'));
    await expect(rail.first()).toBeAttached({ timeout: 15_000 });

    const shot = testInfo.outputPath('voice-immersive-overlay.png');
    await page.screenshot({ path: shot, fullPage: true });
  });
});
