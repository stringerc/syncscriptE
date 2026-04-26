import { test } from '@playwright/test';

const GUEST_SESSION = {
  token: 'e2e-playwright-mock-token',
  user: {
    id: 'guest_e2e_dashboard_nav',
    email: 'e2e-guest@syncscript.test',
    name: 'E2E Guest',
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
    isGuest: true,
  },
};

test.beforeEach(async ({ context }) => {
  await context.addInitScript((payload) => {
    window.localStorage.setItem('syncscript_dev_guest_session_v1', JSON.stringify(payload));
  }, GUEST_SESSION);
});

/** Dumps elementFromPoint at rail icon centers — run: npx playwright test e2e/sidebar-hit-test-diag.spec.ts */
test('diag: elementFromPoint on sidebar from /tasks vs /dashboard', async ({ page }) => {
  const sample = async (route: string, label: string) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    if (route.includes('/tasks')) {
      await page.getByRole('tablist', { name: 'Projects OS sections' }).waitFor({ state: 'visible', timeout: 20_000 });
    }
    const dash = page.locator('#app-sidebar-rail [data-nav="sidebar-dashboard"]');
    await dash.waitFor({ state: 'visible', timeout: 15_000 });
    const box = await dash.boundingBox();
    if (!box) throw new Error('no bbox for dashboard link');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    const info = await page.evaluate(({ x, y }) => {
      const stack = document.elementsFromPoint(x, y).slice(0, 12).map((el) => {
        const st = window.getComputedStyle(el);
        return `${el.tagName}#${el.id} z=${st.zIndex} pe=${st.pointerEvents} nav=${el.getAttribute('data-nav') || ''}`;
      });
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const chain: string[] = [];
      let cur: Element | null = el;
      for (let i = 0; i < 8 && cur; i++) {
        const id = cur.id ? `#${cur.id}` : '';
        const ds = cur.getAttribute('data-slot') || '';
        const nav = cur.getAttribute('data-nav') || '';
        const cn = (cur.className && String(cur.className).slice(0, 80)) || '';
        chain.push(`${cur.tagName}${id} data-nav=${nav} data-slot=${ds} .${cn}`);
        cur = cur.parentElement;
      }
      return { x, y, elementsFromPoint: stack, top: chain[0], chain };
    }, { x, y });
    const rects = await page.evaluate(() => {
      const rail = document.querySelector('#app-sidebar-rail') as HTMLElement | null;
      const main = document.querySelector('#main-content') as HTMLElement | null;
      const mainCol = main?.closest('.relative.z-0') as HTMLElement | null;
      const link = document.querySelector(
        '#app-sidebar-rail a[data-nav="sidebar-dashboard"]',
      ) as HTMLElement | null;
      const z = (el: HTMLElement | null) => (el ? getComputedStyle(el).zIndex : 'null');
      return {
        railRect: rail?.getBoundingClientRect(),
        linkRect: link?.getBoundingClientRect(),
        mainRect: main?.getBoundingClientRect(),
        mainColRect: mainCol?.getBoundingClientRect(),
        mainColMarginLeft: mainCol ? getComputedStyle(mainCol).marginLeft : null,
        zRail: z(rail),
        zMainCol: z(mainCol),
        zMain: z(main),
      };
    });
    // eslint-disable-next-line no-console
    console.log(`\n--- ${label} (${route}) ---\n`, JSON.stringify({ ...info, rects }, null, 2));
  };

  await sample('/tasks', 'TASKS');
  await sample('/dashboard', 'DASHBOARD');
});
