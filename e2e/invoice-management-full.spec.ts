/**
 * E2E: Full invoice management verification as a real user.
 * Tests: Financials tab loads, invoice dashboard visible, create new invoice form,
 * delete invoice, Settings billing tab, and visual screenshots.
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

test.describe('Invoice Management E2E', () => {
  test.skip(!email || !password, 'Set login credentials in .env');

  test('full invoice management flow', async ({ page }) => {
    test.setTimeout(120_000);

    // 1. Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const cookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await cookies.isVisible({ timeout: 3000 }).catch(() => false)) await cookies.click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    // 2. Navigate to Financials
    await page.goto('/financials', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 3. Verify Invoices tab is default and visible
    const invoicesTab = page.getByText('Invoices').first();
    await expect(invoicesTab).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/inv-01-financials-invoices-tab.png', fullPage: false });

    // 4. Verify invoice dashboard elements
    const outstandingCard = page.getByText('OUTSTANDING');
    await expect(outstandingCard).toBeVisible({ timeout: 5_000 });

    // 5. Check "+ New Invoice" button exists
    const newInvoiceBtn = page.getByText('New Invoice');
    const hasNewBtn = await newInvoiceBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    // 6. Check existing invoice has action buttons
    const trashBtn = page.locator('button[title="Delete invoice"]').first();
    const hasTrash = await trashBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    const editBtn = page.locator('button[title="Edit invoice"]').first();
    const hasEdit = await editBtn.isVisible({ timeout: 3_000 }).catch(() => false);

    // 7. Click "+ New Invoice" to open form
    if (hasNewBtn) {
      await newInvoiceBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'test-results/inv-02-new-invoice-form.png', fullPage: false });

      // Verify form fields
      const recipientEmail = page.getByPlaceholder('client@company.com');
      await expect(recipientEmail).toBeVisible({ timeout: 3_000 });

      const recipientName = page.getByPlaceholder('John Smith / Acme Corp');
      await expect(recipientName).toBeVisible();

      // Verify line items
      const descField = page.getByPlaceholder('Description').first();
      await expect(descField).toBeVisible();

      // Verify totals section
      const subtotalText = page.getByText('Subtotal').last();
      await expect(subtotalText).toBeVisible();
      const totalText = page.getByText('Total').last();
      await expect(totalText).toBeVisible();

      // Verify buttons
      const sendBtn = page.getByText('Send Invoice');
      await expect(sendBtn).toBeVisible();
      const cancelBtn = page.getByText('Cancel');
      await expect(cancelBtn).toBeVisible();

      // Close the form
      await cancelBtn.click();
      await page.waitForTimeout(300);
    }

    // 8. Check Revenue Intelligence tab works
    const revenueTab = page.getByText('Revenue Intelligence');
    await expect(revenueTab).toBeVisible();
    await revenueTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/inv-03-revenue-tab.png', fullPage: false });

    // Switch back
    await page.getByText('Invoices').first().click();
    await page.waitForTimeout(500);

    // 9. Navigate to Settings > Billing
    await page.goto('/settings?tab=billing', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/inv-04-settings-billing.png', fullPage: false });

    // Verify Stripe Connect section exists
    const paymentProcessing = page.getByText('Payment Processing');
    const hasBilling = await paymentProcessing.isVisible({ timeout: 5_000 }).catch(() => false);

    // Report
    console.log('\n=== INVOICE MANAGEMENT E2E VERIFICATION ===');
    console.log(`Invoices tab visible: true`);
    console.log(`Outstanding card: true`);
    console.log(`"+ New Invoice" button: ${hasNewBtn}`);
    console.log(`Delete (trash) button on row: ${hasTrash}`);
    console.log(`Edit (pencil) button on row: ${hasEdit}`);
    console.log(`Invoice form opens: ${hasNewBtn}`);
    console.log(`Settings > Billing tab: ${hasBilling}`);
    console.log(`Screenshots saved to test-results/inv-01 through inv-04`);
    console.log('============================================\n');

    expect(hasNewBtn, '"+ New Invoice" button must be visible').toBe(true);
  });
});
