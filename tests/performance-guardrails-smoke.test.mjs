import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('PERF-004 continuity heartbeat is gated by visibility/online state', () => {
  const perfHeartbeat = read('src/utils/perf-heartbeat.ts');
  const continuity = read('src/contexts/ContinuityContext.tsx');

  assert.match(perfHeartbeat, /shouldRunHeartbeatTick/);
  assert.match(perfHeartbeat, /isForegroundRuntime/);
  assert.match(continuity, /shouldRunHeartbeatTick\(\{ requireOnline: true \}\)/);
  assert.match(continuity, /visibilitychange/);
  assert.match(continuity, /getHeartbeatIntervalMs\('presence'\)/);
});

test('PERF-005 hot-path logging uses guarded logger utility', () => {
  const logger = read('src/utils/hotpath-log.ts');
  const ws = read('src/utils/openclaw-websocket.ts');
  const context = read('src/contexts/OpenClawContext.tsx');

  assert.match(logger, /import\.meta\.env\?\.DEV/);
  assert.match(logger, /hotPathLog/);
  assert.match(ws, /hotPath(Log|Warn|Error)/);
  assert.match(context, /hotPath(Log|Warn|Error)/);
});

test('PERF-006 bundle budget guardrail script is wired into frontier gate', () => {
  const pkg = read('package.json');
  const script = read('scripts/perf-budget-check.mjs');
  const journey = read('scripts/perf-journey-budget-check.mjs');
  const journeyLatency = read('scripts/perf-journey-latency-slo.mjs');

  assert.ok(
    pkg.includes('"perf:budget"') &&
      pkg.includes('node scripts/perf-budget-check.mjs') &&
      pkg.includes('node scripts/perf-journey-budget-check.mjs') &&
      pkg.includes('node scripts/perf-journey-latency-slo.mjs'),
    'Expected perf:budget to run core, journey chunk, and journey latency scripts',
  );
  assert.ok(
    pkg.includes('"release:gate:frontier-complete"') && pkg.includes('npm run perf:budget'),
    'Expected frontier gate to include performance budget check',
  );
  assert.match(script, /PERF BUDGET CHECK/);
  assert.match(script, /maxMainEntryJsBytes/);
  assert.match(script, /maxSingleJsBytes/);
  assert.match(journey, /PERF JOURNEY BUDGET CHECK/);
  assert.match(journey, /LandingPage/);
  assert.match(journey, /DashboardApp/);
  assert.match(journeyLatency, /PERF JOURNEY LATENCY SLO CHECK/);
  assert.match(journeyLatency, /landingColdLoadMs/);
  assert.match(journeyLatency, /landingToFeaturesTransitionMs/);
  assert.match(journeyLatency, /guestBootToDashboardMs/);
  assert.match(journeyLatency, /dashboardToTasksMs/);
});
