/**
 * Three-column shell geometry: prevents overflow clip + w-full flex bugs (see DashboardPage).
 * Runs on Chromium (default) and Firefox (canary project in playwright.config.ts).
 */
import { test, expect } from '@playwright/test';
import {
  installChatAssistantClosed,
  installChatAssistantOpen,
  installDevGuestSession,
} from './fixtures/guest-session';

const DESKTOP = { width: 1440, height: 900 } as const;
const WIDE_FOR_RAIL = { width: 1920, height: 1000 } as const;

type Box = { x: number; y: number; width: number; height: number };

test.describe('dashboard three-column layout (md+)', () => {
  test.beforeEach(async ({ context }) => {
    await installDevGuestSession(context);
    await installChatAssistantClosed(context);
  });

  test('three column shells share a row: horizontal separation, similar widths (chat closed)', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(DESKTOP);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard$/);

    const energy = page.locator('#energy-meter');
    await expect(energy).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('heading', { name: "TODAY'S ORCHESTRATION" })).toBeVisible({
      timeout: 20_000,
    });

    const measure = () =>
      page.evaluate(() => {
        const ids = ['ai-suggestions', 'energy-meter', 'roygbiv-ring'] as const;
        const out: Box[] = [];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) return { ok: false as const, reason: `missing #${id}` };
          const r = el.getBoundingClientRect();
          out.push({ x: r.x, y: r.y, width: r.width, height: r.height });
        }
        return { ok: true as const, boxes: out };
      });

    let last: { a: Box; b: Box; c: Box } | null = null;
    for (let i = 0; i < 25; i++) {
      const m = await measure();
      expect(m.ok, !m.ok ? m.reason : 'ok').toBe(true);
      if (!m.ok) continue;
      const [a, b, c] = m.boxes;
      const ySpread = Math.max(Math.abs(a.y - b.y), Math.abs(b.y - c.y), Math.abs(a.y - c.y));
      const xOrdered = a.x < b.x - 8 && b.x < c.x - 8;
      const minW = Math.min(a.width, b.width, c.width);
      const maxW = Math.max(a.width, b.width, c.width);
      const widthReasonable = minW > 40 && maxW < DESKTOP.width * 0.55;

      if (xOrdered && ySpread < 120 && widthReasonable) {
        last = { a, b, c };
        break;
      }
      await page.waitForTimeout(300);
    }

    expect(last, 'expected three flex columns with distinct x and similar tops').not.toBeNull();
    if (!last) return;

    const wavg = (last.a.width + last.b.width + last.c.width) / 3;
    for (const k of [last.a, last.b, last.c] as const) {
      const drift = Math.abs(k.width - wavg) / wavg;
      expect(drift, `column width ${k.width} vs avg ${wavg}`).toBeLessThan(0.45);
    }
  });
});

test.describe('dashboard + chat rail open (wide)', () => {
  test.use({ viewport: WIDE_FOR_RAIL });

  test.beforeEach(async ({ context }) => {
    await installDevGuestSession(context);
    await installChatAssistantOpen(context);
  });

  test('three columns stay horizontally separated with rail open', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator('#energy-meter')).toBeVisible({ timeout: 60_000 });

    const m = await page.evaluate(() => {
      const ids = ['ai-suggestions', 'energy-meter', 'roygbiv-ring'] as const;
      const out: Box[] = [];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) return { ok: false as const, reason: `missing #${id}` };
        const r = el.getBoundingClientRect();
        out.push({ x: r.x, y: r.y, width: r.width, height: r.height });
      }
      return { ok: true as const, boxes: out };
    });
    expect(m.ok, !m.ok ? m.reason : '').toBe(true);
    if (!m.ok) return;
    const [a, b, c] = m.boxes;
    expect(a.x, 'ai column left of today').toBeLessThan(b.x);
    expect(b.x, 'today left of resource').toBeLessThan(c.x);
    const ySpread = Math.max(Math.abs(a.y - b.y), Math.abs(b.y - c.y));
    expect(ySpread, 'row tops roughly aligned with rail open').toBeLessThan(160);
  });
});

test.describe('dashboard stacks below md width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('single-column stack: today section below ai column', async ({ page, context }) => {
    test.setTimeout(90_000);
    await installDevGuestSession(context);
    await installChatAssistantClosed(context);
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#energy-meter')).toBeVisible({ timeout: 60_000 });

    const m = await page.evaluate(() => {
      const a = document.getElementById('ai-suggestions')?.getBoundingClientRect();
      const b = document.getElementById('energy-meter')?.getBoundingClientRect();
      if (!a || !b) return null;
      return { aTop: a.top, bTop: b.top };
    });
    expect(m).not.toBeNull();
    if (!m) return;
    expect(m.bTop, 'today should start at or below ai block on narrow viewports').toBeGreaterThan(
      m.aTop - 4,
    );
  });
});

test.describe('/calendar day grid + right rail (guest)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ context }) => {
    await installDevGuestSession(context);
  });

  test('timeline and rail share one flex row (chat closed)', async ({ page, context }) => {
    await installChatAssistantClosed(context);
    await page.setViewportSize(DESKTOP);
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/calendar$/, { timeout: 30_000 });

    const timeline = page.locator('[data-layout="calendar-timeline"]');
    const rail = page.locator('[data-layout="calendar-rail"]');
    await expect(timeline).toBeVisible({ timeout: 60_000 });
    await expect(rail).toBeVisible({ timeout: 20_000 });

    const tb = await timeline.boundingBox();
    const rb = await rail.boundingBox();
    expect(tb, 'timeline bounding box').toBeTruthy();
    expect(rb, 'rail bounding box').toBeTruthy();
    if (!tb || !rb) return;
    expect(Math.abs(tb.y - rb.y), 'rail must not stack below timeline (same flex row)').toBeLessThan(28);
    expect(rb.x, 'rail should sit to the right of the timeline column').toBeGreaterThanOrEqual(
      tb.x - 4,
    );
  });

  test('timeline and rail stay one flex row with chat assistant open (narrow main)', async ({
    page,
    context,
  }) => {
    await installChatAssistantOpen(context);
    await page.setViewportSize(DESKTOP);
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/calendar$/, { timeout: 30_000 });

    const timeline = page.locator('[data-layout="calendar-timeline"]');
    const rail = page.locator('[data-layout="calendar-rail"]');
    await expect(timeline).toBeVisible({ timeout: 60_000 });
    await expect(rail).toBeVisible({ timeout: 20_000 });

    const tb = await timeline.boundingBox();
    const rb = await rail.boundingBox();
    expect(tb && rb).toBeTruthy();
    if (!tb || !rb) return;
    expect(Math.abs(tb.y - rb.y), 'with chat open, rail must not drop under the day grid').toBeLessThan(
      28,
    );
  });

  test('iPhone-width: still one flex row (horizontal scroll if needed)', async ({ page, context }) => {
    await installChatAssistantClosed(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/calendar$/, { timeout: 30_000 });

    const timeline = page.locator('[data-layout="calendar-timeline"]');
    const rail = page.locator('[data-layout="calendar-rail"]');
    await expect(timeline).toBeVisible({ timeout: 60_000 });
    await expect(rail).toBeVisible({ timeout: 20_000 });

    const tb = await timeline.boundingBox();
    const rb = await rail.boundingBox();
    expect(tb && rb).toBeTruthy();
    if (!tb || !rb) return;
    expect(Math.abs(tb.y - rb.y), 'mobile: sidebar must remain beside calendar, not below').toBeLessThan(
      36,
    );
  });
});
