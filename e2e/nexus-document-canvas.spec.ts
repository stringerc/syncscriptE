/**
 * E2E: sign in → AI tab → ask Nexus to create a document → verify canvas opens with content.
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

test.describe('Nexus Document Canvas', () => {
  test.skip(!email || !password, 'Set login credentials in .env');

  test('ask Nexus to create a letter → canvas opens with editable content', async ({ page }) => {
    test.setTimeout(180_000);

    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const acceptCookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await acceptCookies.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptCookies.click();
    }
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    // Navigate to AI tab
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible({ timeout: 30_000 });

    // Intercept the API response
    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );

    // Ask Nexus to create a document
    await page.getByPlaceholder('Type a message...').fill(
      'Create a short professional thank you letter to a client for their business. Use [Client Name] and [Company Name] as placeholders.',
    );
    await page.getByPlaceholder('Type a message...').press('Enter');

    // Wait for API response and verify create_document was called
    const response = await nexusResp;
    expect(response.ok(), `nexus-user HTTP ${response.status()}`).toBeTruthy();
    const body = await response.json().catch(() => ({}));
    const trace = (body as { toolTrace?: Array<{ tool?: string; ok?: boolean; detail?: any }> }).toolTrace;
    const docTrace = Array.isArray(trace) && trace.find((t) => t?.tool === 'create_document' && t?.ok);
    expect(docTrace, `Expected create_document in toolTrace: ${JSON.stringify(trace)}`).toBeTruthy();

    // Verify the Document Canvas panel opened
    const canvas = page.locator('.ProseMirror');
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Verify the canvas has content (not empty)
    const editorText = await canvas.textContent();
    expect(editorText!.length).toBeGreaterThan(50);

    // Verify title input is visible and has a value
    const titleInput = page.locator('input[placeholder="Untitled document"]');
    await expect(titleInput).toBeVisible();
    const titleValue = await titleInput.inputValue();
    expect(titleValue.length).toBeGreaterThan(0);

    // Verify export buttons are visible
    await expect(page.getByRole('button', { name: /PDF/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /DOCX/ })).toBeVisible();

    // Verify the editor is editable — type something
    await canvas.click();
    await page.keyboard.press('End');
    await page.keyboard.type('\n\nE2E test edit was here.');
    const updatedText = await canvas.textContent();
    expect(updatedText).toContain('E2E test edit was here');

    // Verify the "Open document" button appears on the assistant message
    const openBtn = page.getByRole('button', { name: /Open "/ });
    await expect(openBtn).toBeVisible({ timeout: 5_000 });

    // Close the canvas (exact match avoids cookie banner Close)
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(canvas).not.toBeVisible({ timeout: 5_000 });

    // Re-open from the message button
    await openBtn.click();
    await expect(page.locator('.ProseMirror')).toBeVisible({ timeout: 5_000 });
  });
});
