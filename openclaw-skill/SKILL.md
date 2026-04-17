# SyncScript Skill

A skill for OpenClaw that enables AI-powered interaction with the SyncScript productivity platform.

## Description

This skill allows OpenClaw to read and manage SyncScript data including tasks, goals, calendar events, and energy tracking. When a user asks about their productivity, schedule, or tasks through any OpenClaw channel (Telegram, Discord, WebChat, etc.), this skill provides the context needed for intelligent responses.

## Capabilities

- **Task Management**: List, create, update, and prioritize tasks
- **Goal Tracking**: View goal progress, milestones, and recommendations
- **Calendar Access**: Check upcoming events, find free time slots
- **Energy Intelligence**: Read energy levels, predict peak hours, suggest optimal scheduling
- **Productivity Analytics**: Summarize completion rates, streaks, and patterns

## Configuration

Set these environment variables in your OpenClaw config:

```
SYNCSCRIPT_SUPABASE_URL=https://kwhnrlzibgfedtxpkbgb.supabase.co
SYNCSCRIPT_SUPABASE_KEY=<your-service-role-key>
SYNCSCRIPT_API_BASE=https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9
```

## MEMORY.md (Telegram, Discord, and other OpenClaw channels)

OpenClaw **automatically injects** bootstrap files from **`agents.defaults.workspace`** (default **`~/.openclaw/workspace`**) into the system prompt on every turn — including **`MEMORY.md`** when that file exists in the workspace root (see OpenClaw docs: *System Prompt* → workspace bootstrap).

**So Telegram (and other OpenClaw channels) see your memory when the gateway workspace contains `MEMORY.md`.** Pick one:

1. **Point the gateway at your SyncScript clone** (recommended if this repo is your main OpenClaw workspace):
   ```bash
   openclaw config set agents.defaults.workspace "$HOME/syncscript"
   ```
   Restart the gateway. Your local **`MEMORY.md`** (gitignored in-repo) lives there and will be injected.

2. **Keep the default workspace** and copy or symlink only the file:
   ```bash
   ln -sf "$HOME/syncscript/MEMORY.md" "$HOME/.openclaw/workspace/MEMORY.md"
   ```

Tune size limits with **`agents.defaults.bootstrapMaxChars`** / **`bootstrapTotalMaxChars`** if prompts get large.

## In-app Nexus (Supabase Edge `openclaw-bridge`)

The Edge function **cannot read** your laptop’s **`MEMORY.md`**. Set Supabase secret **`SYNCSCRIPT_OPERATOR_MEMORY`** to a **text digest** of that file (first ~20k chars is enough). From the repo:

```bash
npm run operator-memory:digest
```

Paste the printed block into **Supabase → Edge Functions → Secrets**. Optional: **`SYNCSCRIPT_OPERATOR_MEMORY_MAX_CHARS`** (default 20000). Redeploy Edge functions after changing secrets.

## Tools Provided

### syncscript_get_tasks
Get the user's tasks with optional filters.

**Arguments:**
- `status` (optional): Filter by status — "active", "completed", "pending"
- `priority` (optional): Filter by priority — "high", "medium", "low"
- `limit` (optional): Max results (default 10)

### syncscript_get_goals
Get the user's goals and progress.

**Arguments:**
- `category` (optional): Filter by category
- `limit` (optional): Max results (default 5)

### syncscript_get_energy
Get current energy data and forecast.

**Arguments:** none

### syncscript_get_calendar
Get upcoming calendar events.

**Arguments:**
- `days` (optional): How many days ahead to look (default 7)
- `type` (optional): Filter by type — "meeting", "task", "break", "focus"

### syncscript_create_task
Create a new task.

**Arguments:**
- `title` (required): Task title
- `description` (optional): Task description
- `priority` (optional): "high", "medium", "low" (default "medium")
- `dueDate` (optional): ISO date string

### syncscript_get_summary
Get a productivity summary.

**Arguments:**
- `period` (optional): "today", "week", "month" (default "today")

## Usage Examples

User: "What should I work on right now?"
→ Skill fetches tasks + energy level → AI recommends based on priority + current energy

User: "Create a task to review the Q4 report by Friday"
→ Skill creates task with title, priority, and due date

User: "How are my goals doing?"
→ Skill fetches goals → AI summarizes progress and suggests actions
