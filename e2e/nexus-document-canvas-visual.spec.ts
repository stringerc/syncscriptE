/**
 * Visual verification: login → AI tab → create document → screenshot every stage.
 * Screenshots saved to test-results/ for manual review.
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

test.describe('Document Canvas Visual Verification', () => {
  test.skip(!email || !password, 'Set login credentials in .env');

  test('full visual walkthrough with screenshots', async ({ page }) => {
    test.setTimeout(180_000);

    // Step 1: Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const cookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await cookies.isVisible({ timeout: 3000 }).catch(() => false)) await cookies.click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    // Step 2: Navigate to AI tab
    await page.goto('/app/ai-assistant', { waitUntil: 'domcontentloaded' });
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: 'test-results/01-ai-tab-loaded.png', fullPage: false });

    // Step 3: Start new chat
    const newChatBtn = page.getByRole('button').filter({ has: page.locator('svg.lucide-plus') }).first();
    if (await newChatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await newChatBtn.click();
      await page.waitForTimeout(500);
    }

    // Step 4: Send document request
    const nexusResp = page.waitForResponse(
      (r) => r.url().includes('/api/ai/nexus-user') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );

    await page.getByPlaceholder('Type a message...').fill(
      'Create a professional invoice template for freelance web development services totaling $3,500 with line items for design, development, and testing.',
    );
    await page.screenshot({ path: 'test-results/02-message-typed.png', fullPage: false });
    await page.getByPlaceholder('Type a message...').press('Enter');

    // Step 5: Wait for response
    await page.screenshot({ path: 'test-results/03-waiting-for-response.png', fullPage: false });
    const response = await nexusResp;
    const body = await response.json().catch(() => ({}));
    const trace = (body as any).toolTrace || [];
    const docTrace = trace.find((t: any) => t?.tool === 'create_document' && t?.ok);

    // Wait for canvas to render
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'test-results/04-response-received.png', fullPage: false });

    // Step 6: Verify canvas opened
    const editor = page.locator('.ProseMirror');
    const canvasVisible = await editor.isVisible({ timeout: 5000 }).catch(() => false);
    await page.screenshot({ path: 'test-results/05-canvas-state.png', fullPage: false });

    // Step 7: Check toolbar
    const toolbar = page.locator('button[title="Bold"]');
    const toolbarVisible = await toolbar.isVisible({ timeout: 3000 }).catch(() => false);

    // Step 8: Check export buttons
    const pdfBtn = page.getByRole('button', { name: /PDF/ });
    const docxBtn = page.getByRole('button', { name: /DOCX/ });
    const xlsxBtn = page.getByRole('button', { name: /XLSX/ });
    const pdfVisible = await pdfBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const docxVisible = await docxBtn.isVisible({ timeout: 3000 }).catch(() => false);
    const xlsxVisible = await xlsxBtn.isVisible({ timeout: 3000 }).catch(() => false);

    // Step 9: Check title
    const titleInput = page.locator('input[placeholder="Untitled document"]');
    const titleVisible = await titleInput.isVisible({ timeout: 3000 }).catch(() => false);
    const titleValue = titleVisible ? await titleInput.inputValue() : '';

    // Step 10: Try editing
    let editWorked = false;
    if (canvasVisible) {
      await editor.click();
      await page.keyboard.press('End');
      await page.keyboard.type('\n\nVisual test edit successful.');
      await page.waitForTimeout(500);
      const text = await editor.textContent();
      editWorked = (text || '').includes('Visual test edit');
      await page.screenshot({ path: 'test-results/06-after-edit.png', fullPage: false });
    }

    // Step 11: Check "Open" button on message
    const openBtn = page.getByRole('button', { name: /Open "/ });
    const openBtnVisible = await openBtn.isVisible({ timeout: 3000 }).catch(() => false);

    // Step 12: Test close and re-open
    let reopenWorked = false;
    if (canvasVisible) {
      const closeBtn = page.getByRole('button', { name: /Close/ });
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/07-canvas-closed.png', fullPage: false });
        
        if (openBtnVisible) {
          await openBtn.click();
          await page.waitForTimeout(1000);
          reopenWorked = await editor.isVisible({ timeout: 3000 }).catch(() => false);
          await page.screenshot({ path: 'test-results/08-canvas-reopened.png', fullPage: false });
        }
      }
    }

    // Step 13: Test fullscreen
    if (canvasVisible) {
      const fsBtn = page.getByRole('button', { name: /Fullscreen/ });
      if (await fsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fsBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/09-fullscreen.png', fullPage: false });
        const exitBtn = page.getByRole('button', { name: /Exit fullscreen/ });
        if (await exitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await exitBtn.click();
        }
      }
    }

    // Final report
    console.log('\n=== DOCUMENT CANVAS VISUAL VERIFICATION ===');
    console.log(`create_document tool called: ${!!docTrace}`);
    console.log(`  format: ${docTrace?.detail?.format || 'N/A'}`);
    console.log(`  content length: ${(docTrace?.detail?.content || '').length} chars`);
    console.log(`Canvas panel visible: ${canvasVisible}`);
    console.log(`Toolbar visible: ${toolbarVisible}`);
    console.log(`Title field visible: ${titleVisible}, value: "${titleValue}"`);
    console.log(`PDF button: ${pdfVisible}`);
    console.log(`DOCX button: ${docxVisible}`);
    console.log(`XLSX button: ${xlsxVisible}`);
    console.log(`Editor is editable: ${editWorked}`);
    console.log(`"Open" button on message: ${openBtnVisible}`);
    console.log(`Close + reopen works: ${reopenWorked}`);
    console.log('Screenshots saved to test-results/01-09*.png');
    console.log('===========================================\n');

    // Assert critical items
    expect(docTrace, 'create_document tool must be called').toBeTruthy();
    expect(canvasVisible, 'Canvas must be visible').toBe(true);
    expect(toolbarVisible, 'Toolbar must be visible').toBe(true);
    expect(pdfVisible, 'PDF export button must be visible').toBe(true);
    expect(docxVisible, 'DOCX export button must be visible').toBe(true);
    expect(editWorked, 'Editor must be editable').toBe(true);
    expect(openBtnVisible, 'Open button on message must be visible').toBe(true);
  });
});
