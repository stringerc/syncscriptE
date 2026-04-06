# Playbook 03 — Hermes / Engram verify

**Static:** `node --test tests/hermes-edge-contract.test.mjs` and `tests/engram-edge-contract.test.mjs`.

**Live Hermes:** `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:hermes:edge-live` (strict: `HERMES_REQUIRE_CONNECTED=1`).

**Live Engram:** `npm run verify:engram:edge-live` (with `.env` if needed).

**CI / GitHub:** `.github/workflows/edge-bridges-live.yml` runs both live scripts on a schedule, on relevant pushes, and on manual dispatch. Tune behavior with repo **Variables** (see workflow file).

**Browser → Functions:** use `src/utils/supabase-functions-gateway.ts` (`Authorization` + `apikey`).
