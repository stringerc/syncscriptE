# Engram + OpenClaw + a second MCP agent (“Hermes”)

This guide matches [Engram’s README](https://github.com/kwstx/engram_translator) and SyncScript’s existing OpenClaw gateway.

## What you get

- **Engram** (`localhost:8000`): protocol translation and routing between registered agents.
- **OpenClaw**: your existing gateway (default `http://127.0.0.1:18789` locally, or `OPENCLAW_BASE_URL` on EC2 — see Supabase `openclaw-bridge`).
- **Hermes** (or any other MCP server): not bundled here — register whatever exposes a reachable **HTTP MCP endpoint** as a second agent.

## 1) Run Engram

From the cloned repo:

```bash
cd integrations/engram_translator
docker compose up --build -d
```

Open **http://localhost:8000/docs**.

### If `/docs` shows a blank or half-broken page

**Cause A — Content-Security-Policy:** A global `default-src 'self'` blocks Swagger’s CDN scripts and inline bootstrapping.

**Cause B — security headers on the HTML response:** Even `X-Frame-Options` / `nosniff` can interfere with some Swagger builds.

**Fix (in this repo’s `integrations/engram_translator` copy):**

1. **`app/main.py`** — Security middleware **returns early** for `/docs`, `/redoc`, and `/openapi.json` / `/openapi.yaml` (no CSP/HSTS/nosniff on those responses).
2. **Explicit Swagger/ReDoc** — `docs_url=None` / `redoc_url=None` on `FastAPI()`, then `get_swagger_ui_html` / `get_redoc_html` registered **after** all routers, with pinned `swagger-ui-dist@5` CDN URLs.
3. **`docker-compose.yml`** — `HTTPS_ONLY=false` and `RATE_LIMIT_ENABLED=false` on the `app` service for local Swagger (avoids HTTPS redirects and rate-limit edge cases).

Rebuild:

```bash
cd integrations/engram_translator
docker compose down
docker compose up --build -d
```

**Automated smoke check (from repo root):**

```bash
./integrations/verify-engram-docs.sh http://127.0.0.1:8000
```

**Manual checks:**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/
curl -sS http://127.0.0.1:8000/docs | head -c 400
curl -sS http://127.0.0.1:8000/openapi.json | head -c 120
```

Expect: `200` on `/` and `/docs`, HTML containing `swagger`, and JSON starting with `{"openapi"` from `/openapi.json`. If `/openapi.json` errors, inspect `docker compose logs app` (often DB not ready on first boot).

## 2) Register OpenClaw as an MCP-capable agent

From the **host** (Mac/Windows), Docker containers must reach the gateway:

- If OpenClaw runs on the host at `127.0.0.1:18789`, use **`http://host.docker.internal:18789`** (Docker Desktop) as `endpoint_url` in Engram’s register call.
- If OpenClaw is on another machine (e.g. EC2), use that public URL and port.

**Important:** `POST /api/v1/register` expects **`agent_id` as a UUID**, not a free-form string.

Start the gateway on the host. If your `~/.openclaw/openclaw.json` references providers that need secrets (for example NVIDIA NIM), export them first or use a placeholder so the process can boot:

```bash
npm run openclaw:gateway
# same as: NVIDIA_API_KEY=placeholder openclaw gateway run --port 18789 --force --bind loopback
```

OpenClaw reports health on **`/healthz`** (Engram’s discovery checks **`/health`** first, then **`/healthz`** — see `engram-overrides`).

### One-shot registration (OpenClaw + Hermes mock)

1. Terminal A — Engram (if not already): `npm run setup:engram:up`
2. Terminal B — OpenClaw gateway: `openclaw gateway run --port 18789 --bind loopback`
3. Terminal C — Hermes **mock** (for a second agent to test routing): `npm run hermes:mock`
4. Terminal D — register both with Engram:

```bash
npm run engram:register-agents
```

Optional env overrides: `ENGRAM_BASE`, `OPENCLAW_ENDPOINT`, `HERMES_ENDPOINT`, `OPENCLAW_AGENT_ID`, `HERMES_AGENT_ID` (all must be UUIDs for `agent_id`).

## 3) Register your real “Hermes” MCP agent

Same pattern: run your Hermes MCP server so it exposes **HTTP** `GET /health` or `GET /healthz`, then register with a **distinct UUID** `agent_id` and `endpoint_url` (use `host.docker.internal` when Engram is in Docker).

## 4) Auth and translation

Engram’s docs describe **EAT** tokens and `/api/v1/beta/translate` and `/api/v1/delegate`. Follow [Engram’s docs](https://docs.useengram.com) for signing up and obtaining a bearer token.

## 5) SyncScript app

Engram runs as a **sidecar** alongside OpenClaw. The web app can call Engram **through Supabase Edge** (`engram-bridge`) when `VITE_ENGRAM_ENABLED=1` — see `src/utils/engram-client.ts` and `integrations/ENGRAM_EDGE.md`.

For the **executor (“Hermes”)** slot: see **`integrations/HERMES.md`** — Edge route `/make-server-57781ad9/hermes`, client `src/utils/hermes-client.ts`, and the **Agent run** dock (`AgentRunDock`) for structured `agent.run.*` visibility.

## Verification checklist

| Step | Check |
|------|--------|
| Engram | `GET http://localhost:8000/docs` loads |
| OpenClaw | `curl` health on your gateway (e.g. `/api/health` if exposed) |
| Registration | Engram accepts both `register` payloads (HTTP 2xx) |

## References

- [kwstx/engram_translator on GitHub](https://github.com/kwstx/engram_translator)
- SyncScript OpenClaw bridge: `supabase/functions/make-server-57781ad9/openclaw-bridge.tsx`
- **Agent browser + ClawHub + Cursor integration model (SyncScript):** `integrations/research/OPENCLAW_CLAWHUB_BROWSER_STACK.md`
