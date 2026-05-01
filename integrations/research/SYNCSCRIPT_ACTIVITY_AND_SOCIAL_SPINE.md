# SyncScript activity spine, business plan, Cursor bridge, and social visibility

**Date:** 2026-04-27  
**Status:** Canonical product + schema spec (implements roadmap: Cursor + SyncScript alignment and social productivity).

## Goals

1. **Single source of truth** for work signals in SyncScript (tasks, goals, calendar completions, optional IDE focus blocks).
2. **Heatmaps and feeds** driven by **append-only events** plus rollups—not random UI data.
3. **Cursor / MCP** integrate via **same Edge** as tasks (`make-server-57781ad9`), using **Supabase JWT** or **scoped PAT** (`sspat_*`), never user passwords.
4. **Social layer** is **opt-in**: default **private**; friends/public only with explicit settings.

## Activity event model

| Field | Type | Notes |
|-------|------|--------|
| `id` | uuid | PK |
| `user_id` | uuid | `auth.users` |
| `event_type` | text | `task_completed`, `goal_progress`, `calendar_event_done`, `focus_block`, `external_ide_session`, `generic` |
| `intensity` | int | Default `1`; optional weight for heatmap cell |
| `metadata` | jsonb | **No secrets.** Allowed: `taskId`, `title` (short), `durationMinutes`, `source` (`cursor`, `web`, `mcp`). Disallowed by policy: API keys, full repo paths unless user enables “detailed IDE logging” (future). |
| `occurred_at` | timestamptz | When the work happened |
| `visibility` | text | `private` (default) \| `friends` \| `public_summary` |

**Retention:** operator policy default **395 days** of raw events (aligns with ~53-week grid); prune job can be added later.

**Writers:**

- **Server (Edge):** On authoritative mutations (e.g. task toggle → completed), insert `task_completed` with `private` visibility.
- **Client / MCP:** `POST /activity/events` for `focus_block`, `external_ide_session` with scoped token.

## Daily rollup

Phase-1 implementation: **query-time aggregation** from `user_activity_events` grouped by `date_trunc('day', occurred_at at time zone 'UTC')` (or user TZ later). Optional materialized table `user_activity_daily` in a later migration if volume requires it.

## Business plan

- Table `user_business_plans`: one row per `user_id`, `sections` jsonb (structured headings + body), `updated_at`.
- Enterprise UI tab **Plan** reads/writes via Edge `GET/PUT /business-plan`.
- **Export:** `GET /business-plan/export.md` returns markdown for `BUSINESS_PLAN.md` / Cursor rules.

## Personal access tokens (PAT)

- Table `user_api_tokens`: `token_hash` (sha256 hex), `scopes` text[], `label`, `created_at`, `last_used_at`.
- Plain token shown **once** on create: `sspat_` + random suffix.
- Edge `requireUserOrPat` resolves JWT first; if fails, lookup PAT hash.
- Scopes: `tasks:read`, `tasks:write`, `activity:write`, `business_plan:read`, `business_plan:write`.

## Social preferences

- Table `user_social_prefs`: `heatmap_visibility` (`private` \| `friends` \| `public_summary`), `friend_feed_opt_in` boolean default false.
- **Friends** graph already exists: `social_relationships` (see `20260308000000_create_social_chat_tables.sql`).
- **Friend activity feed:** RPC `social_friend_activity_feed(p_actor uuid, p_limit int)` **security definer** returns recent friends’ events where `visibility in ('friends','public_summary')` and relationship is accepted `friend`.

## Threat model (minimum)

- PAT theft = account API access until revoked—**HTTPS only**, short labels, rotate on leak.
- Public summaries must **never** include raw MCP payloads or file contents by default.
- Rate-limit `POST /activity/events` per user — **implemented** in `social-productivity-routes.tsx` (sliding 60 req / minute / user, HTTP 429 when exceeded).

## References

- Tasks Edge: `supabase/functions/make-server-57781ad9/email-task-routes.tsx`
- Social RPCs: `src/utils/social-chat.ts`, migration `20260308000000_create_social_chat_tables.sql`
- MCP + operator runbook: `integrations/cursor-syncscript-mcp/README.md`, `MEMORY.md` § Product — social + external IDE bridge

## Repo completion notes (2026-04-30)

| Item | Status |
|------|--------|
| `POST /activity/events` rate limit | **Shipped** — `supabase/functions/make-server-57781ad9/social-productivity-routes.tsx` |
| Goal marked complete → activity | **Shipped** — `src/hooks/useGoals.ts` calls `postActivityEvent` (`goal_progress`, private metadata) via `src/utils/edge-productivity-client.ts` |
| `task_completed` on Edge task toggle/PUT | **Existing** — `activity-record.ts` + `email-task-routes.tsx` |
| Calendar event “done” auto-row | **Deferred** — calendar stack is fragmented (providers + local); emit `calendar_event_done` from a single authoritative save path when one is chosen |
| Canonical roadmap (Cursor + social product) | **`integrations/research/CURSOR_SYNCSCRIPT_SOCIAL_PRODUCTIVITY_ROADMAP.md`** |
