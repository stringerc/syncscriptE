/**
 * Shared steps for immersive App AI voice E2E (prod): entry click + shell/rail assertions.
 * Timeouts tunable via env for slow CI / lazy VoiceConversationEngine chunk.
 */
import { expect, type Page } from '@playwright/test';

/**
 * Opens immersive voice from App AI. Prefer stable `data-testid` (composer + empty states);
 * fall back to aria-label for older deploys.
 */
export async function clickImmersiveVoiceEntry(page: Page): Promise<void> {
  const byTestId = page.getByTestId('nexus-app-ai-open-immersive-voice');
  const tidCount = await byTestId.count();
  if (tidCount > 0) {
    const btn = byTestId.nth(tidCount - 1);
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 30_000 });
    return;
  }
  const voice = page.locator(
    '[aria-label="Voice — conversational AI (live speech and replies)"]',
  );
  const n = await voice.count();
  const target = n > 1 ? voice.nth(n - 1) : voice.first();
  await target.scrollIntoViewIfNeeded();
  await target.click({ timeout: 30_000 });
}

export async function assertImmersiveVoiceShell(
  page: Page,
  options?: {
    shellTimeoutMs?: number;
    closeTimeoutMs?: number;
    startTimeoutMs?: number;
    railTimeoutMs?: number;
  },
): Promise<void> {
  const shellMs =
    options?.shellTimeoutMs ??
    Number(process.env.NEXUS_E2E_VOICE_SHELL_MS || 120_000);
  const closeMs =
    options?.closeTimeoutMs ??
    Number(process.env.NEXUS_E2E_VOICE_CLOSE_MS || 45_000);
  const startMs =
    options?.startTimeoutMs ??
    Number(process.env.NEXUS_E2E_VOICE_START_MS || 90_000);
  const railMs =
    options?.railTimeoutMs ??
    Number(process.env.NEXUS_E2E_VOICE_RAIL_MS || 20_000);

  const shell = page.locator('[data-voice-shell="immersive"]').first();
  await expect(shell).toBeVisible({
    timeout: shellMs,
  });
  await expect(page.getByRole('button', { name: /^Close voice$/ })).toBeVisible({
    timeout: closeMs,
  });
  await expect(
    page
      .getByRole('button', { name: /Start voice session/ })
      .or(page.getByRole('img', { name: /Voice level/ })),
  ).toBeVisible({ timeout: startMs });

  const rail = page
    .locator('[data-testid="nexus-voice-artifact-rail"]')
    .or(page.getByLabel('Nexus voice tool confirmations'));
  await expect(rail.first()).toBeAttached({ timeout: railMs });
}
