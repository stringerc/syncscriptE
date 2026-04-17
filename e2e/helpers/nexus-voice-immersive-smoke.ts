/**
 * Shared steps for immersive App AI voice E2E (prod): entry click + shell/rail assertions.
 * Timeouts tunable via env for slow CI / lazy VoiceConversationEngine chunk.
 */
import { expect, type Page } from '@playwright/test';

const shellAfterClickMs = () =>
  Number(process.env.NEXUS_E2E_VOICE_SHELL_AFTER_CLICK_MS || 120_000);

/**
 * Opens immersive voice from App AI.
 * Prefer the **composer footer** Voice control (single stable target). Empty-state duplicates
 * share the same testid; `:visible` + `nth(last)` was flaky against overflow/stacking on prod.
 * Falls back to visible testid / aria-label for older deploys.
 */
export async function clickImmersiveVoiceEntry(page: Page): Promise<void> {
  const composer = page.getByRole('textbox', { name: /Message to Nexus/i });
  await composer.waitFor({ state: 'visible', timeout: 45_000 });

  const footerVoice = composer
    .locator('xpath=ancestor::div[contains(@class,"border-t")][1]')
    .getByTestId('nexus-app-ai-open-immersive-voice');

  if ((await footerVoice.count()) > 0) {
    const btn = footerVoice.first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ timeout: 30_000 });
  } else {
    const byTestId = page
      .getByTestId('nexus-app-ai-open-immersive-voice')
      .and(page.locator(':visible'));
    const tidCount = await byTestId.count();
    if (tidCount > 0) {
      const btn = tidCount > 1 ? byTestId.nth(tidCount - 1) : byTestId.first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click({ force: true, timeout: 30_000 });
    } else {
      const voice = page.locator(
        '[aria-label="Voice — conversational AI (live speech and replies)"]',
      );
      const n = await voice.count();
      const target = n > 1 ? voice.nth(n - 1) : voice.first();
      await target.scrollIntoViewIfNeeded();
      await target.click({ force: true, timeout: 30_000 });
    }
  }

  /** Portal root mounts synchronously with `showVoiceEngine`; same node as `data-voice-shell="immersive"`. */
  await page.getByTestId('nexus-voice-immersive-overlay').waitFor({
    state: 'visible',
    timeout: shellAfterClickMs(),
  });
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

  const shell = page.getByTestId('nexus-voice-immersive-overlay');
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

  /** Rail mounts inside the immersive overlay (same chunk as `NexusVoiceArtifactRail`). */
  const rail = page
    .getByTestId('nexus-voice-immersive-overlay')
    .getByTestId('nexus-voice-artifact-rail');
  await expect(rail).toBeAttached({ timeout: railMs });
}
