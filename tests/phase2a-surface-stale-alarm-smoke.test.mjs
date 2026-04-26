import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('surface incident runtime supports stale snapshot alarms', async () => {
  const incidents = await read('src/contracts/projections/surface-parity-incidents.ts');
  const markers = [
    'SurfaceSnapshotAlarmState',
    'SNAPSHOT_ALARM_STATE_KEY',
    'evaluateSurfaceSnapshotAlarm',
    'stale_snapshot_alarm',
    'staleAfterMs',
    'criticalAfterMs',
  ];
  assert.ok(markers.every((marker) => incidents.includes(marker)), 'Expected stale alarm runtime markers');
});

test('projects surface escalates stale snapshot alarms and exports policy metadata', async () => {
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'SURFACE_STALE_AFTER_MS',
    'SURFACE_CRITICAL_STALE_AFTER_MS',
    'evaluateSurfaceSnapshotAlarm',
    'surface.snapshot.stale.alarm',
    "incidentType: 'stale_snapshot_alarm'",
    "packetKind: 'surface-parity-evidence'",
    "packetKind: 'surface-parity-incident-evidence'",
    'policy: {',
    'staleAfterMs: SURFACE_STALE_AFTER_MS',
    'criticalAfterMs: SURFACE_CRITICAL_STALE_AFTER_MS',
  ];
  assert.ok(markers.every((marker) => projects.includes(marker)), 'Expected stale alarm escalation/export markers');
});
