# SyncScript Cursor MCP

Model Context Protocol (stdio) server that calls your **Supabase Edge** deployment `make-server-57781ad9` — the same surface the web app uses for tasks, productivity, calendar holds, and profile.

## Prerequisites

1. Apply migrations `20260427090000_activity_business_plan_api_tokens.sql` and `20260427120000_user_capture_inbox.sql` (`supabase db push`).
2. Deploy Edge: `npm run deploy:edge:make-server` (from repo root).
3. In SyncScript **Settings → Privacy**, create a **PAT** (or use a short-lived Supabase JWT — PAT is easier for Cursor).
4. **Optional regression (signed-in UI + Edge):** from repo root, set `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` (or `NEXUS_LIVE_TEST_*`) in `.env`, then run `npm run test:e2e:signed-in-productivity`. This Playwright spec hits `GET /activity/summary`, `POST`+`DELETE /api-tokens`, and `GET /friends/activity-feed` on the live app (`PLAYWRIGHT_BASE_URL`, default prod).

## Install

```bash
cd integrations/cursor-syncscript-mcp
npm install
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `SYNCSCRIPT_EDGE_BASE` | yes | e.g. `https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9` |
| `SYNCSCRIPT_BEARER` | yes | `sspat_…` token **or** Supabase `eyJ…` access token |
| `SYNCSCRIPT_PAT` / `NEXUS_PAT` | no | Aliases: if set and `SYNCSCRIPT_BEARER` is empty, the server copies one of them into `SYNCSCRIPT_BEARER`. |
| `SUPABASE_ANON_KEY` | yes | Same `anon` `apikey` header the dashboard sends (public, from Supabase project settings). |

### Troubleshooting

- **Cursor lists the server as `user-syncscript`** — that is normal (Cursor prefixes `user-` to the key you used in `mcp.json`, e.g. `syncscript`).
- **`401 {"error":"Unauthorized"}`** — Edge did not accept your auth. Fix one of:
  1. **Missing token:** Cursor **does not** load your shell `export` from `.zshrc`. Put `SYNCSCRIPT_BEARER=sspat_…` in the SyncScript repo **`.env`** (loaded automatically), **or** add `"SYNCSCRIPT_BEARER": "sspat_…"` under the `syncscript` entry’s `"env"` in `~/.cursor/mcp.json`. If you previously set `"SYNCSCRIPT_BEARER": ""`, remove that key or leave `env` as `{}` — an empty string is treated as unset so **`.env` can still supply the token**.
  2. **Wrong / expired PAT:** Revoke the old token and create a new PAT in **syncscript.app → Settings → Privacy**. For tasks smoke tests you need at least **`tasks:read`** and **`tasks:write`** (new PATs default to a broad scope set; old PATs keep their old scopes until replaced).
  3. **Do not** put the Supabase **anon** key in `Authorization`; it must be **`apikey`** only. The **bearer** must be your **PAT** (`sspat_…`) or a real **user JWT** (`eyJ…`).

After changing `mcp.json` or `.env`, **reload MCP** or restart Cursor.

**`envFile` (Cursor):** You can point the server at the repo `.env` so `SYNCSCRIPT_BEARER` is not stored inside JSON — see `mcp.cursor.workspace.example.json` (project) or set `"envFile": "/absolute/path/to/syncscript/.env"` on the `syncscript` entry in `~/.cursor/mcp.json`.

## Cursor MCP config (example)

**User-level** `~/.cursor/mcp.json` (recommended) so the server works from **any** workspace (e.g. Custody), not only when SyncScript is the open folder.

Minimal entry — `server.mjs` loads `/ABSOLUTE/PATH/syncscript/.env` for `SYNCSCRIPT_BEARER` (and optional overrides) and applies the same public Edge URL + anon defaults as the web app when those are unset:

```json
{
  "mcpServers": {
    "syncscript": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/syncscript/integrations/cursor-syncscript-mcp/server.mjs"],
      "env": {}
    }
  }
}
```

Add `SYNCSCRIPT_BEARER=sspat_…` (PAT from **syncscript.app → Settings → Privacy**) to the SyncScript repo `.env` (gitignored). Alternatively keep secrets only in Cursor and use an explicit `env` block:

```json
{
  "mcpServers": {
    "syncscript": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/syncscript/integrations/cursor-syncscript-mcp/server.mjs"],
      "env": {
        "SYNCSCRIPT_EDGE_BASE": "https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9",
        "SYNCSCRIPT_BEARER": "sspat_your_token_here",
        "SUPABASE_ANON_KEY": "your_anon_key"
      }
    }
  }
}
```

## Tools

| Tool | Edge method | PAT scope (when using PAT) |
|------|-------------|----------------------------|
| `syncscript_list_tasks` | GET `/tasks` | `tasks:read` |
| `syncscript_week_snapshot` | Parallel: GET `/tasks`, `/calendar/local-events`, `/activity/summary`, `/capture/inbox` | mixed scopes (needs `tasks:read`, `calendar:read`, `activity:read` **or** `tasks:read`, `capture:read` — default PAT includes all) |
| `syncscript_create_task` | POST `/tasks` | `tasks:write` |
| `syncscript_update_task` | PUT `/tasks/:id` | `tasks:write` |
| `syncscript_delete_task` | DELETE `/tasks/:id` | `tasks:write` |
| `syncscript_complete_task` | POST `/tasks/:id/toggle` | `tasks:write` |
| `syncscript_activity_summary` | GET `/activity/summary` | `tasks:read` **or** `activity:read` |
| `syncscript_log_activity` | POST `/activity/events` | `activity:write` |
| `syncscript_get_business_plan` | GET `/business-plan` | `business_plan:read` |
| `syncscript_put_business_plan` | PUT `/business-plan` | `business_plan:write` |
| `syncscript_export_business_plan_md` | GET `/business-plan/export.md` | `business_plan:read` |
| `syncscript_list_local_calendar_events` | GET `/calendar/local-events` | `calendar:read` |
| `syncscript_calendar_hold` | POST `/calendar/hold` | `calendar:write` (returns **`local_only`** when no external calendar) |
| `syncscript_calendar_sync_groups` | GET `/calendar/sync-groups` | `calendar:read` |
| `syncscript_calendar_sync_group_update` | PATCH `/calendar/sync-group/:id` | `calendar:write` |
| `syncscript_calendar_hold_preferences_get` | GET `/calendar/hold-preferences` | `calendar:read` |
| `syncscript_calendar_hold_preferences_put` | PUT `/calendar/hold-preferences` | `calendar:write` |
| `syncscript_get_user_profile` | GET `/user/profile` | `profile:read` |
| `syncscript_put_user_profile` | PUT `/user/profile` | `profile:write` |
| `syncscript_list_capture_inbox` | GET `/capture/inbox` | `capture:read` |
| `syncscript_create_capture_inbox_item` | POST `/capture/inbox` | `capture:write` |
| `syncscript_commit_capture_inbox_item` | POST `/capture/inbox/:id/commit` | `capture:commit` plus `tasks:write` or `calendar:write` by row `kind` |
| `syncscript_dismiss_capture_inbox_item` | POST `/capture/inbox/:id/dismiss` | `capture:write` |
| `syncscript_library_list_files` | GET `/resources/files` | `library:read` |
| `syncscript_library_search` | GET `/resources/search` | `library:read` |
| `syncscript_library_upload_base64` | POST `/resources/upload-json` (≤ **1 MiB** decoded) | `library:write` |
| `syncscript_library_get_signed_url` | GET `/resources/file/:id/signed-url` | `library:read` |
| `syncscript_library_link_file` | POST `/resources/link` | `library:write` |
| `syncscript_library_delete_file` | DELETE `/resources/file/:id` | `library:write` |

**JWT (signed-in browser session):** scope checks are skipped on the Edge side — the full account applies.

**PAT:** each route checks the token’s `scopes` array. Newly minted PATs from the app default to a broad Cursor-oriented set (`tasks:*`, `activity:*`, `business_plan:*`, `calendar:*`, `profile:*`, `capture:*`, **`library:read`**, **`library:write`**). **Existing PATs keep their stored scopes** until you revoke and create a new token (or implement a scope editor).

**Library uploads:** agents and MCP should use **`syncscript_library_upload_base64`** for small files only. The signed-in app uses **multipart** `POST /resources/upload` for files up to **50 MiB**. **`POST /resources/file/:id/email-self`** remains **JWT-only** (PAT cannot resolve the account mailbox for Resend).

## Automated stdio smoke (no Cursor UI)

Same MCP JSON-RPC over stdio that Cursor uses — mints a throwaway PAT if you pass `.env` credentials:

```bash
# From repo root (needs NEXUS_LIVE_TEST_EMAIL / NEXUS_LIVE_TEST_PASSWORD in .env)
npm run verify:cursor-syncscript-mcp
```

Lower-level (you supply `SYNCSCRIPT_BEARER` yourself):

```bash
cd integrations/cursor-syncscript-mcp
SYNCSCRIPT_EDGE_BASE=… SYNCSCRIPT_BEARER=… SUPABASE_ANON_KEY=… node verify-stdio.mjs
```

## Security

- Never commit `SYNCSCRIPT_BEARER`.
- Revoke PAT from Settings if a machine is lost.
- Calendar holds write to connected Google/Outlook; treat `calendar:write` as high privilege.
