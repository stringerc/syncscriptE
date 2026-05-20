# SyncScript — where OpenClaw, resonance, and homeostasis live

This file exists so **humans and agents** can find integration surfaces without guessing. It is the canonical index for this repo.

**Agents:** read this file when the task touches AI routing, scheduling resonance, or desktop avatar verification — it avoids mixing up three different systems.

### Desktop companion naming (current)

| Item | Value |
|------|--------|
| Product / HUD | **Nature Companion** (replaces “Nature Cortana” in UI strings) |
| Preload bridge | `window.companionEnv` (preferred); `window.cortanaEnv` is the **same object** (legacy alias) |
| Verify screenshots | `screenshots/companion-<label>-*.png` — `face_eval.py` and `verify_limb_shot.cjs` also accept older `cortana-*` files |
| Clean backdrop key | `localStorage.companionStudioBackdrop` (reads legacy `cortanaStudioBackdrop` too) |

---

## OpenClaw (AI gateway + bridge)

| Layer | Path | Notes |
|--------|------|--------|
| **Web app client** | `src/utils/openclaw-client.ts` | HTTP client, retries, demo fallback |
| **WebSocket** | `src/utils/openclaw-websocket.ts` | Real-time channel |
| **React context** | `src/contexts/OpenClawContext.tsx` | `OpenClawProvider`, `useOpenClaw`; base URL defaults to Supabase function `…/make-server-57781ad9/openclaw` |
| **Types** | `src/types/openclaw.ts` | Request/response contracts |
| **Supabase Edge bridge** | `supabase/functions/make-server-57781ad9/openclaw-bridge.tsx` | Routes `/make-server-57781ad9/openclaw/*`; proxies to EC2 OpenClaw when `OPENCLAW_BASE_URL` / `OPENCLAW_TOKEN` are set |
| **Route registration** | `supabase/functions/make-server-57781ad9/index.tsx` (and `index.ts`) | `app.route('/make-server-57781ad9/openclaw', openclawBridge)` |
| **Security helpers** | `supabase/functions/make-server-57781ad9/openclaw-security.tsx` | Filtering / hardening |

**Env (deploy / local):** `OPENCLAW_BASE_URL`, `OPENCLAW_TOKEN` (see bridge file). **Frontend** often uses Supabase anon + session token via `OpenClawContext`.

---

## Engram (agent registry / discovery / orchestration — optional)

| Layer | Path | Notes |
|--------|------|--------|
| **Edge proxy** | `supabase/functions/make-server-57781ad9/engram-bridge.tsx` | `GET /health` (multi-path upstream probe: `/`, `/health`, `/healthz`), `GET /discover`, `POST /translate`, `POST /delegate`; **`X-Request-ID`** end-to-end; **no** `register` exposed here |
| **Route** | `/functions/v1/make-server-57781ad9/engram/*` | Mounted in `index.tsx` / `index.ts` next to OpenClaw |
| **Client** | `src/utils/engram-client.ts` | Uses `VITE_ENGRAM_ENABLED`; calls Edge, not Engram directly |
| **Types** | `src/types/engram.ts` | Registry rows, bridge health, translate request shape |
| **Contract tests** | `tests/engram-edge-contract.test.mjs` | Static checks (routes, paths, docs); `npm test` |
| **Ops / local Docker** | `integrations/ensure-agent-lab.sh`, `integrations/ENGRAM_EDGE.md` | Lab uses `localhost`; Edge needs public `ENGRAM_BASE_URL` |

**Edge secrets:** `ENGRAM_BASE_URL`; `ENGRAM_UPSTREAM_TOKEN` **required** for `POST /translate` and `POST /delegate` (Engram EAT with correct scopes). Optional for GETs if Engram gates discovery. **Frontend:** `VITE_ENGRAM_ENABLED=true` when the bridge is live.

**Verification:** `npm test` (includes contract), `npm run verify:engram` (Docker Engram on `:8000` + Swagger), `CI=true npm run build` (bundle without local Puppeteer prerender), `npm run verify:engram:edge-live` (public project URL + anon when env unset), `npm run release:gate:engram` (full gate; tolerates **404** until Edge is deployed), `npm run release:gate:engram:strict` (fails if Engram route missing on Edge). GitHub: manual workflow **Engram Edge live smoke** (optional secret `SUPABASE_URL`; else same defaults as the client).

---

## Hermes (executor MCP — second agent slot)

| Layer | Path | Notes |
|--------|------|--------|
| **Contract doc** | `integrations/HERMES.md` | Tool schema, `agent.run.*` events, Edge policy |
| **Edge proxy** | `supabase/functions/make-server-57781ad9/hermes-bridge.tsx` | `GET /health`, `GET /tools`, `POST /invoke` → upstream `HERMES_BASE_URL` |
| **Route** | `/functions/v1/make-server-57781ad9/hermes/*` | Mounted in `index.tsx` / `index.ts` |
| **Client** | `src/utils/hermes-client.ts` | `VITE_HERMES_ENABLED`; JWT to Edge |
| **Mock server** | `integrations/hermes-mock-server.mjs` | `npm run hermes:mock` — `GET /v1/tools`, `POST /v1/invoke` |
| **UI dock** | `src/components/agent/AgentRunDock.tsx`, `src/contexts/AgentRunContext.tsx` | Subscribes to `agent.run.*` contract events; optional `VITE_HERMES_UI=1` |
| **Contract tests** | `tests/hermes-edge-contract.test.mjs` | Included in `npm test` |

**Edge secret:** `HERMES_BASE_URL` (executor HTTP origin). Register the same URL with Engram (`integrations/register-openclaw-and-hermes.sh`).

**Desktop shell (Electron)** — same bridge, from main process:

| Item | Path |
|------|------|
| Default chat URL | `nature-cortana-platform/desktop-shell/src/main.cjs` — `DEFAULT_OPENCLAW_CHAT_URL` |
| IPC | `preload.cjs` → `desktopCompanion.openclawNextBehavior` → `ipcMain.handle('openclaw:next-behavior', …)` |
| Docs | `nature-cortana-platform/README.md` — `OPENCLAW_BRIDGE_URL`, `OPENCLAW_BEHAVIOR_URL`, `OPENCLAW_ANON_TOKEN` |

Agents editing **SyncScript web** should start at `OpenClawContext.tsx` + `openclaw-bridge.tsx`. Agents editing **desktop companion** should start at `main.cjs` + preload.

---

## “Resonance” (scheduling / energy product — **not** the overlay tuner)

This is the **task–schedule resonance calculus** in the main app (energy-aware scheduling, etc.):

| Area | Path |
|------|------|
| Core score | `src/utils/resonance-calculus.ts` |
| Multi-factor | `src/utils/resonance-multi-factor.ts`, `resonance-calibration.ts` |
| React hook | `src/hooks/useResonance.ts`, `useResonanceEnergyMultiplier.ts` |
| Energy tie-in | `src/contexts/EnergyContext.tsx` (resonance multipliers on tasks) |

**Protected:** `src/utils/energy-system.ts`, `src/hooks/useEnergyPrediction.ts` — do not modify per workspace rules unless explicitly approved.

---

## “Resonance homeostasis” (desktop **overlay** verification)

In this repo the phrase **does not** mean the resonance calculus above. It means **runtime tuning** for the **Nature Companion** desktop overlay (3D avatar verification loop):

| Artifact | Path |
|----------|------|
| **Directives (weights / flags)** | `nature-cortana-platform/desktop-shell/runtime-reports/homeostasis-directives.json` |
| **Memory / best capture pointer** | `nature-cortana-platform/desktop-shell/runtime-reports/homeostasis-memory.json` |
| **Main process injects into renderer** | `main.cjs` reads directives and passes `homeostasis` on the overlay runtime config / status path (see `HOMEOSTASIS_DIRECTIVES_FILE`, `get-runtime-config`) |
| **Renderer consumes** | `desktop-shell/src/overlay.js` — `runtimeHomeostasis`, `DEFAULT_HOMEOSTASIS` |

**Also documented in:** `nature-cortana-platform/desktop-shell/README.md` (short paragraph on homeostasis + `runtime-reports`).

---

## Quick mental model

1. **OpenClaw** = external AI + Supabase bridge + client/context (full-stack).
2. **Resonance (product)** = math + hooks for **when** to do work (main SyncScript app).
3. **Homeostasis (desktop)** = **JSON knobs** + main→overlay pipe for **avatar/visual verification**, not chat memory.

---

## Related runbooks

- `src/OPENCLAW_IMPLEMENTATION_READINESS.md`, `src/OPENCLAW_JARVIS_RUNBOOK.md` — mission / policy surfaces (when applicable).
