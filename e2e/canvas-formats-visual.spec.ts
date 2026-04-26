import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function loadDotEnv() { const p = join(process.cwd(), '.env'); if (!existsSync(p)) return; for (const line of readFileSync(p, 'utf8').split('\n')) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const eq = t.indexOf('='); if (eq <= 0) continue; const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); if (process.env[k] === undefined) process.env[k] = v; } }
loadDotEnv();
const email = process.env.E2E_LOGIN_EMAIL?.trim() || process.env.NEXUS_LIVE_TEST_EMAIL?.trim() || '';
const password = process.env.E2E_LOGIN_PASSWORD?.trim() || process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() || '';

test.describe('Canvas Formats + Voice', () => {
  test.skip(!email || !password, 'Set credentials');

  test('spreadsheet renders as grid, Voice button visible', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const c = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await c.isVisible({ timeout: 3000 }).catch(() => false)) await c.click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.goto('/ai', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Type a message…')).toBeVisible({ timeout: 30_000 });

    const voiceBtn = page.getByRole('button', { name: /Voice — conversational AI/i });
    await expect(voiceBtn).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: 'test-results/11-voice-button.png', fullPage: false });

    // Ask for a spreadsheet
    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );
    await page.getByPlaceholder('Type a message…').fill('Create an expense tracker spreadsheet with Month, Rent, Food, Transport, Total columns and 4 months of data');
    await page.getByPlaceholder('Type a message…').press('Enter');

    const response = await nexusResp;
    const body = await response.json().catch(() => ({}));
    const trace = (body as any).toolTrace || [];
    const docTrace = trace.find((t: any) => t?.tool === 'create_document' && t?.ok);
    expect(docTrace).toBeTruthy();
    expect(docTrace.detail?.format).toBe('spreadsheet');

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/12-spreadsheet-canvas.png', fullPage: false });

    // Verify it's a spreadsheet grid (react-spreadsheet renders with Spreadsheet class)
    const spreadsheet = page.locator('.Spreadsheet');
    const isSpreadsheet = await spreadsheet.isVisible({ timeout: 5_000 }).catch(() => false);

    // Verify XLSX and CSV export buttons
    const xlsxBtn = page.getByText('XLSX');
    const csvBtn = page.getByText('CSV');
    const xlsxVisible = await xlsxBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const csvVisible = await csvBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    console.log('Spreadsheet grid visible:', isSpreadsheet);
    console.log('XLSX button:', xlsxVisible);
    console.log('CSV button:', csvVisible);

    expect(isSpreadsheet, 'Spreadsheet grid must render').toBe(true);
    expect(xlsxVisible, 'XLSX export must be visible').toBe(true);
    expect(csvVisible, 'CSV export must be visible').toBe(true);
  });
});
