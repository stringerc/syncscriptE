/**
 * Mobile audit: capture screenshots of every major page at iPhone 14 Pro viewport (393x852).
 */
import { test } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
function loadDotEnv() { const p = join(process.cwd(), '.env'); if (!existsSync(p)) return; for (const line of readFileSync(p, 'utf8').split('\n')) { const t = line.trim(); if (!t || t.startsWith('#')) continue; const eq = t.indexOf('='); if (eq <= 0) continue; const k = t.slice(0, eq).trim(); let v = t.slice(eq + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); if (process.env[k] === undefined) process.env[k] = v; } }
loadDotEnv();
const email = process.env.E2E_LOGIN_EMAIL?.trim() || process.env.NEXUS_LIVE_TEST_EMAIL?.trim() || '';
const password = process.env.E2E_LOGIN_PASSWORD?.trim() || process.env.NEXUS_LIVE_TEST_PASSWORD?.trim() || '';

test.use({ viewport: { width: 393, height: 852 } });

test('mobile screenshots of all pages', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const c = page.getByRole('button', { name: /Accept All Cookies/i });
  if (await c.isVisible({ timeout: 3000 }).catch(() => false)) await c.click();
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 30_000 });

  const routes = [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/tasks?tab=tasks', name: 'tasks' },
    { path: '/calendar', name: 'calendar' },
    { path: '/financials', name: 'financials' },
    { path: '/ai', name: 'ai-chat' },
    { path: '/settings', name: 'settings' },
  ];

  for (const r of routes) {
    await page.goto(r.path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `test-results/mobile-${r.name}.png`, fullPage: false });
  }
});
