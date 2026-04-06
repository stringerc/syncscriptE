---
description: Run Hermes and Engram contract + live verify scripts
---

Follow **`integrations/agent-playbooks/03-hermes-engram-contract-verify.md`**.

Quick: `node --test tests/hermes-edge-contract.test.mjs` and `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 npm run verify:hermes:edge-live`.

**CI:** GitHub Actions workflow **`Edge bridges live verify`** (`.github/workflows/edge-bridges-live.yml`) runs both live scripts on a schedule and on push; use **Actions → Run workflow** for manual dispatch.
