# Playbook 03 — Hermes / Engram verify

**Static:** `node --test tests/hermes-edge-contract.test.mjs` and `tests/engram-edge-contract.test.mjs`.

**Live Hermes:** `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:hermes:edge-live` (strict: `HERMES_REQUIRE_CONNECTED=1`).

**Live Engram:** `npm run verify:engram:edge-live` (with `.env` if needed).

**Browser → Functions:** use `src/utils/supabase-functions-gateway.ts` (`Authorization` + `apikey`).
