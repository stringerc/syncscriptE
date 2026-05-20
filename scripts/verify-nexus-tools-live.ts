/**
 * Live verification for Nexus tool calling (uses real AI keys from .env).
 *
 * Run from repo root:
 *   npx tsx scripts/verify-nexus-tools-live.ts
 *
 * Step 2 (full task write via runNexusToolLoop → Edge tasks API):
 * - Supabase: `SUPABASE_URL` + `SUPABASE_ANON_KEY`, or the same values under `VITE_*` / `NEXT_PUBLIC_*`,
 *   or (if unset) the same public defaults as `src/utils/supabase/info.tsx` so local verify matches the app.
 * - Auth (first match wins):
 *   - `NEXUS_LIVE_TEST_JWT`
 *   - `ENGRAM_LIVE_USER_JWT` — same signed-in JWT used by `verify-engram-edge-live.mjs` / GitHub **Edge bridges live** (repo secret)
 *   - `NEXUS_LIVE_TEST_EMAIL` + `NEXUS_LIVE_TEST_PASSWORD`
 *   - Anonymous session if `signInAnonymously()` succeeds (project must allow anonymous sign-in)
 *   - Ephemeral `signUp` (default on): `@gmail.com`-style address; session only if the project allows instant sign-in.
 *   - **`SUPABASE_SERVICE_ROLE_KEY`**: Admin `createUser` (email pre-confirmed) + `signInWithPassword` → real JWT.
 *     Runs automatically when the key is set (set `NEXUS_LIVE_TEST_SKIP_SERVICE_BOOTSTRAP=1` to disable).
 *     You cannot forge Supabase JWTs without the project JWT secret + a valid user id; use Auth APIs instead.
 */

import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Same project defaults as `scripts/engram-public-supabase-url.mjs` / client fallback (anon key is public). */
const PUBLIC_SUPABASE_URL = 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';

const EXPECTED_PROJECT_REF = 'kwhnrlzibgfedtxpkbgb';

function jwtPayloadRef(jwt: string): string | null {
  try {
    const parts = jwt.split('.');
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const o = JSON.parse(json) as { ref?: string };
    return typeof o.ref === 'string' ? o.ref : null;
  } catch {
    return null;
  }
}

/**
 * Bridge Vite/public env names into `SUPABASE_*` before `api/_lib/nexus-actions-executor` loads
 * (it reads `process.env` at import time). Enables Step 2 when only `.env` has `VITE_SUPABASE_*`.
 *
 * Default: same public URL + anon as `src/utils/supabase/info.tsx` so local verify matches the app.
 * Shells often export a **stale or foreign** `SUPABASE_ANON_KEY` (same or other project ref); those
 * JWTs may still decode but GoTrue returns **Invalid API key** after rotation.
 *
 * Set `NEXUS_VERIFY_USE_ENV_SUPABASE=1` to force using `SUPABASE_*` / `VITE_SUPABASE_*` from the
 * environment (and still reject anon keys whose JWT `ref` ≠ this project).
 */
function syncSupabaseEnvForVerify() {
  const useEnv = process.env.NEXUS_VERIFY_USE_ENV_SUPABASE === '1' || process.env.NEXUS_VERIFY_USE_ENV_SUPABASE === 'true';
  if (!useEnv) {
    process.env.SUPABASE_URL = PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_ANON_KEY = PUBLIC_SUPABASE_ANON_KEY;
    return;
  }

  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    PUBLIC_SUPABASE_URL;
  let anon =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    PUBLIC_SUPABASE_ANON_KEY;

  const ref = jwtPayloadRef(anon);
  if (ref !== EXPECTED_PROJECT_REF) {
    console.warn(
      '[verify] Supabase anon key in environment does not match project ref kwhnrlzibgfedtxpkbgb — using public URL + anon (see src/utils/supabase/info.tsx).',
    );
    process.env.SUPABASE_URL = PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_ANON_KEY = PUBLIC_SUPABASE_ANON_KEY;
    return;
  }

  process.env.SUPABASE_URL = url;
  process.env.SUPABASE_ANON_KEY = anon;
}

function loadDotEnv() {
  const p = join(process.cwd(), '.env');
  if (!existsSync(p)) {
    console.warn('[verify] No .env file — set AI keys in environment.');
    return;
  }
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

loadDotEnv();
syncSupabaseEnvForVerify();

const STEP2_TASK_TITLE = 'Nexus E2E live verify';

async function bootstrapUserWithServiceRole(
  supabaseUrl: string,
  anonKey: string,
  serviceRole: string,
): Promise<string | null> {
  const { createClient } = await import('@supabase/supabase-js');
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const email = `nexusverify${Date.now()}${randomBytes(2).toString('hex')}@gmail.com`;
  const password = randomBytes(24).toString('base64url').slice(0, 32);
  const { error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    console.error('[verify] Step 2: service-role createUser failed:', createErr.message);
    return null;
  }
  const sb = createClient(supabaseUrl, anonKey);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    console.error('[verify] Step 2: bootstrap signIn failed:', error?.message);
    return null;
  }
  console.log('[verify] Step 2: Session JWT from service-role bootstrap (new user).');
  return data.session.access_token;
}

/**
 * Real Supabase access tokens only come from Auth (sign-in/sign-up). This uses public signUp when the project
 * returns a session immediately (no email confirmation gate).
 */
async function tryEphemeralSignUp(sb: import('@supabase/supabase-js').SupabaseClient): Promise<string | null> {
  if (process.env.NEXUS_LIVE_TEST_AUTO_SIGNUP === '0' || process.env.NEXUS_LIVE_TEST_AUTO_SIGNUP === 'false') {
    return null;
  }
  // Public signUp must pass GoTrue’s format checks; many projects block example.com / disposable domains.
  const email = `nexus.tools.verify.${Date.now()}.${randomBytes(3).toString('hex')}@gmail.com`;
  const password = randomBytes(22).toString('base64url').slice(0, 28);
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    console.log('[verify] Step 2: auto signUp not available:', error.message);
    return null;
  }
  if (data.session?.access_token) {
    console.log('[verify] Step 2: Session JWT from ephemeral signUp.');
    return data.session.access_token;
  }
  if (data.user && !data.session) {
    console.log(
      '[verify] Step 2: signUp has no session (email confirmation required on this project). Trying service-role bootstrap if configured.',
    );
  }
  return null;
}

async function fetchTasksFromEdge(supabaseUrl: string, userJwt: string): Promise<Record<string, unknown>[]> {
  const base = supabaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/functions/v1/make-server-57781ad9/tasks`, {
    headers: { Authorization: `Bearer ${userJwt}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GET /tasks ${res.status}: ${text.slice(0, 400)}`);
  }
  try {
    const data = JSON.parse(text) as unknown;
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch {
    return [];
  }
}

async function main() {
  const { isAIConfigured, callChatCompletion } = await import('../api/_lib/ai-service.ts');
  const { NEXUS_TOOL_DEFINITIONS } = await import('../api/_lib/nexus-tools.ts');
  const { NEXUS_TOOLS_APPEND } = await import('../api/_lib/nexus-tool-prompts.ts');
  const { runNexusToolLoop } = await import('../api/_lib/nexus-tool-loop.ts');

  if (!isAIConfigured()) {
    console.error('[verify] FAIL: No AI provider key found (set GROQ_API_KEY, NVIDIA_API_KEY, etc. in .env)');
    process.exit(1);
  }

  console.log('[verify] Step 1: Raw chat completion with tools (expect create_task tool_calls)...');

  const probe = await callChatCompletion(
    [
      {
        role: 'system',
        content: `You are a test harness. ${NEXUS_TOOLS_APPEND}\nReply only by calling tools when asked to create a task.`,
      },
      {
        role: 'user',
        content:
          'Create a task with title "Nexus live verify probe" and priority medium. Use create_task only.',
      },
    ],
    {
      tools: NEXUS_TOOL_DEFINITIONS,
      tool_choice: 'auto',
      maxTokens: 256,
      temperature: 0.2,
    },
  );

  console.log('[verify] Provider:', probe.provider, '| model:', probe.model);

  const rawCalls = (probe.message as Record<string, unknown>).tool_calls;
  const hasCalls = Array.isArray(rawCalls) && rawCalls.length > 0;
  const names = hasCalls
    ? (rawCalls as any[]).map((c) => c?.function?.name).filter(Boolean)
    : [];

  if (!hasCalls) {
    console.error('[verify] FAIL: Provider returned no tool_calls. Message:', JSON.stringify(probe.message).slice(0, 800));
    process.exit(1);
  }

  console.log('[verify] Step 1 OK: tool_calls:', names);

  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL as string;
  const anon = process.env.SUPABASE_ANON_KEY as string;
  const sb = createClient(url, anon);
  console.log('[verify] Step 2: Supabase host:', new URL(url).host);

  let jwt =
    process.env.NEXUS_LIVE_TEST_JWT?.trim() ||
    process.env.ENGRAM_LIVE_USER_JWT?.trim() ||
    '';
  if (jwt) {
    const src = process.env.NEXUS_LIVE_TEST_JWT?.trim() ? 'NEXUS_LIVE_TEST_JWT' : 'ENGRAM_LIVE_USER_JWT';
    console.log(`[verify] Step 2: Using JWT from ${src}.`);
  }

  const testEmail = process.env.NEXUS_LIVE_TEST_EMAIL?.trim();
  const testPassword = process.env.NEXUS_LIVE_TEST_PASSWORD;
  if (!jwt && testEmail && testPassword) {
    console.log('[verify] Step 2: Signing in with NEXUS_LIVE_TEST_EMAIL...');
    const { data, error } = await sb.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (error || !data.session) {
      console.error('[verify] FAIL: signIn failed:', error?.message);
      process.exit(1);
    }
    jwt = data.session.access_token;
  }

  if (!jwt) {
    const { data: anonData, error: anonErr } = await sb.auth.signInAnonymously();
    if (!anonErr && anonData.session) {
      console.log('[verify] Step 2: Anonymous session (signInAnonymously).');
      jwt = anonData.session.access_token;
    }
  }

  if (!jwt) {
    const fromSignUp = await tryEphemeralSignUp(sb);
    if (fromSignUp) jwt = fromSignUp;
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const skipServiceBootstrap =
    process.env.NEXUS_LIVE_TEST_SKIP_SERVICE_BOOTSTRAP === '1' ||
    process.env.NEXUS_LIVE_TEST_SKIP_SERVICE_BOOTSTRAP === 'true';
  const wantServiceBootstrap =
    process.env.NEXUS_LIVE_TEST_BOOTSTRAP === '1' ||
    process.env.NEXUS_LIVE_TEST_BOOTSTRAP === 'true' ||
    Boolean(serviceRole && !skipServiceBootstrap);
  if (!jwt && wantServiceBootstrap && serviceRole) {
    const t = await bootstrapUserWithServiceRole(url, anon, serviceRole);
    if (t) jwt = t;
  }

  if (!jwt) {
    console.log(
      '[verify] Step 2 SKIP: Add SUPABASE_SERVICE_ROLE_KEY to .env (Dashboard → Settings → API) for automatic JWT via Admin API, or set ENGRAM_LIVE_USER_JWT / NEXUS_LIVE_TEST_JWT, or EMAIL+PASSWORD.',
    );
    console.log('[verify] DONE (provider + tool format OK).');
    process.exit(0);
  }

  console.log('[verify] Step 2: Full runNexusToolLoop with JWT (expect create_task ok in toolTrace)...');

  const { data: userData, error: userErr } = await sb.auth.getUser(jwt);
  if (userErr || !userData.user) {
    console.error(
      '[verify] FAIL: JWT invalid or expired (Supabase getUser). If this is CI, rotate the repo secret ENGRAM_LIVE_USER_JWT (used as NEXUS_LIVE_TEST_JWT) with a fresh Supabase session access_token for project kwhnrlzibgfedtxpkbgb.',
      userErr?.message || '',
    );
    process.exit(1);
  }

  const result = await runNexusToolLoop({
    messages: [
      {
        role: 'system',
        content: `You are Nexus. ${NEXUS_TOOLS_APPEND}`,
      },
      {
        role: 'user',
        content: `Create a task titled "${STEP2_TASK_TITLE}" with description "automated script". Priority low.`,
      },
    ],
    actor: {
      kind: 'jwt',
      user: {
        userId: userData.user.id,
        email: userData.user.email ?? null,
        accessToken: jwt,
      },
    },
    meta: { surface: 'text', requestId: `verify_${Date.now()}` },
    maxTokens: 500,
    temperature: 0.25,
  });

  const created = result.toolTrace.filter((t) => t.tool === 'create_task' && t.ok);
  if (created.length === 0) {
    console.error('[verify] FAIL: toolTrace has no successful create_task:', JSON.stringify(result.toolTrace));
    process.exit(1);
  }

  const detail = created[0]?.detail as { taskId?: string; title?: string } | undefined;
  const taskId = typeof detail?.taskId === 'string' ? detail.taskId : '';

  const tasks = await fetchTasksFromEdge(url, jwt);
  const visible = tasks.some((t) => {
    if (taskId && t.id === taskId) return true;
    const title = typeof t.title === 'string' ? t.title : '';
    return title.includes(STEP2_TASK_TITLE);
  });
  if (!visible) {
    console.error('[verify] FAIL: Task not returned by GET /tasks (persisted list).', {
      expectedId: taskId || null,
      taskCount: tasks.length,
    });
    process.exit(1);
  }

  console.log('[verify] Step 2 OK: toolTrace + GET /tasks confirmed:', detail ?? created[0]?.detail);
  console.log('[verify] DONE (full path OK).');
  process.exit(0);
}

main().catch((e) => {
  console.error('[verify] ERROR', e);
  process.exit(1);
});
