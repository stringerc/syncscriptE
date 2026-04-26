/**
 * Full site audit: login, visit every major route, capture console errors + screenshots.
 */
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

const ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/tasks', name: 'Tasks' },
  { path: '/tasks?tab=tasks', name: 'Tasks-Tab' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/financials', name: 'Financials' },
  { path: '/email', name: 'Email' },
  { path: '/ai', name: 'AI-Chat' },
  { path: '/energy', name: 'Energy' },
  { path: '/settings', name: 'Settings' },
  { path: '/settings?tab=billing', name: 'Settings-Billing' },
  { path: '/settings?tab=integrations', name: 'Settings-Integrations' },
];

test.describe('Full Site Audit', () => {
  test.skip(!email || !password, 'Set credentials');

  test('audit all pages for errors', async ({ page }) => {
    test.setTimeout(300_000);

    const errors: { route: string; type: string; message: string }[] = [];
    const warnings: { route: string; message: string }[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (text.includes('Content Script') || text.includes('DEPRECATED')) return;
        if (text.includes('favicon')) return;
        errors.push({ route: page.url(), type: 'console.error', message: text.slice(0, 200) });
      }
    });

    page.on('pageerror', (err) => {
      errors.push({ route: page.url(), type: 'uncaught', message: err.message.slice(0, 200) });
    });

    page.on('response', (res) => {
      const url = res.url();
      if (res.status() >= 400 && !url.includes('favicon') && !url.includes('sw.js')) {
        if (url.includes('openclaw/continuity')) return;
        errors.push({ route: page.url(), type: `HTTP ${res.status()}`, message: url.slice(0, 200) });
      }
    });

    // Login
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const cookies = page.getByRole('button', { name: /Accept All Cookies/i });
    if (await cookies.isVisible({ timeout: 3000 }).catch(() => false)) await cookies.click();
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    // Visit each route
    for (const route of ROUTES) {
      try {
        await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-results/audit-${route.name}.png`, fullPage: false });
      } catch (e: any) {
        errors.push({ route: route.path, type: 'navigation', message: e.message?.slice(0, 200) || 'timeout' });
      }
    }

    // Report
    console.log('\n========================================');
    console.log('  SYNCSCRIPT FULL SITE AUDIT REPORT');
    console.log('========================================\n');
    console.log(`Pages audited: ${ROUTES.length}`);
    console.log(`Errors found: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n--- ERRORS ---');
      for (const e of errors) {
        console.log(`  [${e.type}] ${e.route}`);
        console.log(`    ${e.message}`);
      }
    } else {
      console.log('\n  No errors found across all pages.');
    }
    
    console.log('\n========================================\n');

    writeFileSync('test-results/audit-report.json', JSON.stringify({ errors, warnings, routes: ROUTES.map(r => r.path) }, null, 2));
  });
});
