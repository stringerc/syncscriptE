# Nexus (`nexus-user`) — observability, SLO hooks, and quality bar

This document closes the gap between **strong code** and **provable operations**: where traces live, what to sample in production, and how regression tests stay green.

## Same-origin API routes (client)

**Canonical paths:** `src/config/nexus-vercel-ai-routes.ts`

- **`NEXUS_USER_CHAT_PATH`** — `/api/ai/nexus-user` (signed-in App AI + tools)
- **`NEXUS_GUEST_CHAT_PATH`** — `/api/ai/nexus-guest` (guest / rate-limited)
- **`NEXUS_POST_CALL_SUMMARY_PATH`** — `/api/ai/nexus-post-call-summary`

Never hard-code `https://www.syncscript.app/api/ai/...` in dashboard code: local **`vite`**, **preview**, and **staging** must hit the same handlers as production.

## Trust boundary (server)

| Control | Location |
|--------|----------|
| JWT required for tools | `api/ai/nexus-user.ts` (`enableTools` → `getAuthenticatedSupabaseUser`) |
| Private context allowlist | `api/ai/_lib/nexus-context-firewall.mjs` → `sanitizePrivateContext` |
| Tool loop bounds + nudges | `api/_lib/nexus-tool-loop.ts` (`MAX_TOOL_ROUNDS`, repair paths) |

**Red-team / regression:** `tests/nexus-context-firewall.test.mjs` (extend with new allowlist edge cases as threats evolve).

## Structured telemetry (`emitNexusTrace`)

Each `nexus-user` response path emits **one JSON log line** per request (Vercel stdout / log drains):

```json
{"nexus_trace":"v1","ts":"…","surface":"user","requestId":"nx_…","outcome":"ok","pathway":"tools","brainVersion":"…","latencyMs":123,"model":"…","provider":"…","httpStatus":200,"responseChars":456,"toolTraceEntries":2,"toolRepairNudged":false}
```

**Never** includes raw user text or private context payloads — only lengths and metadata (`api/ai/_lib/nexus-brain/telemetry.ts`).

### Production sampling (practical)

1. **Vercel** → Project → Logs — filter: `"nexus_trace":"v1"` and `surface":"user"`.
2. **Weekly spot check:** share of `pathway":"tools"` vs `"llm"`, p95 `latencyMs`, rate of `toolRepairNudged":true` (model needed a nudge).
3. **Alerts (optional next step):** ship logs to **Axiom / Datadog / Grafana Loki** and chart:
   - `outcome != ok` by `errorCode`
   - `toolRepairNudged == true` rate (threshold alert if it spikes — model or prompt drift)

### SLO ideas (set your own targets)

| Signal | Suggested starting point |
|--------|---------------------------|
| Availability | `outcome: ok` / all traces ≥ 99% weekly |
| Latency | p95 `latencyMs` &lt; T ms for your UX bar |
| Tool reliability | `toolTraceEntries > 0` and HTTP 200 but user reports failure → investigate `toolTrace` client-side |

## Contract tests (CI)

`npm test` includes:

- `tests/nexus-context-firewall.test.mjs`
- `tests/nexus-client-route-consistency.test.mjs` (no prod-only Nexus URLs in key clients)
- `tests/nexus-tools-contract.test.mjs`, `tests/nexus-update-document-contract.test.mjs`, `tests/nexus-task-hardening.test.mjs`, map/CSP suites — see **`MEMORY.md`** quick context

## Tool-calling eval sets (future hardening)

Not automated in-repo yet. Recommended manual / offline harness:

1. Fixed user utterances per tool (`create_task`, `create_document`, `update_document`, `send_invoice`, …).
2. Assert **tool name** + **minimal argument shape** in recorded traces (no production secrets).
3. Run against **staging** with a dedicated test user (`NEXUS_LIVE_TEST_*` — see **`MEMORY.md`** § bootstrap).

## Related

- **`MEMORY.md`** — Nexus voice / App AI operational truth
- **`api/ai/nexus-user.ts`**, **`api/_lib/nexus-tool-loop.ts`**
