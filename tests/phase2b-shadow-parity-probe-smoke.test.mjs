import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2b backend shadow parity probe exposes deterministic report shape', async () => {
  const probe = await read('src/contracts/runtime/backend-shadow-parity.ts');
  const markers = [
    'runBackendShadowParityProbe',
    "const domains: ContractDomain[] = ['task', 'goal', 'schedule', 'project']",
    'parityScore',
    "status: 'match' | 'drift' | 'unavailable'",
    'mismatchDomains',
    'unavailableDomains',
  ];
  for (const marker of markers) {
    assert.ok(probe.includes(marker), `Missing backend shadow parity probe marker "${marker}"`);
  }
});

test('projects system health renders backend mirror parity indicators', async () => {
  const projectsPage = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'runBackendShadowParityProbe',
    'setShadowParityReport',
    'Backend mirror parity',
  ];
  for (const marker of markers) {
    assert.ok(projectsPage.includes(marker), `Missing project parity UI marker "${marker}"`);
  }
});
