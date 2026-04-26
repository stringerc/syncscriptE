import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('EX-014 panel renders trust/observability blocks in Mission Cockpit', () => {
  const page = read('src/components/pages/MissionCockpitPage.tsx');
  assert.match(page, /What Nexus Is Doing Now/);
  assert.match(page, /Current step/);
  assert.match(page, /Next:/);
  assert.match(page, /Tools used/);
  assert.match(page, /Blockers \/ approval needed/);
});

test('EX-014 panel is wired to runtime contract and layered memory snapshot', () => {
  const page = read('src/components/pages/MissionCockpitPage.tsx');
  const service = read('src/services/mission-control.ts');
  assert.match(page, /listMissionRuntimes/);
  assert.match(page, /getLayeredMemorySnapshot/);
  assert.match(page, /latestRuntime/);
  assert.match(page, /layeredMemory/);
  assert.match(service, /export async function getLayeredMemorySnapshot/);
});
