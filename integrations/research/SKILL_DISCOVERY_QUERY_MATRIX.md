# Skill discovery query matrix — SyncScript (read-only)

**Purpose:** Map **ClawHub `search` phrases** (and similar) to **what we already have in-repo** so triage stays honest: discovery often surfaces **overlap** with bundled OpenClaw skills or our own stack — **install is optional**, not automatic.

**Run:** `SKILL_AUDIT_QUERY_FILE=scripts/skill-audit-queries-syncscript.txt npm run skill:source-audit` (or set `SKILL_AUDIT_QUERIES` manually).

| Area | Example queries | In-repo first (before ClawHub) |
|------|-----------------|----------------------------------|
| **UX / UI** | `ux`, `ui`, `design-tokens`, `a11y`, `tailwind` | `.cursor/rules/11-ux-ui-excellence.mdc`, `globals.css` tokens, landing guardrails |
| **Deploy** | `vercel`, `deploy`, `ci`, `docker` | `vercel.json`, Edge functions, `deploy/` runbooks |
| **Testing** | `playwright`, `e2e`, `jest`, `vitest`, `smoke-test` | `e2e/`, `tests/`, `npm test`, Playwright specs |
| **Observability** | `monitoring`, `healthcheck`, `logging`, `slack` | API telemetry patterns, `verify:*` scripts, OpenClaw bridge health |
| **Security / data** | `security`, `secrets`, `supabase`, `rls`, `postgres` | Supabase RLS, Edge auth — **never** replace with unvetted skill |
| **Agents** | `openclaw`, `mcp`, `cursor`, `nexus`, `voice`, `tts` | `openclaw-bridge`, Nexus manifests, Kokoro/voice pipeline docs |

**Limits:** ClawHub search is **not** exhaustive of “every skill ever.” This matrix is **coverage of intent**, not a guarantee of completeness.
