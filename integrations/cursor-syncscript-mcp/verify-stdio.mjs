#!/usr/bin/env node
/**
 * Programmatic MCP stdio smoke (same transport Cursor uses): spawn server.mjs,
 * tools/list, then tools/call syncscript_list_tasks.
 *
 * Env: SYNCSCRIPT_EDGE_BASE, SYNCSCRIPT_BEARER (sspat_ or eyJ), SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY
 * Run from repo: node --env-file=../../.env integrations/cursor-syncscript-mcp/verify-stdio.mjs
 * Or via: npm run verify:cursor-syncscript-mcp
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const serverPath = join(here, "server.mjs");

const BASE = (process.env.SYNCSCRIPT_EDGE_BASE || "").replace(/\/$/, "");
const BEARER = process.env.SYNCSCRIPT_BEARER || "";
const APIKEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!BASE || !APIKEY) {
  console.error("verify-stdio: set SYNCSCRIPT_EDGE_BASE and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY)");
  process.exit(2);
}
if (!BEARER) {
  console.error("verify-stdio: set SYNCSCRIPT_BEARER for callTool checks");
  process.exit(2);
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
  env: {
    ...process.env,
    SYNCSCRIPT_EDGE_BASE: BASE,
    SYNCSCRIPT_BEARER: BEARER,
    SUPABASE_ANON_KEY: APIKEY,
  },
});

const client = new Client({ name: "syncscript-mcp-stdio-verify", version: "1.0.0" }, { capabilities: {} });
await client.connect(transport);

const listed = await client.listTools();
const tools = listed?.tools;
if (!Array.isArray(tools)) {
  console.error("verify-stdio: listTools missing tools array");
  process.exit(1);
}
const names = new Set(tools.map((t) => t.name));
const required = [
  "syncscript_list_tasks",
  "syncscript_get_user_profile",
  "syncscript_calendar_sync_groups",
  "syncscript_activity_summary",
  "syncscript_list_capture_inbox",
  "syncscript_week_snapshot",
  "syncscript_library_list_files",
];
for (const n of required) {
  if (!names.has(n)) {
    console.error("verify-stdio: missing tool", n);
    process.exit(1);
  }
}
console.log(`OK  MCP stdio tools/list (${tools.length} tools, required names present)`);

const out = await client.callTool({ name: "syncscript_list_tasks", arguments: {} });
const block = out?.content?.find((c) => c.type === "text");
const text = block?.text || "";
if (!text.trim().startsWith("[")) {
  console.error("verify-stdio: syncscript_list_tasks expected JSON array text, got:", text.slice(0, 120));
  process.exit(1);
}
console.log("OK  MCP stdio callTool syncscript_list_tasks");

const cap = await client.callTool({ name: "syncscript_list_capture_inbox", arguments: {} });
const capBlock = cap?.content?.find((c) => c.type === "text");
const capText = capBlock?.text || "";
if (!capText.trim().startsWith("{")) {
  console.error("verify-stdio: syncscript_list_capture_inbox expected JSON object text, got:", capText.slice(0, 120));
  process.exit(1);
}
console.log("OK  MCP stdio callTool syncscript_list_capture_inbox");

const snap = await client.callTool({ name: "syncscript_week_snapshot", arguments: { activity_days: 7 } });
const snapBlock = snap?.content?.find((c) => c.type === "text");
const snapText = snapBlock?.text || "";
if (!snapText.includes('"tasks"') || !snapText.includes('"activity_summary"')) {
  console.error("verify-stdio: syncscript_week_snapshot unexpected payload:", snapText.slice(0, 200));
  process.exit(1);
}
console.log("OK  MCP stdio callTool syncscript_week_snapshot");

const lib = await client.callTool({ name: "syncscript_library_list_files", arguments: { limit: 5, offset: 0 } });
const libBlock = lib?.content?.find((c) => c.type === "text");
const libText = libBlock?.text || "";
if (!libText.trim().startsWith("{")) {
  console.error("verify-stdio: syncscript_library_list_files expected JSON object, got:", libText.slice(0, 120));
  process.exit(1);
}
console.log("OK  MCP stdio callTool syncscript_library_list_files");

await client.close();
console.log("verify-stdio: all checks passed.");
