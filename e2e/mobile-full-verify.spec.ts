/**
 * Mobile verification: iPhone 14 Pro viewport, login, visit every page, screenshot each.
 * Longer timeouts to handle heavy pages.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function loadDotEnv() { const p = join(process.cwd(), '.env'); if (!existsSync(p)) return; for (const line of readFileSync(p, 'utf8').split('\n')) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const eq = t.indexOf('='); if (eq <= 0) continue; const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); if (process.env[k] === undefined) process.env[k] = v; } }
loadDotEnv();
const email = process.env.E2E_LOGIN_EMAIL?.trim() || process.env.NEXUS_LIVE_TEST_EMAIL?.trim() || '';
const password = process.env.E2E_LOGIN_PASSWORD?.trim() || process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() || '';

test.use({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

const PAGES = [
  '/dashboard',
  '/tasks?tab=tasks',
  '/calendar',
  '/financials',
  '/ai',
  '/settings',
];

test.describe('Mobile Full Verification', () => {
  test.skip(!email || !password, 'Set credentials');

  test('login and screenshot all pages', async ({ page }) => {
    test.setTimeout(180_000);

    // Login
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(1000);
    const cookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await cookies.isVisible({ timeout: 2000 }).catch(() => false)) await cookies.click();
    
    await page.screenshot({ path: 'test-results/mob-00-login.png' });

    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await emailInput.fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();

    // Wait for redirect away from login
    await page.waitForURL(/^(?!.*\/login)/, { timeout: 30_000 });
    await page.waitForTimeout(3000);

    const errors: string[] = [];
    
    for (let i = 0; i < PAGES.length; i++) {
      const path = PAGES[i];
      const name = path.replace(/[/?=]/g, '-').replace(/^-/, '');
      try {
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: `test-results/mob-${String(i + 1).padStart(2, '0')}-${name}.png` });
      } catch (e: any) {
        errors.push(`${path}: ${e.message?.slice(0, 100)}`);
        // Still try to screenshot on error
        await page.screenshot({ path: `test-results/mob-${String(i + 1).padStart(2, '0')}-${name}-ERROR.png` }).catch(() => {});
      }
    }

    console.log(`\nMobile verification: ${PAGES.length} pages, ${errors.length} errors`);
    if (errors.length > 0) {
      console.log('Errors:');
      errors.forEach(e => console.log(`  ${e}`));
    }
  });
});
