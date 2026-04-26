import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('surface incident policy and routing helpers are defined', async () => {
  const incidents = await read('src/contracts/projections/surface-parity-incidents.ts');
  const markers = [
    'SurfaceParityIncidentSlaTier',
    'SurfaceParityIncidentRoutingTarget',
    'SurfaceParityIncidentPolicy',
    'buildSurfaceParityIncidentPolicy',
    'dueAtFromNow',
    'policyTier?:',
    'routingTarget?:',
    'ackDueAt?:',
    'resolveDueAt?:',
  ];
  for (const marker of markers) {
    assert.ok(incidents.includes(marker), `Expected incident policy marker "${marker}"`);
  }
});

test('projects export includes regulator-ready integrity hash', async () => {
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'packetKind: \'surface-parity-incident-evidence\'',
    'algorithm: \'sha256\'',
    'computeSha256Hex(payload)',
    'Surface incident evidence exported',
    'SLA {incident.policyTier.toUpperCase()}',
    'Route: {incident.routingTarget}',
    'Ack {dueInLabel(incident.ackDueAt)}',
    'Resolve {dueInLabel(incident.resolveDueAt)}',
  ];
  assert.ok(markers.every((marker) => projects.includes(marker)), 'Expected Projects policy/export markers');
});
