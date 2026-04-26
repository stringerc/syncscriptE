# Third-party integration stacks

## Engram Translator + OpenClaw (+ your second MCP agent)

[Engram](https://github.com/kwstx/engram_translator) is an interoperability layer (A2A ↔ MCP ↔ ACP) that routes between registered agents. SyncScript already talks to **OpenClaw** via the gateway (see `OPENCLAW_BASE_URL` / local `127.0.0.1:18789` in `MEMORY.md` and Supabase `openclaw-bridge`).

### What was added here

- **`engram_translator/`** — optional local clone of the upstream repo (see `.gitignore`; large tree is not committed).
- **`engram-overrides/`** — patches applied on top of upstream so Docker builds and the API boot: Swagger/CSP (`app-main.py`), `.env` / `docker-compose.override.yml`, `.dockerignore` (upstream `*.txt` hid `requirements.txt`), `requirements.txt` (drops nonexistent `phi-3-client`), SQLAlchemy `spec_metadata` rename + call sites, `ValidationError`, Alembic baseline (`import sqlmodel`) + follow-up migration for `agent_registry` columns, discovery (`/health` + `/healthz`), `GET /discover?protocol=` filter, etc. **`setup-engram.sh` copies these into the clone** (same as CI).
- **`hermes-mock-server.mjs`** + **`register-openclaw-and-hermes.sh`** — second “Hermes” agent for local testing (`npm run hermes:mock` + `npm run engram:register-agents`). OpenClaw: `npm run openclaw:gateway` (sets `NVIDIA_API_KEY` placeholder if missing so the gateway can start).
- **`ensure-agent-lab.sh`** — one command to start anything that’s down (Engram via `setup:engram:up`, Hermes mock, OpenClaw gateway) and register both agents: **`npm run lab:agents`**.
- **Production-style Edge bridge** — **`integrations/ENGRAM_EDGE.md`** (Supabase env + `src/utils/engram-client.ts`). Static contract tests: **`tests/engram-edge-contract.test.mjs`** (`npm run verify:engram:contract`, included in **`npm test`**). Full automation gate: **`npm run release:gate:engram`** (contract + tests + `CI=true` build + optional live Edge smoke when `SUPABASE_URL` is in `.env`).
- **`ENGRAM_OPENCLAW.md`** — how to run Engram with Docker and register **OpenClaw** plus a second MCP agent (e.g. a “Hermes” server you host).

### Quick start

**One step (clone + apply overrides):** from the repo root:

```bash
npm run setup:engram
```

That runs `integrations/setup-engram.sh`, which clones `engram_translator` if missing and copies **`engram-overrides/`** into the clone (same files CI uses).

**Bring up Docker and verify** (Docker Desktop must be running):

```bash
npm run setup:engram:up
```

Or manually:

```bash
cd integrations/engram_translator
docker compose up --build -d db redis
sleep 15
docker compose up --build -d app
cd ../.. && npm run verify:engram
```

Open **http://localhost:8000/docs** (Swagger).

### Why Cursor can’t “see” your localhost:8000

The AI sandbox **does not run Docker** and **cannot reach your Mac’s loopback**. Verifying `http://localhost:8000/docs` requires either:

1. **You** run `npm run verify:engram` (or `./integrations/verify-engram-docs.sh`) after `docker compose up`, or  
2. **GitHub Actions** — workflow **`Verify Engram Swagger`** (`.github/workflows/verify-engram-docs.yml`) clones the upstream repo, applies `integrations/engram-overrides/`, runs Docker on **GitHub’s `ubuntu-latest`**, and curls **`127.0.0.1:8000`** on that runner. That is the **same verification** as a local machine with Docker.

### “Hermes agent”

There is no fixed “Hermes” binary inside Engram; it is a **second MCP (or A2A) endpoint** you run and register with Engram’s `POST /api/v1/register`, same as OpenClaw. Point `endpoint_url` at whatever host/port your Hermes stack exposes.
