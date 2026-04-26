/**
 * Smoke: signed-in App AI composer — Voice overlay, dictation mic, message field.
 * Runs against local vite preview or PLAYWRIGHT_BASE_URL (no nexus-user API assertion).
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadDotEnv() {
  const p = join(process.cwd(), '.env');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotEnv();

const email =
  process.env.E2E_LOGIN_EMAIL?.trim() ||
  process.env.NEXUS_LIVE_TEST_EMAIL?.trim() ||
  '';
const password =
  process.env.E2E_LOGIN_PASSWORD?.trim() ||
  process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() ||
  '';

test.describe('App AI composer UI', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD or NEXUS_LIVE_TEST_* in .env');

  test('shows Voice, dictation mic, and composer after login', async ({ page }) => {
    test.setTimeout(120_000);

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

    await expect(page.getByRole('textbox', { name: /Message to Nexus/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: /Call Nexus — full voice session/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Voice — conversational AI/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Dictate with microphone/i })).toBeVisible();
  });
});
