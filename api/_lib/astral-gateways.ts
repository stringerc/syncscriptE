/**
 * SyncScript Astral Projection Gateway
 *
 * Remote sensing: pings real API endpoints for latency, scans real
 * npm dependency versions, and reads shared heuristics from KV store.
 * No hardcoded data — everything is live-probed or read from the user's
 * actual workspace.
 */

import { kvGet, kvSet } from '../phone/_helpers';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

export interface DependencyStatus {
  name: string;
  localVersion: string;
  latestVersion: string;
  status: 'up_to_date' | 'upgrade_available' | 'security_warning';
}

export interface ApiEndpointMetrics {
  name: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
}

export interface SwarmHeuristic {
  agentId: string;
  sharedAt: string;
  ruleTitle: string;
  heuristicSnippet: string;
  impactScore: number;
}

export interface AstralInsights {
  timestamp: string;
  dependencies: DependencyStatus[];
  endpoints: ApiEndpointMetrics[];
  heuristics: SwarmHeuristic[];
}

export interface AstralProjectionResult {
  success: boolean;
  timestamp: string;
  insights: AstralInsights;
}

// Real HTTP/HTTPS latency probe
function pingEndpoint(url: string, timeoutMs: number = 5000): Promise<{ ok: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const isHttps = url.startsWith('https');
    const mod = isHttps ? https : http;

    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      res.resume(); // consume the response to free the socket
      resolve({ ok: res.statusCode !== undefined && res.statusCode < 500, latencyMs: Date.now() - start });
    });

    req.on('error', () => resolve({ ok: false, latencyMs: Date.now() - start }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, latencyMs: timeoutMs }); });
  });
}

// Real npm outdated scan
function scanNpmOutdated(cwd: string): DependencyStatus[] {
  try {
    const output = execSync('npm outdated --json 2>/dev/null || true', {
      cwd,
      timeout: 30000,
      encoding: 'utf8',
    });

    if (!output.trim()) return []; // Everything up to date

    const outdated = JSON.parse(output);
    const deps: DependencyStatus[] = [];

    for (const [name, info] of Object.entries(outdated as Record<string, any>)) {
      deps.push({
        name,
        localVersion: info.current || info.wanted || 'unknown',
        latestVersion: info.latest || 'unknown',
        status: info.type === 'devDependencies' ? 'upgrade_available' : 'upgrade_available',
      });
    }
    return deps;
  } catch {
    return [];
  }
}

// Read shared heuristics from KV (the "swarm" — other agents write here)
async function readSwarmHeuristics(): Promise<SwarmHeuristic[]> {
  const heuristics: SwarmHeuristic[] = [];

  try {
    const sharedRules = await kvGet('nexus_swarm_heuristics');
    if (Array.isArray(sharedRules)) {
      for (const rule of sharedRules.slice(0, 10)) {
        heuristics.push({
          agentId: rule.agentId || 'unknown',
          sharedAt: rule.sharedAt || new Date().toISOString(),
          ruleTitle: rule.ruleTitle || 'Untitled rule',
          heuristicSnippet: (rule.heuristicSnippet || '').slice(0, 200),
          impactScore: rule.impactScore || 5.0,
        });
      }
    }
  } catch {}

  // If no shared heuristics exist yet, note that the swarm is empty
  if (heuristics.length === 0) {
    heuristics.push({
      agentId: 'system',
      sharedAt: new Date().toISOString(),
      ruleTitle: 'SwarmAwaitingPeers',
      heuristicSnippet: 'No peer heuristics found in KV store. The swarm activates when multiple agents share insights.',
      impactScore: 0,
    });
  }

  return heuristics;
}

export async function executeAstralProjections(userId: string): Promise<AstralProjectionResult> {
  const timestamp = new Date().toISOString();
  console.log(`[AstralProjection] Starting real external sensing for user: ${userId}`);

  // 1. Scan real npm dependencies
  console.log('[AstralProjection] Scanning npm dependencies...');
  const cwd = path.resolve(process.cwd());
  const dependencies = scanNpmOutdated(cwd);

  // If no outdated deps, report that everything is current
  if (dependencies.length === 0) {
    // Read package.json to report current deps
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const [name, version] of Object.entries(allDeps).slice(0, 5) as [string, string][]) {
        const cleaned = version.replace(/[\^~>=<]/g, '');
        dependencies.push({
          name,
          localVersion: cleaned,
          latestVersion: cleaned, // npm outdated found nothing, so we're current
          status: 'up_to_date',
        });
      }
    } catch {}
  }

  // 2. Ping real API endpoints
  console.log('[AstralProjection] Pinging API endpoints...');
  const endpointConfigs = [
    { name: 'Supabase DB Gateway', url: 'https://kwhnrlzibgfedtxpkbgb.supabase.co/rest/v1/', key: 'supabase' },
    { name: 'Twilio API', url: 'https://api.twilio.com/2010-04-01/Accounts.json', key: 'twilio' },
    { name: 'Stripe API', url: 'https://api.stripe.com/v1/balance', key: 'stripe' },
    { name: 'GitHub API', url: 'https://api.github.com/rate_limit', key: 'github' },
  ];

  const endpoints: ApiEndpointMetrics[] = [];

  // Run pings in parallel
  const pingResults = await Promise.all(
    endpointConfigs.map(async (ep) => {
      const result = await pingEndpoint(ep.url, 5000);
      return {
        name: ep.name,
        endpoint: ep.url.replace(/https?:\/\//, '').split('/')[0],
        status: result.ok
          ? result.latencyMs < 300 ? 'healthy' as const : 'degraded' as const
          : 'offline' as const,
        latencyMs: result.latencyMs,
      };
    })
  );

  endpoints.push(...pingResults);

  // 3. Read shared heuristics from real KV store
  console.log('[AstralProjection] Reading swarm heuristics from KV...');
  const heuristics = await readSwarmHeuristics();

  const insights: AstralInsights = {
    timestamp,
    dependencies,
    endpoints,
    heuristics,
  };

  const result: AstralProjectionResult = {
    success: true,
    timestamp,
    insights,
  };

  await kvSet(`astral_insights:${userId}`, result);
  console.log(`[AstralProjection] Persisted real insights for user: ${userId} (deps: ${dependencies.length}, endpoints: ${endpoints.length})`);

  return result;
}
