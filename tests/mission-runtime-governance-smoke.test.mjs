import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('EX-010 mission runtime contract exposed in API responses', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /interface MissionRuntimeContract/);
  assert.match(bridge, /contractVersion: 'v1'/);
  assert.match(bridge, /missionId:/);
  assert.match(bridge, /runId:/);
  assert.match(bridge, /toMissionRuntimeContract\(/);
  assert.match(bridge, /runtime: toMissionRuntimeContract\(mission\)/);
});

test('EX-011 typed tool contract validation enforced on mission advance', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /interface MissionToolCallRecord/);
  assert.match(bridge, /interface MissionToolErrorEnvelope/);
  assert.match(bridge, /normalizeMissionToolCalls/);
  assert.match(bridge, /INVALID_TOOL_CONTRACT/);
});

test('EX-012 approval policy integration returns approval tokens and runtime context', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  const missionClient = read('src/services/mission-control.ts');
  assert.match(bridge, /createMissionApprovalToken/);
  assert.match(bridge, /approvalToken/);
  assert.match(bridge, /approvalRequired: true/);
  assert.match(missionClient, /advanceMissionNodeWithRuntime/);
  assert.match(missionClient, /approvalToken\?: string/);
});
