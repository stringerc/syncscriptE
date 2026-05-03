#!/usr/bin/env node
/**
 * SyncScript MCP — stdio server for Cursor.
 * Env: SYNCSCRIPT_EDGE_BASE, SYNCSCRIPT_BEARER, SUPABASE_ANON_KEY
 *
 * When Cursor starts this from any workspace (e.g. Custody), cwd may not be the
 * repo root. We load optional keys from the SyncScript repo `.env` (sibling of
 * `integrations/`) unless already set in `process.env` (e.g. from mcp.json).
 * Public defaults for Edge URL + anon key match `src/utils/supabase/info.tsx`.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_EDGE_BASE =
  "https://kwhnrlzibgfedtxpkbgb.supabase.co/functions/v1/make-server-57781ad9";
/** Same public fallback as `src/utils/supabase/info.tsx` (anon is not a secret). */
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8";

/** True if missing, empty, or whitespace-only (so mcp.json `""` does not block repo `.env`). */
function isEnvUnset(key) {
  const v = process.env[key];
  return v == null || String(v).trim() === "";
}

function loadRepoDotenv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(here, "..", "..");
  const envPath = (process.env.SYNCSCRIPT_MCP_ENV_FILE || "").trim() || join(repoRoot, ".env");
  const keys = new Set([
    "SYNCSCRIPT_EDGE_BASE",
    "SYNCSCRIPT_BEARER",
    "SYNCSCRIPT_PAT",
    "NEXUS_PAT",
    "SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ]);
  if (!existsSync(envPath)) return;
  let raw;
  try {
    raw = readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (!keys.has(key)) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key === "VITE_SUPABASE_ANON_KEY") {
      if (isEnvUnset("VITE_SUPABASE_ANON_KEY")) process.env.VITE_SUPABASE_ANON_KEY = val;
      if (isEnvUnset("SUPABASE_ANON_KEY")) process.env.SUPABASE_ANON_KEY = val;
    } else if (isEnvUnset(key)) {
      process.env[key] = val;
    }
  }
}

/** PAT / JWT: canonical `SYNCSCRIPT_BEARER`; aliases for mistaken `.env` / mcp.json keys. */
function resolveBearerToken() {
  const direct = String(process.env.SYNCSCRIPT_BEARER || "").trim();
  if (direct) {
    process.env.SYNCSCRIPT_BEARER = direct;
    return;
  }
  for (const k of ["SYNCSCRIPT_PAT", "NEXUS_PAT"]) {
    const v = String(process.env[k] || "").trim();
    if (v) {
      process.env.SYNCSCRIPT_BEARER = v;
      return;
    }
  }
}

function applyDefaultPublicConfig() {
  if (!String(process.env.SYNCSCRIPT_EDGE_BASE || "").trim()) {
    process.env.SYNCSCRIPT_EDGE_BASE = DEFAULT_EDGE_BASE;
  }
  if (!String(process.env.SUPABASE_ANON_KEY || "").trim()) {
    const fromVite = String(process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    process.env.SUPABASE_ANON_KEY = fromVite || DEFAULT_SUPABASE_ANON;
  }
}

loadRepoDotenv();
applyDefaultPublicConfig();
resolveBearerToken();

const BASE = (process.env.SYNCSCRIPT_EDGE_BASE || "").replace(/\/$/, "");
const BEARER = process.env.SYNCSCRIPT_BEARER || "";
const APIKEY = process.env.SUPABASE_ANON_KEY || "";

function headers() {
  const h = { apikey: APIKEY, "Content-Type": "application/json" };
  if (BEARER) h.Authorization = `Bearer ${BEARER}`;
  return h;
}

async function edgeFetch(path, init = {}) {
  if (!BASE || !APIKEY) throw new Error("Set SYNCSCRIPT_EDGE_BASE and SUPABASE_ANON_KEY");
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...init.headers } });
  const text = await res.text();
  if (!res.ok) {
    let msg = `${res.status} ${text.slice(0, 400)}`;
    if (res.status === 401) {
      const hint =
        !BEARER?.trim()
          ? "No bearer token: set SYNCSCRIPT_BEARER (sspat_… PAT or eyJ… JWT) in ~/.cursor/mcp.json env for key `syncscript`, or in SyncScript repo `.env` (Cursor does not load your shell profile). "
          : "Invalid or expired token / PAT scopes: revoke and create a new PAT in syncscript.app → Settings → Privacy (include tasks:read + tasks:write). ";
      msg += ` — ${hint}(Cursor may show this server as user-syncscript.)`;
    }
    throw new Error(msg);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  return text;
}

/** Omit undefined/null so Edge normalizeTask only receives intentional fields. */
function compactTaskBody(raw) {
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

const server = new Server(
  { name: "syncscript-cursor-mcp", version: "1.3.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "syncscript_list_tasks",
      description: "List tasks from SyncScript Edge (same as dashboard). Requires tasks:read on PAT.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_create_task",
      description:
        "Create a task (POST /tasks). Same fields Edge normalizeTask accepts beyond title. Requires tasks:write.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          dueDate: { type: "string", description: "ISO date string" },
          scheduledTime: { type: "string", description: "Optional ISO scheduled time" },
          tags: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["todo", "in_progress", "completed"] },
          energyLevel: { type: "string", enum: ["low", "medium", "high"] },
          estimatedTime: { type: "string", description: "e.g. 15 min, 1h" },
          progress: { type: "number", description: "0–100" },
          source: { type: "string", description: "Provenance label (e.g. cursor, mcp)" },
          completed: { type: "boolean" },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_week_snapshot",
      description:
        "Single call: tasks + local calendar events + activity heatmap window + capture inbox (default pending). For weekly planning from Cursor or any MCP host.",
      inputSchema: {
        type: "object",
        properties: {
          activity_days: { type: "number", description: "Days for GET /activity/summary (default 7)" },
          capture_status: {
            type: "string",
            enum: ["pending", "committed", "dismissed", "all"],
            description: "Capture inbox filter; default pending",
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_update_task",
      description: "Update a task by id (PUT /tasks/:id). Requires tasks:write.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          patch: {
            type: "object",
            description: "Fields to merge (title, description, priority, status, completed, dueDate, tags, …)",
            additionalProperties: true,
          },
        },
        required: ["taskId", "patch"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_delete_task",
      description: "Delete a task by id. Requires tasks:write.",
      inputSchema: {
        type: "object",
        properties: { taskId: { type: "string" } },
        required: ["taskId"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_complete_task",
      description: "Toggle task completion by task id.",
      inputSchema: {
        type: "object",
        properties: { taskId: { type: "string", description: "Task id from list" } },
        required: ["taskId"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_activity_summary",
      description: "GET activity heatmap summary (days window). PAT: tasks:read or activity:read.",
      inputSchema: {
        type: "object",
        properties: { days: { type: "number", description: "Default 14" } },
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_log_activity",
      description: "POST /activity/events — same allowed types as Edge.",
      inputSchema: {
        type: "object",
        properties: {
          eventType: {
            type: "string",
            enum: [
              "focus_block",
              "external_ide_session",
              "generic",
              "goal_progress",
              "calendar_event_done",
            ],
          },
          intensity: { type: "number", description: "1–100" },
          metadata: { type: "object" },
          visibility: {
            type: "string",
            enum: ["private", "friends", "public_summary"],
            description: "Default private",
          },
          occurred_at: { type: "string", description: "ISO time; default now" },
        },
        required: ["eventType"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_get_business_plan",
      description: "Fetch structured business plan sections.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_put_business_plan",
      description: "Replace business plan sections (PUT /business-plan). Requires business_plan:write.",
      inputSchema: {
        type: "object",
        properties: {
          sections: { type: "object", additionalProperties: { type: "string" } },
        },
        required: ["sections"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_export_business_plan_md",
      description: "Export business plan as markdown text.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_list_local_calendar_events",
      description:
        "GET /calendar/local-events — in-app calendar rows (saved when no external calendar is linked). Requires calendar:read.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_calendar_hold",
      description:
        "POST /calendar/hold — block time on connected Google/Outlook when linked; if not linked, returns 200 with local_only (in-app calendar row on server). Requires calendar:write.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          start_iso: { type: "string", description: "ISO start time" },
          end_iso: { type: "string", description: "Optional ISO end; default +30m" },
          provider: { type: "string", enum: ["auto", "google", "outlook"] },
          time_zone: { type: "string" },
          targets: { type: "array", items: { type: "string", enum: ["google", "outlook"] } },
        },
        required: ["title", "start_iso"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_calendar_sync_groups",
      description: "GET /calendar/sync-groups. Requires calendar:read.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_calendar_sync_group_update",
      description: "PATCH /calendar/sync-group/:id (targets, title, times). Requires calendar:write.",
      inputSchema: {
        type: "object",
        properties: {
          groupId: { type: "string" },
          targets: { type: "array", items: { type: "string", enum: ["google", "outlook"] } },
          title: { type: "string" },
          start_time: { type: "string" },
          end_time: { type: "string" },
          time_zone: { type: "string" },
        },
        required: ["groupId", "targets"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_calendar_hold_preferences_get",
      description: "GET /calendar/hold-preferences. Requires calendar:read.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_calendar_hold_preferences_put",
      description: "PUT /calendar/hold-preferences { autoTargets }. Requires calendar:write.",
      inputSchema: {
        type: "object",
        properties: {
          autoTargets: {
            type: "array",
            items: { type: "string", enum: ["google", "outlook"] },
            description: "Empty array = both providers",
          },
        },
        required: ["autoTargets"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_list_capture_inbox",
      description: "GET /capture/inbox — suggested items not yet committed. Requires capture:read on PAT.",
      inputSchema: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "committed", "dismissed", "all"],
            description: "Row filter; default pending",
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_create_capture_inbox_item",
      description: "POST /capture/inbox — add a queued suggestion (task_draft, calendar_hold_draft, or generic). Requires capture:write.",
      inputSchema: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["task_draft", "calendar_hold_draft", "generic"] },
          title: { type: "string" },
          source: { type: "string" },
          payload: { type: "object", additionalProperties: true },
        },
        required: ["kind"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_commit_capture_inbox_item",
      description:
        "POST /capture/inbox/:id/commit — materialize a pending row (tasks KV or calendar hold). Requires capture:commit plus tasks:write or calendar:write as appropriate.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string", description: "Capture inbox row id" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_dismiss_capture_inbox_item",
      description: "POST /capture/inbox/:id/dismiss — mark pending row dismissed. Requires capture:write.",
      inputSchema: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_get_user_profile",
      description: "GET /user/profile (KV profile merged with auth email). Requires profile:read on PAT.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_put_user_profile",
      description: "PUT /user/profile (cannot set email from client). Requires profile:write on PAT.",
      inputSchema: {
        type: "object",
        properties: {
          patch: { type: "object", description: "Profile fields to merge", additionalProperties: true },
        },
        required: ["patch"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_list_files",
      description: "GET /resources/files — user library metadata. PAT: library:read.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "number", description: "1–100, default 30" },
          offset: { type: "number", description: "default 0" },
        },
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_search",
      description: "GET /resources/search — filename / extracted text. PAT: library:read.",
      inputSchema: {
        type: "object",
        properties: {
          q: { type: "string", description: "Search query (1–200 chars)" },
          limit: { type: "number", description: "1–50, default 20" },
        },
        required: ["q"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_upload_base64",
      description:
        "POST /resources/upload-json — small files only (≤1 MiB decoded). Prefer app multipart upload for large binaries. PAT: library:write.",
      inputSchema: {
        type: "object",
        properties: {
          filename: { type: "string" },
          mimeType: { type: "string" },
          base64: { type: "string", description: "Standard base64 file bytes" },
          contextType: {
            type: "string",
            enum: ["task", "calendar_event", "milestone", "step", "invoice", "goal", "library"],
            description: "Optional link target type",
          },
          contextId: { type: "string", description: "Optional entity id to link after upload" },
        },
        required: ["filename", "base64"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_get_signed_url",
      description: "GET /resources/file/:id/signed-url — short-lived download URL. PAT: library:read.",
      inputSchema: {
        type: "object",
        properties: { fileId: { type: "string" } },
        required: ["fileId"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_link_file",
      description: "POST /resources/link — attach library file to task, goal, calendar_event, etc. PAT: library:write.",
      inputSchema: {
        type: "object",
        properties: {
          file_id: { type: "string" },
          entity_type: {
            type: "string",
            enum: ["task", "calendar_event", "milestone", "step", "invoice", "goal", "library"],
          },
          entity_id: { type: "string" },
        },
        required: ["file_id", "entity_type", "entity_id"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_library_delete_file",
      description: "DELETE /resources/file/:id — remove from storage + metadata. PAT: library:write.",
      inputSchema: {
        type: "object",
        properties: { fileId: { type: "string" } },
        required: ["fileId"],
        additionalProperties: false,
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "syncscript_list_tasks") {
      const data = await edgeFetch("/tasks");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_create_task") {
      const body = compactTaskBody({
        title: args?.title,
        description: args?.description,
        priority: args?.priority,
        dueDate: args?.dueDate,
        scheduledTime: args?.scheduledTime,
        tags: args?.tags,
        status: args?.status,
        energyLevel: args?.energyLevel,
        estimatedTime: args?.estimatedTime,
        progress: args?.progress,
        source: args?.source,
        completed: args?.completed,
      });
      const data = await edgeFetch("/tasks", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_week_snapshot") {
      const days = Number.isFinite(Number(args?.activity_days)) ? Math.min(400, Math.max(1, Number(args.activity_days))) : 7;
      const capSt =
        args?.capture_status != null && String(args.capture_status).trim()
          ? String(args.capture_status).trim()
          : "pending";
      const [tasks, calendar_local_events, activity_summary, capture_inbox] = await Promise.all([
        edgeFetch("/tasks"),
        edgeFetch("/calendar/local-events"),
        edgeFetch(`/activity/summary?days=${encodeURIComponent(String(days))}`),
        edgeFetch(`/capture/inbox?status=${encodeURIComponent(capSt)}`),
      ]);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { ok: true, tasks, calendar_local_events, activity_summary, capture_inbox },
              null,
              2,
            ),
          },
        ],
      };
    }
    if (name === "syncscript_update_task") {
      const taskId = String(args?.taskId || "").trim();
      const data = await edgeFetch(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PUT",
        body: JSON.stringify(args?.patch || {}),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_delete_task") {
      const taskId = String(args?.taskId || "").trim();
      const data = await edgeFetch(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_complete_task") {
      const taskId = String(args?.taskId || "").trim();
      const data = await edgeFetch(`/tasks/${encodeURIComponent(taskId)}/toggle`, { method: "POST" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_activity_summary") {
      const days = Number.isFinite(Number(args?.days)) ? Number(args.days) : 14;
      const data = await edgeFetch(`/activity/summary?days=${encodeURIComponent(String(days))}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_log_activity") {
      const body = compactTaskBody({
        eventType: args.eventType,
        intensity: args.intensity,
        metadata: args.metadata || {},
        visibility: args.visibility,
        occurred_at: args.occurred_at,
      });
      const data = await edgeFetch("/activity/events", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_get_business_plan") {
      const data = await edgeFetch("/business-plan");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_put_business_plan") {
      const data = await edgeFetch("/business-plan", {
        method: "PUT",
        body: JSON.stringify({ sections: args?.sections || {} }),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_export_business_plan_md") {
      const text = await edgeFetch("/business-plan/export.md");
      return { content: [{ type: "text", text: String(text) }] };
    }
    if (name === "syncscript_list_local_calendar_events") {
      const data = await edgeFetch("/calendar/local-events");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_calendar_hold") {
      const body = {
        title: args?.title,
        start_iso: args?.start_iso,
        end_iso: args?.end_iso,
        provider: args?.provider ?? "auto",
        time_zone: args?.time_zone,
        targets: args?.targets,
      };
      const data = await edgeFetch("/calendar/hold", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_calendar_sync_groups") {
      const data = await edgeFetch("/calendar/sync-groups");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_calendar_sync_group_update") {
      const id = String(args?.groupId || "").trim();
      const payload = {
        targets: args?.targets,
        title: args?.title,
        start_time: args?.start_time,
        end_time: args?.end_time,
        time_zone: args?.time_zone,
      };
      const data = await edgeFetch(`/calendar/sync-group/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_calendar_hold_preferences_get") {
      const data = await edgeFetch("/calendar/hold-preferences");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_calendar_hold_preferences_put") {
      const data = await edgeFetch("/calendar/hold-preferences", {
        method: "PUT",
        body: JSON.stringify({ autoTargets: args?.autoTargets ?? ["google", "outlook"] }),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_list_capture_inbox") {
      const st = args?.status != null && String(args.status).trim() ? String(args.status).trim() : "pending";
      const data = await edgeFetch(`/capture/inbox?status=${encodeURIComponent(st)}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_create_capture_inbox_item") {
      const body = {
        kind: args?.kind,
        title: args?.title,
        source: args?.source,
        payload: args?.payload && typeof args.payload === "object" ? args.payload : {},
      };
      const data = await edgeFetch("/capture/inbox", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_commit_capture_inbox_item") {
      const id = String(args?.id || "").trim();
      const data = await edgeFetch(`/capture/inbox/${encodeURIComponent(id)}/commit`, { method: "POST" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_dismiss_capture_inbox_item") {
      const id = String(args?.id || "").trim();
      const data = await edgeFetch(`/capture/inbox/${encodeURIComponent(id)}/dismiss`, { method: "POST" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_list_files") {
      const limit = Number.isFinite(Number(args?.limit)) ? Math.min(100, Math.max(1, Number(args.limit))) : 30;
      const offset = Number.isFinite(Number(args?.offset)) ? Math.max(0, Number(args.offset)) : 0;
      const data = await edgeFetch(
        `/resources/files?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_search") {
      const q = String(args?.q || "").trim();
      const limit = Number.isFinite(Number(args?.limit)) ? Math.min(50, Math.max(1, Number(args.limit))) : 20;
      const data = await edgeFetch(
        `/resources/search?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(String(limit))}`,
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_upload_base64") {
      const payload = {
        filename: args?.filename,
        mimeType: args?.mimeType,
        base64: args?.base64,
        contextType: args?.contextType,
        contextId: args?.contextId,
      };
      const data = await edgeFetch("/resources/upload-json", { method: "POST", body: JSON.stringify(payload) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_get_signed_url") {
      const fileId = String(args?.fileId || "").trim();
      const data = await edgeFetch(`/resources/file/${encodeURIComponent(fileId)}/signed-url`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_link_file") {
      const body = {
        file_id: args?.file_id,
        entity_type: args?.entity_type,
        entity_id: args?.entity_id,
      };
      const data = await edgeFetch("/resources/link", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_library_delete_file") {
      const fileId = String(args?.fileId || "").trim();
      const data = await edgeFetch(`/resources/file/${encodeURIComponent(fileId)}`, { method: "DELETE" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_get_user_profile") {
      const data = await edgeFetch("/user/profile");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_put_user_profile") {
      const data = await edgeFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify(args?.patch || {}),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: String(e?.message || e) }] };
  }
});

if (!BEARER.trim()) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  console.error(
    `[syncscript-mcp] SYNCSCRIPT_BEARER is not set (Edge will return 401). Add one line to ${root}/.env:\n` +
      "  SYNCSCRIPT_BEARER=sspat_…\n" +
      "or set \"SYNCSCRIPT_BEARER\" in ~/.cursor/mcp.json under the syncscript server env, then reload MCP. Never paste the PAT into chat.",
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
