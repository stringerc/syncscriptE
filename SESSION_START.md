# Session start — read this first

Single place to resume without re-explaining the whole thread. Update **Current focus** and **Last session** when you ship or pivot.

## How we like to work

- **Ship related pieces in one coherent pass** when it’s the same feature (code + tests + MEMORY/SESSION when it matters).
- **Small diffs** — no drive-by refactors; match existing patterns.
- **No option menus** — if several follow-ups are obviously part of the same goal, bundle them unless the user narrows scope.
- **Verify before done** — run **`npm test`** when touching Nexus tools/voice/contracts; **`CI=true npm run build`** for risky UI/build changes.
- **Protected surfaces** — follow **`.cursor/rules/02-protected-files-never-touch.mdc`** (Nexus core files, energy hooks, auth routes listed there).

## Current focus

SyncScript dashboard and **Nexus** (App AI): voice + tools-backed UI (canvas, tasks, maps), Vercel `api/*`, Supabase Edge where applicable. Continuity lives in **`MEMORY.md`** (ops + decisions) and this file (session handoff).

## Last session (update each time)

- **Continuity stack:** Added **`SESSION_START.md`**, repo **`SOUL.md` / `USER.md` / `AGENTS.md`**, **`MEMORY.md` § Quick context**, Cursor rule **`00-session-bootstrap.mdc`** so new chats load the same ritual from git + rules.
- **Nexus voice (earlier commits):** Signed-in voice uses **`/api/ai/nexus-user`** + tools; artifact rail, canvas, map embed, **`update_document`** — details in **`MEMORY.md`** § Nexus Voice.

## Blockers

- None recorded here — add a bullet when something external blocks merge/deploy.

## Optional: micro-handoff for fragile tasks

Paste 5 lines in chat: **Goal · Constraint · “Read MEMORY §X and SESSION_START.md” · Done definition.**

## Browser console (not always SyncScript)

Messages like **`[uwLogger]`**, **`uw.js`**, **`chrome-extension://`**, **`runtime.lastError`** (back/forward cache), or **`postMessage` target origin** usually come from **browser extensions** (e.g. accessibility overlays) or **DevTools**, not from this app’s bundle. To verify app-only errors, use a **clean profile** / **Incognito with extensions off** or filter the console by **`syncscript`** / **`localhost`**. Real app issues (e.g. **`speakingTimeoutRef`**) belong in **`src/`** and should be fixed in-repo.

## Deploy check (prod vs repo)

Builds inject **`<!-- syncscript-build:&lt;sha&gt; -->`** in `index.html` and **`window.__SYNCSCRIPT_BUILD__.sha`** at runtime (see `vite.config.ts`).

- **Automated:** from repo root, after deploy: `node scripts/verify-prod-build.mjs https://www.syncscript.app` — exits **0** only if the HTML comment’s SHA matches **`git rev-parse --short HEAD`** (override URL with `VERIFY_PROD_URL` or first arg).
- **Manual:** DevTools → Elements → view page source on `/` and search for `syncscript-build`, or console: `__SYNCSCRIPT_BUILD__`.
- **Vercel:** Project → **Settings → Git** must point at the same GitHub repo/branch you push (e.g. **`stringerc/syncscriptE`** + **`main`**). If production is wired to another repo, pushes here never ship.
- **Cache:** after deploy, hard reload with cache disabled or unregister the **service worker** once so `index.html` isn’t stale.
