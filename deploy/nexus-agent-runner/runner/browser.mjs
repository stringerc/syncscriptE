/**
 * Playwright wrapper for the agent. One Chromium instance per active run.
 * Pool is keyed by run_id so reads (screenshots) and writes (clicks) are
 * single-threaded against the page.
 */
import { chromium } from 'playwright';

const TIMEOUT = parseInt(process.env.AGENT_RUNNER_BROWSER_TIMEOUT_MS || '120000', 10);

/**
 * Default **headless** on Oracle/Docker (no X11). Set `AGENT_RUNNER_HEADED=1` on a
 * host with a real display (local Mac dev, or a VM with VNC/Xvfb + DISPLAY) to
 * open a visible Chromium window the operator can watch like a normal browser.
 * CDP screencast to the dashboard still works in both modes.
 */
function useHeadless() {
  const raw = String(process.env.AGENT_RUNNER_HEADED || '').trim().toLowerCase();
  const headed = raw === '1' || raw === 'true' || raw === 'yes';
  return !headed;
}

export async function launchBrowser() {
  const headless = useHeadless();
  const slowMo = headless
    ? 0
    : Math.max(0, parseInt(process.env.AGENT_RUNNER_SLOW_MO_MS || '0', 10) || 0);
  return chromium.launch({
    headless,
    slowMo,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--no-sandbox',
    ],
  });
}

export async function newPage(browser, options = {}) {
  // If `storageState` is supplied, Playwright hydrates cookies + localStorage
  // from it on context creation — the agent then "remembers" Gmail/etc logins.
  // Be defensive: if the supplied state is malformed, fall back to a blank
  // context rather than crashing the run.
  // Playwright's `storageState: string` is interpreted as a FILE PATH. We
  // store it as JSON in vault, so we must parse it into an object before
  // handing to newContext(). Anything malformed → drop the option.
  let safeOptions = options;
  if (options.storageState && typeof options.storageState === 'string') {
    try {
      const parsed = JSON.parse(options.storageState);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cookies)) {
        safeOptions = { ...options, storageState: parsed };
      } else {
        throw new Error('not a storageState object');
      }
    } catch (e) {
      console.warn('[runner] dropping malformed storageState:', e?.message || e);
      safeOptions = { ...options };
      delete safeOptions.storageState;
    }
  }
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    ...safeOptions,
  });
  ctx.setDefaultTimeout(TIMEOUT);
  const page = await ctx.newPage();
  return { ctx, page };
}

/**
 * Pull current storageState from the context. Returns the JSON string +
 * derived metadata for `admin_save_browser_context`.
 */
export async function captureStorageState(ctx) {
  const state = await ctx.storageState();
  const json = JSON.stringify(state);
  const cookies = Array.isArray(state.cookies) ? state.cookies : [];
  const hostnames = Array.from(
    new Set(
      cookies
        .map((c) => String(c.domain || '').replace(/^\./, '').toLowerCase())
        .filter(Boolean),
    ),
  );
  return {
    json,
    bytes: Buffer.byteLength(json, 'utf8'),
    cookieCount: cookies.length,
    hostnames,
  };
}

/**
 * Atomic browser action — one of:
 *   { kind:'goto', url }
 *   { kind:'click', x, y }
 *   { kind:'type', text, clear?: boolean }
 *   { kind:'press', key }                    // Enter, Escape, Tab, …
 *   { kind:'scroll', dx?, dy? }
 *   { kind:'wait', ms }
 *   { kind:'screenshot' }                    // returns base64 png
 *   { kind:'extract_text' }                  // page innerText (truncated)
 */
export async function executeBrowserAction(page, action) {
  switch (action.kind) {
    case 'goto': {
      const target = String(action.url || '').trim();
      if (!/^https?:\/\//.test(target)) throw new Error('goto: url must start with http(s)');
      // domcontentloaded is fast but misses lazy-loaded content. Try
      // networkidle (capped) so dynamic image grids / SPA fetches settle
      // before the agent extract_links / extract_text. Falls through if
      // the page never reaches networkidle (long-poll sites).
      try {
        await page.goto(target, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 4000 }).catch(() => {});
      } catch (e) {
        return { ok: false, error: String(e?.message || e).slice(0, 300) };
      }
      return { ok: true };
    }
    case 'click': {
      const x = Math.round(Number(action.x) || 0);
      const y = Math.round(Number(action.y) || 0);
      await page.mouse.click(x, y);
      await page.waitForTimeout(300);
      return { ok: true, at: { x, y } };
    }
    case 'type': {
      const text = String(action.text ?? '');
      if (action.clear) await page.keyboard.press('Control+A');
      await page.keyboard.type(text, { delay: 12 });
      return { ok: true, chars: text.length };
    }
    case 'press': {
      const key = String(action.key || 'Enter');
      await page.keyboard.press(key);
      return { ok: true, key };
    }
    case 'scroll': {
      const dx = Math.round(Number(action.dx) || 0);
      const dy = Math.round(Number(action.dy) || 600);
      await page.mouse.wheel(dx, dy);
      await page.waitForTimeout(200);
      return { ok: true, dx, dy };
    }
    case 'wait': {
      const ms = Math.min(10_000, Math.max(0, Number(action.ms) || 1000));
      await page.waitForTimeout(ms);
      return { ok: true, ms };
    }
    case 'screenshot': {
      const buf = await page.screenshot({ type: 'png', fullPage: false });
      return { ok: true, base64: buf.toString('base64') };
    }
    case 'extract_text': {
      const text = await page.evaluate(() => (document.body?.innerText || '').slice(0, 10_000));
      return { ok: true, text };
    }
    case 'extract_links': {
      // Extracts <a href> + <img src> URLs that look navigable. Useful for
      // collection tasks (e.g. "find dolphin pictures") without needing to
      // click. Auto-scrolls + waits if the first pass returns fewer than
      // expected items — handles lazy-loaded image grids on Google/Bing/etc.
      const filterKind = String(action.filter || 'all'); // 'a' | 'img' | 'all'
      const max = Math.min(200, Math.max(1, Number(action.max) || 30));
      const minBeforeScroll = filterKind === 'img' ? 5 : 8;

      async function pull() {
        return await page.evaluate(({ filterKind, max }) => {
          const out = { links: [], images: [] };
          if (filterKind === 'all' || filterKind === 'a') {
            const anchors = Array.from(document.querySelectorAll('a[href]')).slice(0, max * 3);
            for (const a of anchors) {
              const href = a.getAttribute('href') || '';
              try {
                const abs = new URL(href, location.href).toString();
                if (!abs.startsWith('http')) continue;
                const text = (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 120);
                out.links.push({ href: abs, text });
                if (out.links.length >= max) break;
              } catch { /* ignore */ }
            }
          }
          if (filterKind === 'all' || filterKind === 'img') {
            // Include lazy-loaded sources: data-src, data-original, srcset.
            // Filter out UI noise so the LLM only sees content photos.
            const imgs = Array.from(document.querySelectorAll('img[src],img[data-src],img[data-original]')).slice(0, max * 6);
            const candidates = [];
            for (const img of imgs) {
              const src = img.getAttribute('src') ||
                          img.getAttribute('data-src') ||
                          img.getAttribute('data-original') ||
                          (img.getAttribute('srcset') || '').split(' ')[0] ||
                          '';
              if (!src) continue;
              try {
                const abs = new URL(src, location.href).toString();
                if (!abs.startsWith('http')) continue;
                // Skip UI/icon assets that pollute generic image extracts.
                const lower = abs.toLowerCase();
                if (
                  lower.endsWith('.svg') ||
                  /\/(icons?|static|sprites?|emoji|favicon|logos?|chrome|ui-|ux-)\b/.test(lower) ||
                  /\/rp\//.test(lower) ||                              // bing UI bundles
                  /\.ico(\?|$)/.test(lower) ||                         // favicons
                  /external-content.*\/ip\d?\//.test(lower)            // DDG favicon proxy
                ) continue;
                const w = img.naturalWidth || img.getAttribute('width') || 0;
                const h = img.naturalHeight || img.getAttribute('height') || 0;
                const alt = (img.getAttribute('alt') || '').trim().slice(0, 120);
                // Score: bigger pictures with alt text first.
                const area = (Number(w) || 0) * (Number(h) || 0);
                const score = area + (alt ? 5000 : 0);
                if (Number(w) > 80 || Number(h) > 80 || (!w && !h)) {
                  candidates.push({ src: abs, alt, width: Number(w) || null, height: Number(h) || null, _score: score });
                }
              } catch { /* ignore */ }
            }
            candidates.sort((a, b) => b._score - a._score);
            for (const c of candidates.slice(0, max)) {
              const { _score: _, ...clean } = c;
              out.images.push(clean);
            }
          }
          return out;
        }, { filterKind, max });
      }

      let result = await pull();
      // If we got too few images, scroll once + retry. Common for Google
      // Images / Bing / Pinterest / any infinite-scroll grid.
      if (filterKind !== 'a' && result.images.length < minBeforeScroll) {
        try {
          await page.evaluate(() => window.scrollBy(0, 1500));
          await page.waitForTimeout(900);
          await page.evaluate(() => window.scrollBy(0, 1500));
          await page.waitForTimeout(900);
          const second = await pull();
          if (second.images.length > result.images.length) result = second;
        } catch { /* ignore */ }
      }
      return { ok: true, ...result };
    }
    default:
      return { ok: false, error: `unknown_action:${action.kind}` };
  }
}

export async function currentUrl(page) {
  try { return page.url(); } catch { return ''; }
}
