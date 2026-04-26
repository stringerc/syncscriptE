# Verification matrix — unified platform (web + Companion + iOS + Watch)

Use this as a **release gate** before App Store / production pushes. Automate where noted; otherwise run manually and record pass/fail with build numbers.

## Automated (local / CI)

| Script | Command | Expect |
|--------|-----------|--------|
| Companion path guard | `cd nature-cortana-platform/desktop-shell && npm run verify:protocol-guard` | Exit 0 |
| Library + push Edge contracts | `node --test tests/user-files-library-contract.test.mjs tests/push-device-routes-contract.test.mjs` | Exit 0 |
| **Full platform verify** | `npm run verify:platform:full` | Runs `verify:unified-platform` + Playwright landing capabilities |
| iOS Simulator build | `npm run verify:ios:build` | **BUILD SUCCEEDED** (App Intents Swift compiles) |
| Web E2E (landing) | `npm run test:e2e:landing-capabilities` | Playwright pass |

**Apple App Site Association:** repo file [`public/.well-known/apple-app-site-association`](../../public/.well-known/apple-app-site-association) uses app id **`K85GR7XGDP.com.syncscript.app`** (matches Xcode `DEVELOPMENT_TEAM` + bundle id). Vercel must serve this file on `www.syncscript.app` / `syncscript.app`.

## Web (`syncscript.app`)

1. Sign in (staging or prod test account).
2. Open **Library** or upload flow; confirm `resources` API reachable (network tab: `/resources/files` or search).
3. **Landing:** scroll to **What you can ask inside SyncScript** — six capability cards visible (`[data-testid=nexus-capabilities-landing]`).
4. External link: open any `https://` help link — opens in default browser / tab.

## Nature Companion (desktop)

1. Install or `npm start` dev build; register `syncscript-companion://`.
2. From terminal or browser: `syncscript-companion://focus` — overlay focuses.
3. `syncscript-companion://openweb?path=%2Flibrary` — default browser opens SyncScript path.
4. `syncscript-companion://openchrome?path=%2Flibrary` — **Chrome** opens same URL (macOS/Windows); check `runtime-reports/events.jsonl` for `companion_chrome_opened` or failure + fallback.
5. `syncscript-companion://openagents?tab=tasks&workspace=default` — trust path may block without backend; expect audit event or browser open when allowed.

## iOS (Capacitor)

1. `npm run native:sync` after `npm run build`.
2. Xcode Run on **Simulator** — app loads web shell.
3. **Universal link** — open `https://www.syncscript.app/agents` from Safari “Open in app” when AASA + Team ID configured.
4. **Push** — after sign-in, `POST /make-server-57781ad9/push/register` stores token (see `bootstrap-capacitor.ts`); `GET .../push/status` returns `registered: true`. Send a test APNs payload with `data.deepLink` for route restore.
5. **Siri / Shortcuts** — Shortcuts app shows **Open SyncScript path** (from `SyncScriptAppShortcuts.swift`); run on device or Simulator.

## watchOS

1. **Shortcuts:** run recorded shortcut that opens `syncscript://` or universal link path.
2. **v2 (when shipped):** in-app voice query → search result list → optional email/pin actions.

## Staging exit criteria

- All **P0** rows above pass on **staging** Supabase + staging web URL.
- **MEMORY.md** lists test devices and minimum OS versions (no secrets).
- No open **P0** items in [`studies/2026-04-11-companion-protocol-policy.md`](./studies/2026-04-11-companion-protocol-policy.md) without a ticket.
