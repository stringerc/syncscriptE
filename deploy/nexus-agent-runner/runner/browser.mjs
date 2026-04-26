/**
 * Playwright wrapper for the agent. One Chromium instance per active run.
 * Pool is keyed by run_id so reads (screenshots) and writes (clicks) are
 * single-threaded against the page.
 */
import { chromium } from 'playwright';

const TIMEOUT = parseInt(process.env.AGENT_RUNNER_BROWSER_TIMEOUT_MS || '120000', 10);

export async function launchBrowser() {
  return chromium.launch({
    headless: true,
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
      await page.goto(target, { waitUntil: 'domcontentloaded' });
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
      // click. Result includes hostname-grouped counts so the LLM can prefer
      // domain-restricted hits.
      const filterKind = String(action.filter || 'all'); // 'a' | 'img' | 'all'
      const max = Math.min(200, Math.max(1, Number(action.max) || 30));
      const result = await page.evaluate(({ filterKind, max }) => {
        const out = { links: [], images: [] };
        if (filterKind === 'all' || filterKind === 'a') {
          const anchors = Array.from(document.querySelectorAll('a[href]'))
            .slice(0, max * 3);
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
          const imgs = Array.from(document.querySelectorAll('img[src]'))
            .slice(0, max * 3);
          for (const img of imgs) {
            const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
            try {
              const abs = new URL(src, location.href).toString();
              if (!abs.startsWith('http')) continue;
              const w = img.naturalWidth || img.getAttribute('width') || 0;
              const h = img.naturalHeight || img.getAttribute('height') || 0;
              const alt = (img.getAttribute('alt') || '').trim().slice(0, 120);
              // Skip tiny / data:url icons
              if (Number(w) > 60 || Number(h) > 60 || (!w && !h)) {
                out.images.push({ src: abs, alt, width: Number(w) || null, height: Number(h) || null });
                if (out.images.length >= max) break;
              }
            } catch { /* ignore */ }
          }
        }
        return out;
      }, { filterKind, max });
      return { ok: true, ...result };
    }
    default:
      return { ok: false, error: `unknown_action:${action.kind}` };
  }
}

export async function currentUrl(page) {
  try { return page.url(); } catch { return ''; }
}
