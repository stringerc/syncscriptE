# Hermes — executor agent contract (SyncScript)

**Hermes** is not a vendor product in this repo: it is the **second agent slot** in the Engram + OpenClaw pattern — an HTTP service you run that Engram registers via `POST /api/v1/register` (see [ENGRAM_OPENCLAW.md](./ENGRAM_OPENCLAW.md)).

## Roles

| Agent | Role |
|-------|------|
| **OpenClaw** | General gateway / chat / tools (existing). |
| **Hermes** | Focused **executor**: tasks, calendar holds, CRM-style actions with **idempotent** writes. |

## HTTP contract (Hermes server)

Engram discovery expects liveness on **`GET /health`** or **`GET /healthz`**.

SyncScript **Edge** (`hermes-bridge.tsx`) proxies authenticated clients to:

| Upstream (Hermes) | Method | Purpose |
|---------------------|--------|---------|
| `/v1/tools` | GET | Tool catalog (name, description, JSON Schema). |
| `/v1/invoke` | POST | Execute one tool. |

### POST `/v1/invoke` body

```json
{
  "tool": "apply_task_patch",
  "arguments": {
    "task_id": "task-123",
    "patch": { "completed": true },
    "idempotency_key": "optional-stable-key"
  },
  "idempotency_key": "same-as-inside-args-optional"
}
```

### Recommended tools (v1)

| Tool | Purpose |
|------|---------|
| `list_tools` | Introspection. |
| `apply_task_patch` | Idempotent task update; production should finish by calling **your** task APIs or Supabase so `task.updated` contract events fire from the app layer. |
| `create_calendar_hold` | Reserve time on **Google and/or Outlook** via Edge `POST /calendar/hold` (`provider`: auto \| google \| outlook). With `provider: auto`, optional **`targets`** (`["google"]`, `["outlook"]`, or both) overrides per request; otherwise the user’s **`GET /calendar/hold-preferences`** defaults apply. Response may include **`sync_group_id`** when multiple instances are linked. **After creation**, the app can **`PATCH /calendar/sync-group/:id`** with **`targets`** (and optional title/time) to add/remove provider copies or reschedule — see dashboard calendar linked-hold UI. |

### Response shape (for UI traces)

Hermes should return JSON including:

- `ok` (boolean)
- `run_id` (string) — correlate steps in the **Agent run** dock
- `result` (object) — domain outcome
- `trace` (array) — `{ step, status, detail?, at }` for **progress visibility**

The **mock** server (`npm run hermes:mock`) implements this shape for local/dev.

**Production executor** (`integrations/hermes-executor-server.mjs`, `npm run hermes:executor`): same HTTP surface, but **`apply_task_patch`** performs **`PUT /tasks/:id`** on Supabase Edge (KV task store) and **`create_calendar_hold`** calls **`POST /calendar/hold`** (`provider`: **`auto`** uses **`syncCalendarEventToTargets`** with saved prefs or optional **`targets`**; **`google`** / **`outlook`** for a single provider). Requires:

- **`SYNCSCRIPT_EDGE_BASE`** — `https://<project-ref>.supabase.co/functions/v1/make-server-57781ad9` (no trailing slash).
- **Hermes Edge bridge forwards the user’s `Authorization` JWT** to the executor (`hermes-bridge.tsx`) so actions run as that user.

Oracle/systemd: **`deploy/oracle/systemd/hermes-executor.service`** (default **`install-stack-services.sh`** enables executor and disables **`hermes-mock`**).

## Edge (Supabase)

- **Path:** `/functions/v1/make-server-57781ad9/hermes`
- **Routes:** `GET /health`, `GET /tools`, `POST /invoke`
- **Auth:** Supabase JWT (signed-in user; not guest).
- **Secret:** `HERMES_BASE_URL` on the Edge function environment.

## App visibility (contract events)

The dashboard **Agent run** dock subscribes to window + contract bus events:

- `agent.run.started`
- `agent.run.step`
- `agent.run.completed`
- `agent.run.failed`

Emit from the **client** after `invoke` returns (map `trace[]` → `emitAgentRunStep`), or from app code when your executor completes work. Helpers: `emitAgentRunStarted`, `emitAgentRunStep`, `emitAgentRunCompleted`, `emitAgentRunFailed` in `src/contracts/runtime/contract-runtime.ts`.

**System of record:** keep using `emitContractDomainEvent('task.updated', …)` from task flows when tasks actually change; Hermes traces are **UX**, not the ledger.

## Local smoke

```bash
npm run hermes:mock
# In another shell — register with Engram (see ENGRAM_OPENCLAW.md)
npm run engram:register-agents

curl -sS http://127.0.0.1:18880/v1/tools | head
curl -sS -X POST http://127.0.0.1:18880/v1/invoke \
  -H 'Content-Type: application/json' \
  -d '{"tool":"apply_task_patch","arguments":{"task_id":"demo-1","patch":{"title":"Hi"}}}'
```

## Client

`src/utils/hermes-client.ts` — `fetchHermesBridgeHealth`, `fetchHermesTools`, `invokeHermesTool` (requires user `accessToken`).

Optional: `VITE_HERMES_UI=1` shows the **Agent run** dock chrome by default (otherwise user can expand the dock).

## Production / Edge (definition of done)

1. Set **`HERMES_BASE_URL`** on Supabase: `supabase secrets set HERMES_BASE_URL='https://…' --project-ref kwhnrlzibgfedtxpkbgb`
2. Deploy: `npm run deploy:edge:make-server`
3. Verify: `ENGRAM_LIVE_USE_DEFAULT_PROJECT_URL=1 HERMES_REQUIRE_CONNECTED=1 npm run verify:hermes:edge-live`
4. Vercel: **`VITE_HERMES_ENABLED=1`** (and optional **`VITE_HERMES_UI=1`**) then production deploy so the client bundle includes Hermes + dock.

**Bringup script** (`npm run bringup:hermes:tunnel`):

| Mode | When to use |
|------|-------------|
| Default | Dev: mock + **Quick Tunnel** + secret + deploy (hostname changes when `cloudflared` restarts). |
| `HERMES_BASE_URL_TARGET=https://…` | Executor already on a **stable** URL — only secret + deploy + probe (no tunnel in this shell). |
| `HERMES_NAMED_TUNNEL` + `HERMES_PUBLIC_BASE_URL` | This host runs **named** `cloudflared tunnel run …` with ingress to `127.0.0.1:18880`. |

Step-by-step for named tunnels and VPS: [HERMES_STABLE_TUNNEL.md](./HERMES_STABLE_TUNNEL.md).

**Invoke headers:** `GET …/hermes/health` from curl must send **`Authorization: Bearer <anon>`** and **`apikey: <anon>`** (Supabase Functions requirement), not bare `curl` without auth.
