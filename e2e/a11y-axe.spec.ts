/**
 * Axe (WCAG-oriented) on marketing `/` and guest `/dashboard` — complements Lighthouse a11y.
 * Violations: serious + critical, excluding known UI debt (see AXE_EXCLUDED) so the gate
 * still catches *new* accessibility regressions without blocking on legacy contrast refactors.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installChatAssistantClosed, installDevGuestSession } from './fixtures/guest-session';

/** Filter to match gate intent: only critical+serious (not “moderate” noise on rich UI). */
function seriousAndCritical(axe: { impact?: string }[]) {
  return axe.filter((v) => v.impact === 'critical' || v.impact === 'serious');
}

/**
 * Excluded until dedicated a11y sweep:
 * - color-contrast / nested-interactive: dense cards + task rows
 * - button-name / label: icon-only header/sidebar controls (add aria-label later)
 */
const AXE_EXCLUDED = [
  'meta-viewport',
  'color-contrast',
  'nested-interactive',
  'button-name',
  'label',
] as const;

test.describe('axe a11y', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ timeout: 60_000 });

  test('landing / has no serious axe violations in [data-section=hero]', async ({ page }) => {
    await page.context().addInitScript(() => {
      try {
        localStorage.setItem('cookies_accepted', 'false');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-section="hero"]')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(400);

    const results = await new AxeBuilder({ page })
      .include('[data-section="hero"]')
      .disableRules([...AXE_EXCLUDED])
      .analyze();
    const bad = seriousAndCritical(results.violations);
    expect(
      bad,
      bad.length
        ? `${JSON.stringify(
            bad.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
            null,
            2,
          )}`
        : '',
    ).toEqual([]);
  });

  test('guest /dashboard has no serious axe violations in #main-content', async ({ page, context }) => {
    test.setTimeout(90_000);
    await installDevGuestSession(context);
    await installChatAssistantClosed(context);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('#energy-meter')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .include('#main-content')
      .disableRules([...AXE_EXCLUDED])
      .analyze();
    const bad = seriousAndCritical(results.violations);
    expect(
      bad,
      bad.length
        ? JSON.stringify(
            bad.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length })),
            null,
            2,
          )
        : '',
    ).toEqual([]);
  });
});
