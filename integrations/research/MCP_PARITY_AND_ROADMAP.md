# MCP ↔ syncscript.app parity and roadmap

**Status:** Engineering backlog + operator guide (git).  
**Last updated:** 2026-04-26

## What MCP covers today (Edge-backed)

| Area | MCP / Edge | Notes |
|------|----------------|------|
| Tasks | `syncscript_*task*`, `POST /tasks` | Full **create** field parity with `normalizeTask` (title, description, priority, dueDate, scheduledTime, tags, status, energyLevel, estimatedTime, progress, source, completed). |
| Calendar | holds, sync-groups, local-events, prefs | Same as dashboard productivity client. |
| Capture inbox | list / create / commit / dismiss | Human-in-the-loop for agent suggestions. |
| Activity | summary + `log_activity` (+ visibility / `occurred_at`) | Heatmap + focus / IDE session logging. |
| Business plan | get / put / export.md | Weekly narrative from Cursor. |
| Profile | get / put | KV merged profile. |
| **Library** | list, search, **upload-json** (≤1 MiB), signed URL, link, delete | Multipart **`/resources/upload`** up to **50 MiB** in the **signed-in app**; **`email-self`** stays **JWT-only**. |
| **Week snapshot** | `syncscript_week_snapshot` | One round-trip: tasks + local calendar + activity window + capture inbox. |

## Not MCP / not Edge yet (client-first or JWT-only)

| Area | Why | Direction if we want parity |
|------|-----|------------------------------|
| **Goals** (`useGoals`, local command adapter, milestones) | State is primarily **client contract + localStorage** patterns, not a single Edge KV/API. | Add **`goals:v1:{userId}`** (or Postgres) + `GET/POST/PUT /goals` + PAT `goals:read`/`goals:write`; then thin MCP wrappers; **avoid** duplicating logic in Nexus without tests. |
| **Workstream** (flow canvas, library blocks) | Graph + UI in **`ProjectsOperatingSystem`** / feature gates; tasks created from canvas already hit Edge when wired through repository. | Optional **Edge “workstream snapshot”** JSON export, or treat workstream as **UI-only** and use **tasks + capture inbox** for agent writes. |
| **Friend / team feed** | `GET /friends/activity-feed` and some social prefs are **JWT-only** by policy. | Keep as-is for trust; optional read-only PAT with strict RLS review is a product decision, not a quick MCP add. |
| **Hosted MCP (ChatGPT connectors, etc.)** | Current server is **stdio** (Cursor-class IDEs). | Separate **OAuth 2.1 + HTTPS MCP** or **user-scoped API keys** + rate limits + audit — large security project. |

## Safety patterns (same as “enterprise” discipline)

- **Scoped PATs** per machine; **rotate** when scopes change (`library:*`, future `goals:*`).
- **Staging:** capture inbox before destructive calendar/task commits.
- **Size limits:** JSON upload **1 MiB**; use **app UI** for big binaries.
- **No secrets** in agent prompts; **links** + **library** metadata instead.

## References

- **`integrations/cursor-syncscript-mcp/README.md`** — tool table + env.
- **`MEMORY.md`** — § Product — social + external IDE bridge, § MCP operating model.
- **`integrations/research/CURSOR_SYNCSCRIPT_SOCIAL_PRODUCTIVITY_ROADMAP.md`** — architecture diagram.
- **`integrations/research/SYNCSCRIPT_ACTIVITY_AND_SOCIAL_SPINE.md`** — activity + visibility model.
