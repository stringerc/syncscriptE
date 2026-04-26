/**
 * Static contract tests: Edge bridge + mount points stay aligned with docs and Engram API paths.
 * No Docker / Deno required — runs in CI on every machine.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bridgePath = join(root, "supabase/functions/make-server-57781ad9/engram-bridge.tsx");
const indexTsPath = join(root, "supabase/functions/make-server-57781ad9/index.ts");
const indexTsxPath = join(root, "supabase/functions/make-server-57781ad9/index.tsx");
const clientPath = join(root, "src/utils/engram-client.ts");
const typesPath = join(root, "src/types/engram.ts");
const edgeDocPath = join(root, "integrations/ENGRAM_EDGE.md");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("engram-bridge.tsx defines routes, upstream paths, and policy constants", () => {
  const b = readFileSync(bridgePath, "utf8");
  assert.match(b, /engramBridge\.get\(\s*"\/health"/);
  assert.match(b, /engramBridge\.get\(\s*"\/discover"/);
  assert.match(b, /engramBridge\.post\(\s*"\/translate"/);
  assert.match(b, /engramBridge\.post\(\s*"\/delegate"/);
  assert.match(b, /\/api\/v1\/discover/);
  assert.match(b, /\/api\/v1\/translate/);
  assert.match(b, /\/api\/v1\/delegate/);
  assert.match(b, /ENGRAM_TOKEN_REQUIRED/);
  assert.match(b, /MAX_BODY_BYTES/);
  assert.match(b, /X-Request-ID/);
  assert.match(b, /probeEngramLiveness/);
  assert.match(b, /EMPTY_BODY/);
  assert.match(b, /authenticateUser/);
});

test("index.ts and index.tsx mount engram bridge at the documented path", () => {
  for (const p of [indexTsPath, indexTsxPath]) {
    const s = readFileSync(p, "utf8");
    assert.match(s, /import\s+engramBridge\s+from\s+["']\.\/engram-bridge\.tsx["']/);
    assert.match(s, /app\.route\(\s*["']\/make-server-57781ad9\/engram["']\s*,\s*engramBridge\s*\)/);
  }
});

test("web client targets the Supabase function engram path", () => {
  const c = readFileSync(clientPath, "utf8");
  assert.match(c, /\/functions\/v1\/make-server-57781ad9\/engram/);
  assert.match(c, /fetchEngramBridgeHealth/);
  assert.match(c, /fetchEngramDiscover/);
  assert.match(c, /fetchEngramTranslate/);
  assert.match(c, /fetchEngramDelegate/);
});

test("types include bridge health and translate request", () => {
  const t = readFileSync(typesPath, "utf8");
  assert.match(t, /EngramBridgeHealth/);
  assert.match(t, /EngramBridgeErrorCode/);
  assert.match(t, /EngramTranslateRequest/);
  assert.match(t, /probePath/);
});

test("ENGRAM_EDGE.md lists endpoints and correlation", () => {
  const d = readFileSync(edgeDocPath, "utf8");
  assert.match(d, /\/translate/);
  assert.match(d, /\/delegate/);
  assert.match(d, /X-Request-ID/);
  assert.match(d, /ENGRAM_BASE_URL/);
});

test("SYNCSCRIPT_AGENT_MAP.md Engram section references bridge and client", () => {
  const m = read("SYNCSCRIPT_AGENT_MAP.md");
  assert.match(m, /engram-bridge\.tsx/);
  assert.match(m, /engram-client\.ts/);
  assert.match(m, /ENGRAM_EDGE\.md/);
});

test("live verify script exists and avoids logging secrets", () => {
  const s = readFileSync(join(root, "scripts/verify-engram-edge-live.mjs"), "utf8");
  assert.match(s, /functions\/v1\/make-server-57781ad9\/engram/);
  assert.match(s, /Never prints tokens/);
  assert.match(s, /ENGRAM_LIVE_USER_JWT/);
});

test("public Supabase URL module matches client fallback project ref", () => {
  const info = readFileSync(join(root, "src/utils/supabase/info.tsx"), "utf8");
  const pub = readFileSync(join(root, "scripts/engram-public-supabase-url.mjs"), "utf8");
  const ref = "kwhnrlzibgfedtxpkbgb";
  assert.match(info, new RegExp(ref));
  assert.match(pub, new RegExp(ref));
  const keyMarker = "vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8";
  assert.match(info, new RegExp(keyMarker));
  assert.match(pub, new RegExp(keyMarker));
});
