import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('EX-029 delegation lifecycle states and transition map are defined', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /type DelegationStatus = 'requested' \| 'planned' \| 'running' \| 'completed' \| 'failed' \| 'cancelled'/);
  assert.match(bridge, /ALLOWED_DELEGATION_TRANSITIONS/);
  assert.match(bridge, /requested: \['planned', 'failed', 'cancelled'\]/);
  assert.match(bridge, /planned: \['running', 'failed', 'cancelled'\]/);
  assert.match(bridge, /running: \['completed', 'failed', 'cancelled'\]/);
});

test('EX-029 invalid delegation transition returns explicit contract error', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /INVALID_DELEGATION_TRANSITION/);
  assert.match(bridge, /retryable: false/);
  assert.match(bridge, /openclawBridge\.post\('\/missions\/delegation\/transition'/);
});

test('EX-029 runtime contract surfaces delegation lifecycle context', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  const missionClient = read('src/services/mission-control.ts');
  assert.match(bridge, /delegationLifecycle:/);
  assert.match(missionClient, /delegationLifecycle:/);
  assert.match(missionClient, /transitionMissionDelegationStatus/);
});
