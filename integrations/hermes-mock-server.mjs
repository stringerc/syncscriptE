#!/usr/bin/env node
/**
 * Hermes reference HTTP API for Engram registration + SyncScript Edge `hermes-bridge`.
 *
 * Contract (see integrations/HERMES.md):
 *   GET  /health | /healthz | /
 *   GET  /v1/tools
 *   POST /v1/invoke  { tool, arguments?, idempotency_key? }
 *
 * Usage:
 *   node integrations/hermes-mock-server.mjs
 *   HERMES_MOCK_PORT=18880 node integrations/hermes-mock-server.mjs
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.HERMES_MOCK_PORT || 18880);

const TOOLS = [
  {
    name: "list_tools",
    description: "Return catalog of executor tools (introspection).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "apply_task_patch",
    description: "Idempotent task field update; production should call app/Supabase APIs.",
    input_schema: {
      type: "object",
      required: ["task_id", "patch"],
      properties: {
        task_id: { type: "string" },
        patch: { type: "object" },
        idempotency_key: { type: "string" },
      },
    },
  },
  {
    name: "create_calendar_hold",
    description:
      "Reserve a calendar window; production calls Edge POST /calendar/hold (provider, optional targets).",
    input_schema: {
      type: "object",
      required: ["title", "start_iso"],
      properties: {
        title: { type: "string" },
        start_iso: { type: "string" },
        end_iso: { type: "string" },
        provider: { type: "string", enum: ["auto", "google", "outlook"] },
        targets: {
          type: "array",
          items: { type: "string", enum: ["google", "outlook"] },
        },
        time_zone: { type: "string" },
        idempotency_key: { type: "string" },
      },
    },
  },
];

const idempotent = new Set();

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function invokeTool(tool, args, idemKey) {
  const runId = randomUUID();
  const trace = [];

  const push = (step, status, detail) => {
    trace.push({ step, status, detail: detail || null, at: new Date().toISOString() });
  };

  push("parse", "ok", tool);

  if (idemKey && idempotent.has(idemKey)) {
    push("idempotency", "ok", "duplicate key — returning cached shape");
    return {
      ok: true,
      tool,
      idempotency_key: idemKey,
      deduped: true,
      run_id: runId,
      result: { cached: true },
      trace,
    };
  }
  if (idemKey) idempotent.add(idemKey);

  switch (tool) {
    case "list_tools": {
      push("list", "ok", `${TOOLS.length} tools`);
      return { ok: true, tool, run_id: runId, result: { tools: TOOLS.map((t) => t.name) }, trace };
    }
    case "apply_task_patch": {
      const taskId = args?.task_id;
      if (!taskId) {
        push("validate", "error", "task_id required");
        return { ok: false, tool, run_id: runId, error: "task_id required", trace };
      }
      push("validate", "ok", `task ${taskId}`);
      push("apply", "ok", JSON.stringify(args?.patch || {}).slice(0, 200));
      return {
        ok: true,
        tool,
        run_id: runId,
        result: { applied: true, task_id: taskId, patch: args?.patch || {} },
        trace,
      };
    }
    case "create_calendar_hold": {
      const title = args?.title;
      const start = args?.start_iso;
      if (!title || !start) {
        push("validate", "error", "title and start_iso required");
        return { ok: false, tool, run_id: runId, error: "title and start_iso required", trace };
      }
      push("validate", "ok", title);
      push("hold", "ok", `${start} → ${args?.end_iso || "open"}`);
      const eventId = `hold-${randomUUID().slice(0, 8)}`;
      return {
        ok: true,
        tool,
        run_id: runId,
        result: {
          success: true,
          event_id: eventId,
          sync_group_id: `sg-${randomUUID().slice(0, 8)}`,
          title,
          start_iso: start,
          end_iso: args?.end_iso || null,
          provider_mode: args?.provider || "auto",
          targets: args?.targets || null,
        },
        trace,
      };
    }
    default:
      push("route", "error", `unknown tool ${tool}`);
      return { ok: false, tool, run_id: runId, error: `Unknown tool: ${tool}`, trace };
  }
}

const server = http.createServer((req, res) => {
  const u = req.url?.split("?")[0] || "/";

  if (req.method === "GET" && (u === "/health" || u === "/healthz" || u === "/")) {
    json(res, 200, { status: "ok", role: "hermes", port: PORT, contract: "syncscript/v1" });
    return;
  }

  if (req.method === "GET" && u === "/v1/tools") {
    json(res, 200, { tools: TOOLS, version: 1 });
    return;
  }

  if (req.method === "POST" && u === "/v1/invoke") {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 256 * 1024) {
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const tool = parsed.tool || parsed.name;
        const args = parsed.arguments || parsed.args || {};
        const idemKey = parsed.idempotency_key || parsed.idempotencyKey || "";
        if (!tool) {
          json(res, 400, { ok: false, error: "tool required" });
          return;
        }
        const out = invokeTool(tool, args, idemKey);
        json(res, out.ok ? 200 : 400, out);
      } catch {
        json(res, 400, { ok: false, error: "invalid JSON" });
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.error(
    `[hermes-mock] http://127.0.0.1:${PORT}  health=/health  tools=GET /v1/tools  invoke=POST /v1/invoke`,
  );
});
