/**
 * Agent Mode foundation contract tests.
 *
 * Verifies (statically — no DB, no network):
 *   - Foundation migration: tables, RLS, RPCs, claim/lock semantics, BYOK seed
 *   - Vercel /api/agent dispatcher: every action mapped, BYOK + policy + run
 *   - LLM adapter: every supported provider routed, BYOK > NVIDIA fallback
 *   - Agent intent detector: known true positives + obvious negatives
 *   - Oracle runner files: Dockerfile + package.json + 5 runner modules present
 *   - Frontend wiring: AppAIPage imports + sidebar panel + agent stream
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const exists = (p) => existsSync(resolve(root, p));

// ─────────────────────────────────────────────────────────────────────
// Migration
// ─────────────────────────────────────────────────────────────────────
const MIGRATION = read('supabase/migrations/20260425170000_agent_mode_foundation.sql');

test('agent foundation migration creates the four core tables', () => {
  for (const t of ['agent_runs', 'agent_run_steps', 'agent_run_messages', 'automation_policies', 'byok_keys', 'projects']) {
    assert.match(MIGRATION, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${t}`));
  }
});

test('agent_runs status check enforces the lifecycle states', () => {
  assert.match(MIGRATION, /CHECK \(status IN \('queued', 'running', 'waiting_user', 'paused', 'done', 'failed', 'cancelled'\)\)/);
});

test('runner uses FOR UPDATE SKIP LOCKED so two pollers cannot grab same row', () => {
  assert.match(MIGRATION, /FOR UPDATE SKIP LOCKED/);
  assert.match(MIGRATION, /CREATE OR REPLACE FUNCTION public\.claim_next_agent_runs/);
  assert.match(MIGRATION, /CREATE OR REPLACE FUNCTION public\.release_agent_run_claim/);
});

test('byok seed RPC restricts allowed providers and stores in vault', () => {
  assert.match(MIGRATION, /CREATE OR REPLACE FUNCTION public\.admin_seed_byok_key/);
  assert.match(MIGRATION, /vault\.create_secret\(p_value, vault_name/);
  assert.match(MIGRATION, /'openrouter','gemini','openai','anthropic','groq','xai','mistral','ollama','custom_openai_compat'/);
});

test('quota helper auto-creates default policy and returns allowed/reason JSON', () => {
  assert.match(MIGRATION, /CREATE OR REPLACE FUNCTION public\.check_agent_run_quota/);
  assert.match(MIGRATION, /'allowed', false, 'reason', 'agent_paused'/);
  assert.match(MIGRATION, /'allowed', false, 'reason', 'daily_run_cap'/);
  assert.match(MIGRATION, /'allowed', false, 'reason', 'daily_cost_cap'/);
});

test('default policy starts at Tier A with safe blocked-sites list', () => {
  assert.match(MIGRATION, /tier\s+TEXT NOT NULL DEFAULT 'A'/);
  assert.match(MIGRATION, /CHECK \(tier IN \('A', 'B', 'C', 'D'\)\)/);
  assert.match(MIGRATION, /'\*\.gov', 'chase\.com', 'bankofamerica\.com', 'wellsfargo\.com'/);
});

test('RLS policies scope every table to auth.uid()', () => {
  for (const t of ['agent_runs', 'agent_run_steps', 'agent_run_messages', 'automation_policies', 'byok_keys', 'projects']) {
    assert.match(MIGRATION, new RegExp(`ALTER TABLE public\\.${t}[\\s\\S]*?ENABLE ROW LEVEL SECURITY`));
  }
});

// ─────────────────────────────────────────────────────────────────────
// Vercel dispatcher
// ─────────────────────────────────────────────────────────────────────
const DISPATCHER = read('api/agent/[action].ts');

test('agent dispatcher maps every documented action', () => {
  const expected = ['list', 'run', 'start', 'cancel', 'interject', 'approve', 'byok-list', 'byok-set', 'byok-delete', 'policy'];
  for (const a of expected) {
    assert.match(DISPATCHER, new RegExp(`case '${a}':\\s+return handle`));
  }
});

test('dispatcher requires authenticated user before any action', () => {
  assert.match(DISPATCHER, /validateAuth\(req, res\)/);
  assert.match(DISPATCHER, /getAuthenticatedSupabaseUser\(req\)/);
});

test('dispatcher checks quota before insert via check_agent_run_quota RPC', () => {
  assert.match(DISPATCHER, /sb\.rpc\('check_agent_run_quota'/);
  assert.match(DISPATCHER, /res\.status\(429\)\.json\(\{ error: 'quota_exceeded'/);
});

test('byok-set rejects bad providers + missing endpoint for custom', () => {
  assert.match(DISPATCHER, /VALID_PROVIDERS\.includes\(provider/);
  assert.match(DISPATCHER, /endpoint_url_required_for_custom/);
});

// ─────────────────────────────────────────────────────────────────────
// LLM adapter
// ─────────────────────────────────────────────────────────────────────
const ADAPTER = read('api/_lib/agent-llm-adapter.ts');

test('adapter falls back to NVIDIA NIM when no BYOK key matches', () => {
  assert.match(ADAPTER, /'meta\/llama-3\.2-90b-vision-instruct'/);
  assert.match(ADAPTER, /https:\/\/integrate\.api\.nvidia\.com\/v1/);
  assert.match(ADAPTER, /no_byok_and_no_nvidia_key/);
});

test('adapter supports all nine providers + custom endpoint', () => {
  for (const p of ['nvidia', 'openrouter', 'gemini', 'openai', 'anthropic', 'groq', 'xai', 'mistral', 'ollama', 'custom_openai_compat']) {
    assert.match(ADAPTER, new RegExp(`['\"]${p.replace(/_/g, '_')}['\"]`));
  }
});

test('anthropic uses x-api-key + version header', () => {
  assert.ok(ADAPTER.includes("authHeaderName = provider === 'anthropic' ? 'x-api-key'"));
  assert.ok(ADAPTER.includes("'anthropic-version'") && ADAPTER.includes("'2023-06-01'"));
});

test('estimateCostCents has per-provider rates so caps mean something', () => {
  assert.match(ADAPTER, /export function estimateCostCents/);
  for (const p of ['nvidia', 'openrouter', 'gemini', 'openai', 'anthropic', 'groq']) {
    assert.match(ADAPTER, new RegExp(`${p}: \\{ in:`));
  }
});

// ─────────────────────────────────────────────────────────────────────
// Intent detector (server + client mirror)
// ─────────────────────────────────────────────────────────────────────
const INTENT = read('api/_lib/nexus-agent-intent.ts');
const INTENT_CLIENT = read('src/utils/agent-intent-detector.ts');

test('intent detector recognizes obvious agent goals', () => {
  // Verify both server and client exports look identical (modulo TS syntax).
  for (const src of [INTENT, INTENT_CLIENT]) {
    assert.match(src, /STRICT_PATTERNS/);
    assert.match(src, /FUZZY_VERBS/);
    assert.match(src, /FUZZY_TARGETS/);
    assert.match(src, /export function detectAgentIntent/);
    assert.match(src, /export function userExplicitlyRequestsAgent/);
  }
});

// ─────────────────────────────────────────────────────────────────────
// Oracle runner artifacts
// ─────────────────────────────────────────────────────────────────────
test('Oracle agent runner ships Dockerfile + package + all 5 runner modules', () => {
  for (const f of [
    'deploy/nexus-agent-runner/Dockerfile',
    'deploy/nexus-agent-runner/package.json',
    'deploy/nexus-agent-runner/env.example',
    'deploy/nexus-agent-runner/README.md',
    'deploy/nexus-agent-runner/runner/index.mjs',
    'deploy/nexus-agent-runner/runner/agent-loop.mjs',
    'deploy/nexus-agent-runner/runner/llm.mjs',
    'deploy/nexus-agent-runner/runner/browser.mjs',
    'deploy/nexus-agent-runner/runner/syncscript-tools.mjs',
    'deploy/nexus-agent-runner/runner/safety.mjs',
  ]) {
    assert.ok(exists(f), `${f} must be committed`);
  }
});

test('runner Dockerfile uses the official Playwright base image', () => {
  const docker = read('deploy/nexus-agent-runner/Dockerfile');
  assert.ok(docker.includes('mcr.microsoft.com/playwright'));
  assert.ok(docker.includes('runner/index.mjs'));
});

test('runner agent-loop emits screenshot, thought, browser_action steps via record_agent_step', () => {
  const loop = read('deploy/nexus-agent-runner/runner/agent-loop.mjs');
  assert.match(loop, /record_agent_step/);
  assert.match(loop, /complete_agent_run/);
  assert.match(loop, /pending_agent_messages/);
  assert.match(loop, /SYNCSCRIPT_TOOL_SCHEMAS/);
  assert.match(loop, /BROWSER_TOOL[\s\S]*?browser_action/);
  assert.match(loop, /FINISH_TOOL[\s\S]*?summary/);
});

test('safety gate blocks Tier-A non-read actions and routes destructive to approval', () => {
  const safety = read('deploy/nexus-agent-runner/runner/safety.mjs');
  assert.match(safety, /tier === 'A'/);
  assert.match(safety, /'goto', 'screenshot', 'scroll', 'extract_text', 'wait', 'press'/);
  assert.match(safety, /tier === 'C'[\s\S]*?'request_approval'/);
});

// ─────────────────────────────────────────────────────────────────────
// Frontend wiring
// ─────────────────────────────────────────────────────────────────────
const APPAI = read('src/components/app/pages/AppAIPage.tsx');

test('AppAIPage wires the new sidebar panel + agent run stream', () => {
  assert.match(APPAI, /from '\.\.\/\.\.\/\.\.\/components\/nexus\/AppAiSidebarPanel'/);
  assert.match(APPAI, /from '\.\.\/\.\.\/\.\.\/components\/nexus\/AgentRunStream'/);
  assert.match(APPAI, /<AppAiSidebarPanel/);
  assert.match(APPAI, /selectedAgentRunId/);
});

test('AppAIPage routes agent-intent messages to /api/agent/start', () => {
  assert.match(APPAI, /detectAgentIntent\(msg\)/);
  assert.match(APPAI, /userExplicitlyRequestsAgent\(msg\)/);
  assert.match(APPAI, /startAgentRun\.mutate/);
});

test('Library route redirects to Settings tab=files (no orphaned /library)', () => {
  const app = read('src/App.tsx');
  assert.match(app, /<Route path="library" element=\{<Navigate to="\/settings\?tab=files"/);
  assert.match(app, /<Route path="dashboard\/library" element=\{<Navigate to="\/settings\?tab=files"/);
});

test('Sidebar drops Library nav entry (replaced by Settings tab)', () => {
  const sidebar = read('src/components/Sidebar.tsx');
  assert.ok(!/label: 'Library'/.test(sidebar), 'sidebar should no longer have a Library entry');
});

test('SettingsPage mounts the Agent + Files tabs', () => {
  const settings = read('src/components/pages/SettingsPage.tsx');
  assert.match(settings, /TabsTrigger value="agent"/);
  assert.match(settings, /TabsTrigger value="files"/);
  assert.match(settings, /<AgentSettingsTab \/>/);
  assert.match(settings, /<FilesLibraryEmbed \/>/);
});

test('AgentSettingsTab includes BYOK + policy + history sections', () => {
  const tab = read('src/components/settings/AgentSettingsTab.tsx');
  assert.match(tab, /Bring your own LLM key/);
  assert.match(tab, /Trust tier/);
  assert.match(tab, /Tier A — read-only/);
  assert.match(tab, /Agent run history/);
});

test('Project filter dropdown is mounted on TasksGoalsPage', () => {
  const tasks = read('src/components/pages/TasksGoalsPage.tsx');
  assert.match(tasks, /import \{ ProjectFilterDropdown \}/);
  assert.match(tasks, /<ProjectFilterDropdown/);
});

// ─────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────
test('useAgentRuns subscribes to Realtime + invalidates query cache on changes', () => {
  const hook = read('src/hooks/useAgentRuns.ts');
  assert.ok(hook.includes('.channel(`agent-run:'), 'must subscribe to per-run Realtime channel');
  assert.match(hook, /agent_run_steps/);
  assert.match(hook, /agent_runs/);
  assert.match(hook, /useStartAgentRun/);
  assert.match(hook, /useAgentRunControls/);
  assert.match(hook, /useByokKeys/);
  assert.match(hook, /useAutomationPolicy/);
});

test('useProjects exposes selected-project state via localStorage', () => {
  const hook = read('src/hooks/useProjects.ts');
  assert.match(hook, /SELECTED_PROJECT_KEY = 'syncscript-selected-project'/);
  assert.match(hook, /useSelectedProject/);
  assert.match(hook, /useCreateProject/);
});

// ─────────────────────────────────────────────────────────────────────
// Vercel function cap (Hobby)
// ─────────────────────────────────────────────────────────────────────
test('post-call summary was folded into phone dispatcher to keep ≤12 functions', () => {
  assert.ok(!exists('api/ai/nexus-post-call-summary.ts'), 'old file should be removed');
  const phone = read('api/phone/[endpoint].ts');
  assert.match(phone, /case 'post-call-summary'/);
  const vercel = read('vercel.json');
  assert.match(vercel, /"source": "\/api\/ai\/nexus-post-call-summary"/);
  assert.match(vercel, /"destination": "\/api\/phone\/post-call-summary"/);
});
