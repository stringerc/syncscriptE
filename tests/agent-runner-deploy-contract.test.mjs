/**
 * Contract for the Oracle agent-runner deployment surface + voice docking +
 * persistent browser contexts. Static-only — no network, no DB.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const exists = (p) => existsSync(resolve(root, p));

// ─────────────────────────────────────────────────────────────────────
// 1. GHCR build workflow
// ─────────────────────────────────────────────────────────────────────
test('agent-runner-image workflow targets GHCR + multi-arch + caches via GH Actions', () => {
  const wf = read('.github/workflows/agent-runner-image.yml');
  assert.match(wf, /docker\/login-action@v3/);
  assert.match(wf, /registry: ghcr\.io/);
  assert.match(wf, /password: \$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  assert.match(wf, /linux\/amd64,linux\/arm64/);
  assert.match(wf, /cache-from: type=gha/);
  assert.match(wf, /cache-to: type=gha,mode=max/);
  assert.match(wf, /context: deploy\/nexus-agent-runner/);
});

test('workflow only triggers on relevant path changes', () => {
  const wf = read('.github/workflows/agent-runner-image.yml');
  assert.match(wf, /paths:[\s\S]+?deploy\/nexus-agent-runner/);
});

// ─────────────────────────────────────────────────────────────────────
// 2. bringup.sh: idempotent, validates env, health-probes
// ─────────────────────────────────────────────────────────────────────
test('bringup.sh exists and is executable', () => {
  const path = resolve(root, 'deploy/nexus-agent-runner/bringup.sh');
  assert.ok(existsSync(path), 'bringup.sh must be present');
  const stat = statSync(path);
  assert.ok((stat.mode & 0o111) !== 0, 'bringup.sh must be +x');
});

test('bringup.sh validates env keys, pulls latest image, replaces container, health-probes', () => {
  const sh = read('deploy/nexus-agent-runner/bringup.sh');
  assert.match(sh, /set -euo pipefail/);
  assert.match(sh, /SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY NVIDIA_API_KEY NEXUS_PHONE_EDGE_SECRET AGENT_RUNNER_TOKEN/);
  assert.match(sh, /docker pull "\$IMAGE"/);
  assert.match(sh, /docker stop "\$NAME"/);
  assert.match(sh, /docker rm "\$NAME"/);
  assert.match(sh, /docker run -d/);
  assert.match(sh, /--restart=unless-stopped/);
  assert.match(sh, /--shm-size=2g/);
  assert.match(sh, /\/v1\/health/);
});

test('bringup.sh self-installs to /opt so future updates are one-line', () => {
  const sh = read('deploy/nexus-agent-runner/bringup.sh');
  assert.match(sh, /\$SUDO mkdir -p "\$INSTALL_DIR"/);
  assert.match(sh, /cp "\$0" "\$INSTALL_DIR\/bringup\.sh"/);
});

// ─────────────────────────────────────────────────────────────────────
// 3. Live verifier
// ─────────────────────────────────────────────────────────────────────
test('verify-agent-runner-live.mjs probes /v1/health and asserts shape', () => {
  const js = read('scripts/verify-agent-runner-live.mjs');
  assert.match(js, /\/v1\/health/);
  for (const k of ['ok', 'started_at', 'active_runs', 'max_concurrency']) {
    assert.ok(js.includes(`'${k}'`) || js.includes(`"${k}"`), `health key '${k}' must be asserted`);
  }
  assert.match(js, /AGENT_RUNNER_LIVE_VERIFY/);
});

test('verify script is in gitignore allowlist (not lost on next clone)', () => {
  const ignore = read('.gitignore');
  assert.match(ignore, /!scripts\/verify-agent-runner-live\.mjs/);
});

// ─────────────────────────────────────────────────────────────────────
// 4. Voice docking
// ─────────────────────────────────────────────────────────────────────
test('useActiveAgentRun returns the most-recent active run', () => {
  const hook = read('src/hooks/useActiveAgentRun.ts');
  assert.match(hook, /'queued', 'running', 'waiting_user', 'paused'/);
  assert.match(hook, /export function useActiveAgentRun/);
  assert.match(hook, /useAgentRuns/);
});

test('VoiceDockedFrame uses spring transition and exposes tap-to-expand a11y', () => {
  const frame = read('src/components/nexus/VoiceDockedFrame.tsx');
  assert.match(frame, /docked: boolean/);
  assert.match(frame, /onExpand: \(\) => void/);
  assert.match(frame, /type: 'spring'/);
  assert.match(frame, /role=\{docked \? 'button' : undefined\}/);
  assert.match(frame, /Enter|Space/);
});

test('AppAIPage wires voice dock when an agent run is active', () => {
  const ai = read('src/components/app/pages/AppAIPage.tsx');
  assert.match(ai, /useActiveAgentRun/);
  assert.match(ai, /VoiceDockedFrame/);
  assert.match(ai, /voiceDocked = Boolean\(showVoiceEngine && activeAgentRun\)/);
});

// ─────────────────────────────────────────────────────────────────────
// 5. Persistent browser contexts
// ─────────────────────────────────────────────────────────────────────
const BC_MIGRATION = read('supabase/migrations/20260425220000_browser_contexts.sql');

test('browser_contexts table + RLS', () => {
  assert.match(BC_MIGRATION, /CREATE TABLE IF NOT EXISTS public\.browser_contexts/);
  assert.match(BC_MIGRATION, /ALTER TABLE public\.browser_contexts\s+ENABLE ROW LEVEL SECURITY/);
  assert.match(BC_MIGRATION, /CREATE POLICY "browser_contexts_owner_select"/);
  assert.match(BC_MIGRATION, /CREATE POLICY "browser_contexts_owner_delete"/);
});

test('browser context save/load are SECURITY DEFINER + service_role only', () => {
  assert.match(BC_MIGRATION, /CREATE OR REPLACE FUNCTION public\.admin_save_browser_context/);
  assert.match(BC_MIGRATION, /CREATE OR REPLACE FUNCTION public\.admin_load_browser_context/);
  assert.match(BC_MIGRATION, /SECURITY DEFINER[\s\S]+?vault\.create_secret/);
  assert.match(BC_MIGRATION, /GRANT\s+EXECUTE ON FUNCTION public\.admin_save_browser_context\(UUID, TEXT, TEXT\[\], INT\)\s+TO service_role/);
  assert.match(BC_MIGRATION, /GRANT\s+EXECUTE ON FUNCTION public\.admin_load_browser_context\(UUID\)\s+TO service_role/);
});

test('clear_browser_context + disconnect_browser_site exposed to authenticated user', () => {
  assert.match(BC_MIGRATION, /CREATE OR REPLACE FUNCTION public\.clear_browser_context\(\)/);
  assert.match(BC_MIGRATION, /CREATE OR REPLACE FUNCTION public\.disconnect_browser_site\(p_hostname TEXT\)/);
  assert.match(BC_MIGRATION, /GRANT\s+EXECUTE ON FUNCTION public\.clear_browser_context\(\)\s+TO authenticated/);
  assert.match(BC_MIGRATION, /GRANT\s+EXECUTE ON FUNCTION public\.disconnect_browser_site\(TEXT\)\s+TO authenticated/);
});

test('disconnect_browser_site filters cookies by domain match (suffix-aware)', () => {
  assert.match(BC_MIGRATION, /lower\(c ->> 'domain'\) LIKE '%\.' \|\| lower\(p_hostname\)/);
});

test('runner loads + saves storageState via the new RPCs', () => {
  const browser = read('deploy/nexus-agent-runner/runner/browser.mjs');
  const loop = read('deploy/nexus-agent-runner/runner/agent-loop.mjs');
  assert.match(browser, /export async function captureStorageState/);
  assert.match(browser, /storageState/);
  assert.match(loop, /admin_load_browser_context/);
  assert.match(loop, /admin_save_browser_context/);
  assert.match(loop, /captureStorageState/);
});

test('Settings → Agent embeds Connected sites section', () => {
  const tab = read('src/components/settings/AgentSettingsTab.tsx');
  assert.match(tab, /import \{ ConnectedSitesSection \}/);
  assert.match(tab, /<ConnectedSitesSection \/>/);
});

test('Connected sites UI calls clear_browser_context + disconnect_browser_site RPCs', () => {
  const hook = read('src/hooks/useBrowserContext.ts');
  assert.match(hook, /clear_browser_context/);
  assert.match(hook, /disconnect_browser_site/);
  assert.match(hook, /p_hostname/);
});
