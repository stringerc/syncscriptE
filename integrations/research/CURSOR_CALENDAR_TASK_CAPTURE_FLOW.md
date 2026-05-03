# Cursor ↔ syncscript.app — dates, tasks, and consent (canonical flow)

**Aligns with:** `MEMORY.md` quick section (Nexus parity, productivity Edge, Cursor MCP), `integrations/research/SYNCSCRIPT_ACTIVITY_AND_SOCIAL_SPINE.md`, `integrations/research/CURSOR_SYNCSCRIPT_SOCIAL_PRODUCTIVITY_ROADMAP.md`.

## Where “dates to put on the calendar” come from

| Source | How they become work on your calendar |
|--------|----------------------------------------|
| **Cursor + MCP** | The model proposes a tool (`syncscript_create_task`, `syncscript_calendar_hold`, …). **You approve the tool call in Cursor** — that is the primary consent gate. On success, Edge writes tasks and/or provider calendar holds (Google/Outlook) per route semantics. |
| **syncscript.app (Nexus chat/voice/phone)** | Nexus tool loop (`create_task`, `propose_calendar_hold`, …) hits the same Edge/Vercel surfaces as the web UI where wired; voice may open **TaskDetailModal** / **EventModal** / **LinkedCalendarEventModal** (see MEMORY § Nexus voice). |
| **Dashboard UI** | You create tasks/events directly; **TaskCalendarSync** mirrors tasks with `scheduledTime` into the in-app calendar view (local event projection — not a second OAuth write). |
| **Repo / markdown** | Not automatically scanned today. MCP can read/write tasks you ask it to; there is **no** background job that parses arbitrary repo files into calendar without an explicit agent step. |

## Do items auto-appear or pop up when you log in?

- **After MCP or Nexus writes successfully:** data is already on the server. When you open the app, **Tasks** and **Calendar** reflect it like any other save — **no extra approval modal** on login for those writes (trust is anchored at **tool execution time** in Cursor or Nexus).
- **Capture inbox (optional path):** clients can **`POST /capture/inbox`** to queue **suggested** rows (`task_draft`, `calendar_hold_draft`, `generic`) without writing tasks/calendar until the user **commits** from the dashboard strip or **`POST /capture/inbox/:id/commit`** (MCP: `syncscript_commit_capture_inbox_item`). That keeps **two** consent moments only when operators choose the queue flow; direct **`POST /tasks`** / **`POST /calendar/hold`** remains unchanged.
- **If you are offline or on another device:** next load shows current server state (including any **pending** capture rows if you use the inbox).
- **Google/Outlook holds:** If nothing is connected, `POST /calendar/hold` still returns **200** with **`local_only: true`** and **`code: "NO_CALENDAR"`** — the slot is stored server-side for the **in-app** calendar (`GET /calendar/local-events`); connect Google or Outlook under **Settings → Integrations** to mirror holds externally.

## UX bar (elite, trust-first)

1. **One clear consent surface per channel:** Cursor tool confirmation OR Nexus turn OR explicit UI save — avoid double-confirming the same write on next login.
2. **High-impact writes scoped:** PAT scopes (`calendar:write`, `tasks:write`, …) limit blast radius if a token leaks.
3. **Observable:** activity events + heatmap (`GET /activity/summary`) for “what happened,” not mystery mutations.
4. **Search bar (`DashboardHeader`):** still powers **Search & commands** (navigation + mock content today). MCP does not push into that dropdown; use **Settings → Privacy → Cursor / MCP** (`#cursor-mcp-bridge`) for bridge copy and PATs.

## Verification commands

- Edge + JWT/PAT HTTP: `npm run verify:edge-productivity-http:login`
- MCP stdio (same as Cursor transport): `npm run verify:cursor-syncscript-mcp`
