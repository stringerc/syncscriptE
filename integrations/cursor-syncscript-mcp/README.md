# SyncScript Cursor MCP

Model Context Protocol (stdio) server that calls your **Supabase Edge** deployment `make-server-57781ad9` — same surface the web app uses for tasks.

## Prerequisites

1. Apply migration `20260427090000_activity_business_plan_api_tokens.sql` (`supabase db push`).
2. Deploy Edge: `npm run deploy:edge:make-server` (from repo root).
3. In SyncScript **Settings → Privacy**, create a **PAT** (or use a short-lived Supabase JWT — PAT is easier for Cursor).

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
| `SUPABASE_ANON_KEY` | yes | Same `anon` `apikey` header the dashboard sends (public, from Supabase project settings). |

## Cursor MCP config (example)

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

- `syncscript_list_tasks` — GET `/tasks`
- `syncscript_complete_task` — POST `/tasks/:id/toggle`
- `syncscript_log_activity` — POST `/activity/events` (`focus_block`, `external_ide_session`, …)
- `syncscript_get_business_plan` — GET `/business-plan`
- `syncscript_export_business_plan_md` — GET `/business-plan/export.md`

## Security

- Never commit `SYNCSCRIPT_BEARER`.
- Revoke PAT from Settings if a machine is lost.
