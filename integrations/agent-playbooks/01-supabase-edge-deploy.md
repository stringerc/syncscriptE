# Playbook 01 — Supabase Edge deploy

**Goal:** Deploy `make-server-57781ad9` (Hono: OpenClaw, Engram, Hermes, …).

```bash
npm run deploy:edge:make-server
```

Requires Supabase CLI + login. Prefer **`--use-api`** (already in script) over Docker bundle.

**After:** `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:hermes:edge-live` (add `HERMES_REQUIRE_CONNECTED=1` when executor must be up). Engram: `npm run verify:engram:edge-live`.

Secrets: `supabase secrets set …` — see `HERMES.md`, `MEMORY.md`.
