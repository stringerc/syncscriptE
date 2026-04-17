# Tooling update radar (OpenClaw, Hermes, Cursor, n8n)

## What we can automate in CI

| Tool | Upstream signal | Practical automation |
|------|-----------------|----------------------|
| **OpenClaw** | npm package `openclaw` | `npm view openclaw version` vs `openclaw --version` on machines that install it. Repo script: `npm run tooling:radar`. Weekly GitHub Action: `.github/workflows/tooling-radar.yml`. Upgrade: `npm i -g openclaw@latest` (or your installer). |
| **Hermes** | **No npm package** — contract + code in `integrations/hermes-executor-server.mjs`, Edge `hermes-bridge.tsx` | “Updates” = **git pull** + **`npm run deploy:edge:make-server`** when the bridge changes. Contract tests: `tests/hermes-edge-contract.test.mjs`. |
| **Cursor (IDE)** | Desktop app, not an npm dep | **In-app “Check for Updates”**; [Changelog](https://cursor.com/changelog). No reliable headless “latest build” API for CI — do **not** pretend a cron can bump the IDE like npm. Optional: RSS/changelog watcher in n8n or email filter. |
| **cursor-agent CLI** | Ships with Cursor / separate channel | If `cursor-agent` is on `PATH`, `tooling:radar` prints its `--version`. Update follows Cursor install. |
| **n8n** | Only referenced in product **integration catalog** (`src/utils/integration-catalog.ts`), not bundled | Self-hosted n8n: follow [n8n release notes](https://docs.n8n.io/) / Docker tags; use Watchtower or manual upgrades on **your** n8n host — outside this repo. |

## GitHub + Vercel

- **GitHub**: `git push` updates `origin`; Actions run from `.github/workflows/`. If Actions do not run, check **Settings → Actions** (enabled) and branch protection.
- **Vercel**: production HTML must match git — `npm run verify:prod-build`. If push does not deploy, confirm **Project → Settings → Git** connected to **`stringerc/syncscriptE`** and **`main`**, and watch the deployment log for build errors.

## OpenClaw “mission control”

Runtime orchestration stays **separate** from this file: see `integrations/ENGRAM_OPENCLAW.md`, Edge `openclaw-bridge`, and `npm run verify:openclaw:edge-live` when testing live bridges.

**Full stack + operator runbook (browser, ClawHub, Cursor MCP, thin-bridge sketch, “AGI” framing, Mission Control naming):** `integrations/research/OPENCLAW_CLAWHUB_BROWSER_STACK.md`.
