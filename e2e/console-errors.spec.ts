import { test, expect } from '@playwright/test';

/**
 * Fails if the browser reports console.error or uncaught page errors on key routes.
 * Run before push: `npm run verify:console-errors`
 *
 * Uses local `vite preview` (see playwright.config.ts + E2E_PREVIEW_PORT).
 * Extend ALLOW if a noisy third-party message is unavoidable.
 */
const ALLOW: RegExp[] = [
  /Download the React DevTools/i,
  /^Ignored call to/i,
  /ResizeObserver loop/i,
];

function allowed(text: string): boolean {
  return ALLOW.some((re) => re.test(text));
}

function attachErrorCollectors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const t = msg.text();
    if (!allowed(t)) errors.push(`console.error: ${t}`);
  });
  page.on('pageerror', (err) => {
    const t = err.message;
    if (!allowed(t)) errors.push(`pageerror: ${t}`);
  });
  return errors;
}

test.describe('No unexpected browser console errors (preview)', () => {
  test('landing /', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 45_000 });
    // Lazy chunks + cookie banner delay
    await page.waitForTimeout(3000);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('/login', async ({ page }) => {
    const errors = attachErrorCollectors(page);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({ timeout: 45_000 });
    await page.waitForTimeout(2000);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
