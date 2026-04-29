#!/usr/bin/env node
/**
 * SyncScript MCP — stdio server for Cursor.
 * Env: SYNCSCRIPT_EDGE_BASE, SYNCSCRIPT_BEARER, SUPABASE_ANON_KEY
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

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
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 400)}`);
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

const server = new Server(
  { name: "syncscript-cursor-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "syncscript_list_tasks",
      description: "List tasks from SyncScript Edge (same as dashboard).",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
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
      name: "syncscript_log_activity",
      description: "Append activity event (focus_block, external_ide_session, generic).",
      inputSchema: {
        type: "object",
        properties: {
          eventType: { type: "string", enum: ["focus_block", "external_ide_session", "generic"] },
          intensity: { type: "number", description: "1–100" },
          metadata: { type: "object" },
        },
        required: ["eventType"],
        additionalProperties: false,
      },
    },
    {
      name: "syncscript_get_business_plan",
      description: "Fetch structured business plan sections from Enterprise tab storage.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
      name: "syncscript_export_business_plan_md",
      description: "Export business plan as markdown text.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
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
    if (name === "syncscript_complete_task") {
      const taskId = String(args?.taskId || "").trim();
      const data = await edgeFetch(`/tasks/${encodeURIComponent(taskId)}/toggle`, { method: "POST" });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_log_activity") {
      const body = {
        eventType: args.eventType,
        intensity: args.intensity,
        metadata: args.metadata || {},
      };
      const data = await edgeFetch("/activity/events", { method: "POST", body: JSON.stringify(body) });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_get_business_plan") {
      const data = await edgeFetch("/business-plan");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "syncscript_export_business_plan_md") {
      const text = await edgeFetch("/business-plan/export.md");
      return { content: [{ type: "text", text: String(text) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (e) {
    return { isError: true, content: [{ type: "text", text: String(e?.message || e) }] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
