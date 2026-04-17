# Session start — read this first

Single place to resume without re-explaining the whole thread. Update **Current focus** and **Last session** when you ship or pivot.

## How we like to work

- **Ship related pieces in one coherent pass** when it’s the same feature (code + tests + MEMORY/SESSION when it matters).
- **Small diffs** — no drive-by refactors; match existing patterns.
- **No option menus** — if several follow-ups are obviously part of the same goal, bundle them unless the user narrows scope.
- **Verify before done** — run **`npm test`** when touching Nexus tools/voice/contracts; **`CI=true npm run build`** for risky UI/build changes.
- **After meaningful prod deploy** — run **`npm run verify:prod-build`** until **MATCH**, or trigger Actions **Verify production HTML build fingerprint** / **Production dashboard smoke**. Green **`npm test`** does not prove live HTML matches **`git`** (see **Deploy check** below).
- **Protected surfaces** — follow **`.cursor/rules/02-protected-files-never-touch.mdc`** (Nexus core files, energy hooks, auth routes listed there).

## Current focus

SyncScript dashboard and **Nexus** (App AI): voice + tools-backed UI (canvas, tasks, maps), Vercel `api/*`, Supabase Edge where applicable. Continuity lives in **`MEMORY.md`** (ops + decisions) and this file (session handoff).

## Product priority (this cycle)

One crisp outcome (user-visible): _e.g. Nexus voice reliability, calendar correctness, deploy clarity._ Replace this line when you ship or pivot — keeps scope aligned with **SyncScript outcomes**, not tooling churn.

## IDE discipline (Cursor)

- **MCP:** Pin versions in **Cursor Settings → MCP** where possible — **`integrations/research/CURSOR_IDE_EXCELLENCE_SYNCSCRIPT.md`**.
- **GitHub labels for skill triage:** **`npm run gh:labels`** once per repo (creates **triage** + **skills** for **`.github/ISSUE_TEMPLATE/skill_evaluation.md`**).

## Last session (update each time)

- **ROI rituals (2026-04-17):** **`lighthouserc.cjs`** + **`npm run lighthouse:ci`** + **`.github/workflows/lighthouse-monthly.yml`**; **`verify-prod-build.yml`** job summary on success; **`skill-source-audit-weekly.yml`** triage checklist in summary; **`scripts/gh-ensure-labels.sh`** + **`npm run gh:labels`**; **MEMORY** / **SESSION_START** / **TOOLS** / **skill-evaluations** README updated (deploy habit, control panel, product priority placeholder, MCP pin reminder).
- **Cursor + MEMORY wiring:** Committed **`.cursor/rules/07-syncscript-app-knowledge.mdc`**, bootstrap points agents at it before full **`MEMORY.md`** read.
- **Prod deploy drift audit:** Local **`CI=true npm run build`** injects **`<!-- syncscript-build:<sha> -->`** in **`build/index.html`**; **live `www.syncscript.app` was missing that marker** while **`npm test`** and **`prod-human-smoke`** still passed — meaning **Vercel HTML is behind git**, not that the Vite plugin is broken. Added **`verify-prod-build`** messaging, scheduled GitHub Action **`.github/workflows/verify-prod-build.yml`**, and a **deploy-drift** step on **`production dashboard smoke`**. **Remediation:** deploy **`main`** to the production Vercel project; confirm **Settings → Git**; hard-reload / SW cache if needed.
- **Nexus voice (earlier commits):** Signed-in voice uses **`/api/ai/nexus-user`** + tools; artifact rail, canvas, map embed, **`update_document`** — details in **`MEMORY.md`** § Nexus Voice.

## Blockers

- **Vercel prod HTML drift (2026-04-16):** `git push origin main` succeeded (`ef743cd` on GitHub), but **`npm run verify:prod-build`** still failed — live `/` had **no** `<!-- syncscript-build:… -->` yet. Confirm **Vercel → Deployments** for a new build from `main`; fix **Settings → Git** if no deploy triggers; after green deploy, re-run **`verify:prod-build`** (expect **MATCH**).

## Optional: micro-handoff for fragile tasks

Paste 5 lines in chat: **Goal · Constraint · “Read MEMORY §X and SESSION_START.md” · Done definition.**

## Browser console (not always SyncScript)

Messages like **`[uwLogger]`**, **`uw.js`**, **`chrome-extension://`**, **`runtime.lastError`** (back/forward cache), or **`postMessage` target origin** usually come from **browser extensions** (e.g. accessibility overlays) or **DevTools**, not from this app’s bundle. To verify app-only errors, use a **clean profile** / **Incognito with extensions off** or filter the console by **`syncscript`** / **`localhost`**. Real app issues (e.g. **`speakingTimeoutRef`**) belong in **`src/`** and should be fixed in-repo.

## Deploy check (prod vs repo)

Builds inject **`<!-- syncscript-build:&lt;sha&gt; -->`** in `index.html` and **`window.__SYNCSCRIPT_BUILD__.sha`** at runtime (see `vite.config.ts`).

- **Automated:** from repo root, after deploy: `node scripts/verify-prod-build.mjs https://www.syncscript.app` — exits **0** only if the HTML comment’s SHA matches **`git rev-parse --short HEAD`** (override URL with `VERIFY_PROD_URL` or first arg).
- **GitHub Actions:** **Verify production HTML build fingerprint** (scheduled + `workflow_dispatch`) — same check in CI.
- **Broader live smoke:** **Production dashboard smoke** — fingerprint + Playwright **`test:e2e:dashboard-nav:prod`** against **`PLAYWRIGHT_BASE_URL`**.
- **Landing UX/perf (monthly ritual):** **Lighthouse landing (monthly)** — **`npm run lighthouse:ci`** locally (needs Chrome); workflow uploads **`.lighthouseci/`** artifact. Config: **`lighthouserc.cjs`** (targets align with **`.cursor/rules/04-perf-seo-gate.mdc`**).
- **Manual:** DevTools → Elements → view page source on `/` and search for `syncscript-build`, or console: `__SYNCSCRIPT_BUILD__`.
- **Vercel:** Project → **Settings → Git** must point at the same GitHub repo/branch you push (e.g. **`stringerc/syncscriptE`** + **`main`**). If production is wired to another repo, pushes here never ship.
- **Cache:** after deploy, hard reload with cache disabled or unregister the **service worker** once so `index.html` isn’t stale.
