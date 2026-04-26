#!/usr/bin/env node
/**
 * Hermes production executor — same HTTP contract as hermes-mock-server.mjs, but applies
 * real SyncScript Edge operations when SYNCSCRIPT_EDGE_BASE is set and Authorization
 * (user JWT) is forwarded from hermes-bridge.
 *
 * Env:
 *   SYNCSCRIPT_EDGE_BASE — https://<project>.supabase.co/functions/v1/make-server-57781ad9 (no trailing slash)
 *   HERMES_EXECUTOR_PORT — default 18880
 *
 * Contract: integrations/HERMES.md
 */
import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.HERMES_EXECUTOR_PORT || 18880);
const EDGE = (process.env.SYNCSCRIPT_EDGE_BASE || "").replace(/\/$/, "");

const TOOLS = [
  {
    name: "list_tools",
    description: "Return catalog of executor tools (introspection).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "apply_task_patch",
    description: "Idempotent task field update via Edge PUT /tasks/:id (KV tasks store).",
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
      "Create a calendar hold via Edge POST /calendar/hold. provider=auto uses user hold-preferences or optional targets (subset of google/outlook); google or outlook writes one provider only.",
    input_schema: {
      type: "object",
      required: ["title", "start_iso"],
      properties: {
        title: { type: "string" },
        start_iso: { type: "string" },
        end_iso: { type: "string" },
        provider: { type: "string", enum: ["auto", "google", "outlook"], description: "default auto" },
        targets: {
          type: "array",
          items: { type: "string", enum: ["google", "outlook"] },
          description: "When provider=auto, limit which connected calendars receive the hold (omit for prefs or both).",
        },
        time_zone: { type: "string", description: "IANA or provider-specific (e.g. America/New_York)" },
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

async function edgeFetch(path, init, authHeader) {
  if (!EDGE) {
    return { ok: false, status: 503, text: "SYNCSCRIPT_EDGE_BASE not configured on executor host" };
  }
  const url = `${EDGE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    Accept: "application/json",
    ...(init.headers || {}),
  };
  if (authHeader) {
    headers.Authorization = authHeader;
  }
  try {
    const r = await fetch(url, { ...init, headers });
    const text = await r.text();
    return { ok: r.ok, status: r.status, text };
  } catch (e) {
    return { ok: false, status: 0, text: String(e?.message || e) };
  }
}

async function invokeTool(tool, args, idemKey, authHeader) {
  const runId = randomUUID();
  const trace = [];
  const push = (step, status, detail) => {
    trace.push({ step, status, detail: detail || null, at: new Date().toISOString() });
  };

  push("parse", "ok", tool);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    push("auth", "error", "Authorization Bearer JWT required (forwarded from Hermes Edge bridge)");
    return {
      ok: false,
      tool,
      run_id: runId,
      error: "Missing Authorization — Edge must forward user JWT",
      trace,
    };
  }

  if (idemKey && idempotent.has(idemKey)) {
    push("idempotency", "ok", "duplicate key");
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
      const patch = args?.patch && typeof args.patch === "object" ? args.patch : {};
      push("validate", "ok", `task ${taskId}`);
      const { ok, status, text } = await edgeFetch(
        `/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        },
        authHeader,
      );
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { raw: text?.slice(0, 500) };
      }
      if (!ok) {
        push("edge", "error", `PUT /tasks ${status}`);
        return {
          ok: false,
          tool,
          run_id: runId,
          error: body?.error || text?.slice(0, 300) || `HTTP ${status}`,
          trace,
        };
      }
      push("edge", "ok", "task updated");
      return { ok: true, tool, run_id: runId, result: { task: body }, trace };
    }
    case "create_calendar_hold": {
      const title = args?.title;
      const start = args?.start_iso;
      if (!title || !start) {
        push("validate", "error", "title and start_iso required");
        return { ok: false, tool, run_id: runId, error: "title and start_iso required", trace };
      }
      const payload = {
        title,
        start_iso: start,
        ...(args?.end_iso ? { end_iso: args.end_iso } : {}),
        ...(args?.provider ? { provider: String(args.provider).toLowerCase() } : {}),
        ...(Array.isArray(args?.targets) && args.targets.length
          ? { targets: args.targets.map((t) => String(t).toLowerCase()) }
          : {}),
        ...(args?.time_zone ? { time_zone: args.time_zone } : {}),
      };
      const { ok, status, text } = await edgeFetch(
        "/calendar/hold",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        authHeader,
      );
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { raw: text?.slice(0, 500) };
      }
      if (!ok) {
        push("calendar", "error", `POST /calendar/hold ${status}`);
        return {
          ok: false,
          tool,
          run_id: runId,
          error: body?.error || text?.slice(0, 300) || `HTTP ${status}`,
          trace,
        };
      }
      push("calendar", "ok", "hold created");
      return { ok: true, tool, run_id: runId, result: body, trace };
    }
    default:
      push("route", "error", `unknown tool ${tool}`);
      return { ok: false, tool, run_id: runId, error: `Unknown tool: ${tool}`, trace };
  }
}

const server = http.createServer((req, res) => {
  const u = req.url?.split("?")[0] || "/";
  const authHeader = req.headers.authorization || "";

  if (req.method === "GET" && (u === "/health" || u === "/healthz" || u === "/")) {
    json(res, 200, {
      status: "ok",
      role: "hermes-executor",
      port: PORT,
      contract: "syncscript/v1",
      edge_configured: Boolean(EDGE),
    });
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
    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const tool = parsed.tool || parsed.name;
        const args = parsed.arguments || parsed.args || {};
        const idemKey = parsed.idempotency_key || parsed.idempotencyKey || "";
        if (!tool) {
          json(res, 400, { ok: false, error: "tool required" });
          return;
        }
        const out = await invokeTool(tool, args, idemKey, authHeader);
        json(res, out.ok ? 200 : 400, out);
      } catch (e) {
        json(res, 400, { ok: false, error: String(e?.message || e) });
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, "0.0.0.0", () => {
  console.error(
    `[hermes-executor] http://127.0.0.1:${PORT}  EDGE=${EDGE || "(unset)"}  health=/health  tools=GET /v1/tools  invoke=POST /v1/invoke`,
  );
});
