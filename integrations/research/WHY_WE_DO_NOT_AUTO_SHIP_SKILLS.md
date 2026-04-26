# Why SyncScript does not auto-ship ClawHub skills into the product

**This document implements the architectural decision** (team policy as code-adjacent docs):

- **No** bulk ClawHub installs into production OpenClaw gateways from cron or CI.
- **No** automatic merges of third-party skill code into **syncscript.app**, **Vercel**, or **Supabase Edge** based on audit heuristics.
- **No** replacement of **`openclaw-bridge`** with unvetted third-party bundles.

## Reasons (fact-based)

1. **Registry risk:** ClawHub’s own **`inspect`** can label skills **`Security: SUSPICIOUS`**.
2. **Overlap:** Many “skills” duplicate **bundled** OpenClaw capabilities (`github`, browser tooling).
3. **Scope:** SyncScript’s guarantees (auth, RLS, voice, billing) require **contract tests** — not opaque skill installs.
4. **“Newest” ≠ “best”** for your roadmap.

## What we do instead

- **Read-only** `npm run skill:source-audit` (expanded queries in `scripts/skill-audit-queries-syncscript.txt`).
- **Human triage** (`SKILL_TRIAGE_PLAYBOOK.md`, GitHub issue template).
- **Weekly CI artifact** for review — not auto-merge.

See also: **`SKILL_AUDIT_AUTOMATION_POLICY.md`**.
