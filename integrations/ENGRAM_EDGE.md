# Engram ↔ SyncScript (Supabase Edge)

## What ships in the repo

| Layer | Path |
|--------|------|
| Edge proxy | `supabase/functions/make-server-57781ad9/engram-bridge.tsx` |
| Route mount | `index.tsx` + `index.ts` → `/make-server-57781ad9/engram` |
| Web client | `src/utils/engram-client.ts`, `src/types/engram.ts` |
| **Hermes proxy** | `supabase/functions/make-server-57781ad9/hermes-bridge.tsx` → `/make-server-57781ad9/hermes` |
| **Hermes client** | `src/utils/hermes-client.ts` — see `integrations/HERMES.md` |

## Supabase secrets (Edge function)

- **`ENGRAM_BASE_URL`** — Public base URL of your Engram API (e.g. `https://engram.yourdomain.com`). No trailing slash.
- **`ENGRAM_UPSTREAM_TOKEN`** — **Required** for `POST /translate` and `POST /delegate`. Must be an Engram access token (EAT) with the scopes Engram expects for those routes (e.g. `translate:a2a` for translate). Used only server-side on Edge; never exposed to the browser.
- For **GET** `/health` and `/discover`, the token is optional: if set, it is forwarded to Engram on upstream GETs (useful when Engram gates discovery).

Redeploy the `make-server-57781ad9` function after setting secrets. From the repo (CLI logged in): `npm run deploy:edge:make-server` uses **`--use-api`** so bundling does not depend on Docker (the default Docker path can hang on some machines).

## Correlation

- Every response includes **`X-Request-ID`**. Clients may send **`X-Request-ID`** or **`X-Correlation-ID`** (trimmed, max 128 chars); otherwise Edge generates a UUID.
- The same id is sent upstream as **`X-Request-ID`** so Engram logs align with Edge and the browser.
- CORS exposes **`X-Request-ID`** so browser clients can read it after cross-origin calls.

## Frontend (Vite)

- **`VITE_ENGRAM_ENABLED`** — Set to `true` only when the Edge bridge is configured and you want the client helpers active. When unset/false, `fetchEngramDiscover` returns `[]` without calling the network.

## Endpoints (via bridge)

Base URL: `https://<project>.supabase.co/functions/v1/make-server-57781ad9/engram`

### Hermes bridge (executor)

Base: `https://<project>.supabase.co/functions/v1/make-server-57781ad9/hermes`

**Supabase Functions gateway:** invoke with **`Authorization: Bearer <SUPABASE_ANON_KEY>`** and **`apikey: <SUPABASE_ANON_KEY>`** (same as other Edge routes), even for `GET /health`.

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | Anon or user JWT | Probes `HERMES_BASE_URL` `/health`, `/healthz`, `/`. |
| GET | `/tools` | **Signed-in user** JWT | Proxies `GET {HERMES}/v1/tools`. |
| POST | `/invoke` | **Signed-in user** JWT | Proxies `POST {HERMES}/v1/invoke`. |

Smoke:

```bash
curl -sS -H "Authorization: Bearer $SUPABASE_ANON_KEY" -H "apikey: $SUPABASE_ANON_KEY" \
  "https://<project>.supabase.co/functions/v1/make-server-57781ad9/hermes/health"
```

Live verify (repo defaults): `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 HERMES_REQUIRE_CONNECTED=1 npm run verify:hermes:edge-live`

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | None | Probes Engram until one of `GET /`, `/health`, or `/healthz` returns **2xx** (same order as `probeEngramLiveness` in the bridge). Response JSON includes `probePath` when connected. |
| GET | `/discover` | Supabase JWT; **signed-in only** (anon/guest **403**) | Proxies `GET /api/v1/discover` on Engram. |
| POST | `/translate` | Same as discover + **`ENGRAM_UPSTREAM_TOKEN`** on Edge | Proxies `POST /api/v1/translate`. Body max **256 KiB** JSON. |
| POST | `/delegate` | Same as discover + **`ENGRAM_UPSTREAM_TOKEN`** on Edge | Proxies `POST /api/v1/delegate`. Body max **256 KiB** JSON. |

`POST /api/v1/register` is **not** exposed through this bridge — register agents via your secure ops path or direct Engram (e.g. local `lab:agents`).

### Smoke (replace placeholders)

```bash
# Health (no JWT)
curl -sS -D - "https://<project>.supabase.co/functions/v1/make-server-57781ad9/engram/health" -o /dev/null

# Discover (real Supabase user JWT)
curl -sS -H "Authorization: Bearer <SUPABASE_JWT>" \
  "https://<project>.supabase.co/functions/v1/make-server-57781ad9/engram/discover"

# Translate (signed-in user + body matches Engram TranslateRequest)
curl -sS -X POST \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"source_agent":"<uuid>","target_agent":"<uuid>","payload":{}}' \
  "https://<project>.supabase.co/functions/v1/make-server-57781ad9/engram/translate"

# Delegate (signed-in user + Engram DelegateRequest)
curl -sS -X POST \
  -H "Authorization: Bearer <SUPABASE_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"command":"example intent","source_agent":"SyncScript"}' \
  "https://<project>.supabase.co/functions/v1/make-server-57781ad9/engram/delegate"
```

## Local lab

Docker Engram on `localhost:8000` is not reachable from Supabase Edge. Use a tunnel (Cloudflare, ngrok) or deploy Engram to a public HTTPS URL for end-to-end Edge tests.

### Cloudflare Quick Tunnel (this repo)

With **`cloudflared`** installed and Engram (or any HTTP server) listening on **`127.0.0.1:8000`**:

```bash
npm run tunnel:engram-local
```

Copy the printed **`https://….trycloudflare.com`** origin (no trailing slash), then:

```bash
supabase secrets set ENGRAM_BASE_URL='https://YOUR-SUBDOMAIN.trycloudflare.com' --project-ref kwhnrlzibgfedtxpkbgb
npm run deploy:edge:make-server
```

Quick Tunnel URLs **change each time** you restart `cloudflared`; update the secret when the hostname changes. Keep the tunnel process running while Supabase Edge and browsers should reach Engram.

## Definition of done (strict)

Use this before calling the integration “complete” for a release:

1. **Repo checks (no cloud secrets):** `npm test` passes (includes `tests/engram-edge-contract.test.mjs`). Optionally `npm run verify:engram:contract`.
2. **Local Engram (Docker):** API up on `127.0.0.1:8000`; `npm run verify:engram` passes (Swagger + OpenAPI).
3. **Frontend bundle:** `CI=true npm run build` succeeds (disables prerender that depends on a local Chrome; Vercel/CI uses the same pattern).
4. **Supabase Edge:** Secrets `ENGRAM_BASE_URL` (and `ENGRAM_UPSTREAM_TOKEN` if you use POST routes) set on `make-server-57781ad9`; function redeployed.
5. **Live smoke:** `GET …/engram/health` returns `200` with `engramStatus: "connected"` and `X-Request-ID` header. `GET …/engram/discover` with a real user JWT returns `200` and JSON array (or Engram error body with matching upstream status).
6. **POST routes:** Only after (4): `POST …/translate` with valid `TranslateRequest` body returns Engram’s response or a clear validation error (not `401` from missing EAT on the upstream token).

**Out of scope for “finished in repo”:** Your deployed Supabase project URL and JWTs are environment-specific; the checklist above separates **automated repo verification** from **live tenant verification**.

## Automated verification (reference)

| Command | What it proves |
|-----------|----------------|
| `npm test` | Contract test: bridge routes, mount paths, `api/v1/*` paths, docs pointers. |
| `npm run verify:engram` | Running Engram: `/`, `/docs`, `/openapi.json` (requires Docker stack on `:8000`). |
| `CI=true npm run build` | Vite production bundle without prerender Puppeteer. |
| `npm run verify:engram:edge-live` | **Live Edge** (needs `SUPABASE_URL` in `.env`): `GET …/engram/health`, validates `X-Request-ID` + JSON. Optional `ENGRAM_LIVE_USER_JWT` exercises `/discover`. Does **not** print secrets. |
| `npm run release:gate:engram` | Full repo gate: contract + `npm test` + `CI=true` build + live Edge probe (uses public project URL + anon key; **404 tolerated** via `ENGRAM_LIVE_ALLOW_NOT_DEPLOYED` until you deploy the function). |
| `npm run release:gate:engram:strict` | Same as above but **fails** if the Engram route is missing on Edge (404) or health checks fail — use after `supabase functions deploy`. |

**Credentials:** Supabase Edge secrets (`ENGRAM_BASE_URL`, etc.) are configured in the **Supabase dashboard**, not in Vite. The live script only needs your **project URL** to reach the deployed function; it never prints tokens or keys.

**Local `.env`:** Add `SUPABASE_URL` or `VITE_SUPABASE_URL` (same value as in the Supabase project settings) so `npm run verify:engram:edge-live` can run. If those variables are missing, the script **exits 0** and prints a skip message (so CI without Supabase does not fail).

**GitHub Actions:** Workflow **`Edge bridges live verify`** (`.github/workflows/edge-bridges-live.yml`) runs **Hermes** and **Engram** live probes on a schedule (every 8 hours UTC), on **push** to `main` when bridge or verify scripts change, and via **`workflow_dispatch`**. Optional secrets: **`SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`** / **`SUPABASE_ANON_KEY`**, **`ENGRAM_LIVE_USER_JWT`**. Optional **Variables**: `HERMES_LIVE_REQUIRE_CONNECTED`, `ENGRAM_LIVE_REQUIRE_CONNECTED`, `ENGRAM_LIVE_ALLOW_NOT_DEPLOYED` (see workflow comments).
