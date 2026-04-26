/**
 * E2E: verify /ai route (dashboard sidebar AI button) has document canvas.
 * This was the broken route — it used to load AIAssistantPage (OpenClaw) instead of AppAIPage.
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[k] === undefined) process.env[k] = v;
  }
}
loadDotEnv();

const email = process.env.E2E_LOGIN_EMAIL?.trim() || process.env.NEXUS_LIVE_TEST_EMAIL?.trim() || '';
const password = process.env.E2E_LOGIN_PASSWORD?.trim() || process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() || '';

test.describe('Document Canvas on /ai route', () => {
  test.skip(!email || !password, 'Set login credentials in .env');

  test('create invoice via /ai route → canvas opens', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const cookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await cookies.isVisible({ timeout: 3000 }).catch(() => false)) await cookies.click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    // Navigate to /ai (the dashboard sidebar route the user clicks)
    await page.goto('/ai', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible({ timeout: 30_000 });

    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );

    await page.getByPlaceholder('Type a message...').fill(
      'Create an example invoice in the canvas feature for freelance design work totaling $2,000',
    );
    await page.getByPlaceholder('Type a message...').press('Enter');

    const response = await nexusResp;
    expect(response.ok()).toBeTruthy();
    const body = await response.json().catch(() => ({}));
    const trace = (body as any).toolTrace || [];
    const docTrace = trace.find((t: any) => t?.tool === 'create_document' && t?.ok);
    expect(docTrace, `create_document must be in toolTrace`).toBeTruthy();

    const canvas = page.locator('.ProseMirror');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    
    const text = await canvas.textContent();
    expect(text!.length).toBeGreaterThan(50);

    await expect(page.getByRole('button', { name: /PDF/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /DOCX/ })).toBeVisible();

    await page.screenshot({ path: 'test-results/10-ai-route-canvas.png', fullPage: false });
  });
});
