import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('batch4 read authority provenance exports and controls are wired in projects health', async () => {
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'getReadAuthorityRoutingSnapshot',
    'READ_AUTHORITY_FLAG_KEYS',
    'getLatestReadAuthorityProvenanceBySurface',
    'listReadAuthorityProvenance',
    "packetKind: 'phase2b-batch4-preflip-baseline'",
    "packetKind: 'phase2b-batch4-ai-strict-proof'",
    "packetKind: 'phase2b-batch4-resonance-strict-proof'",
    'handleExportBatch4PreflipBaseline',
    'handleExportBatch4AiStrictProof',
    'handleExportBatch4ResonanceStrictProof',
    'Approved checkpoint required before Batch 4 pre-flip export',
    'Approved checkpoint required before Batch 4 AI strict proof export',
    'Approved checkpoint required before Batch 4 resonance strict proof export',
    'Export Batch 4 pre-flip baseline',
    'Export Batch 4 AI strict proof',
    'Export Batch 4 resonance strict proof',
    'AI read backend',
    'AI read strict',
    'Resonance read backend',
    'Resonance read strict',
    'Apply AI read-first strict preset',
    'Apply resonance read strict preset',
    'AI read-first strict preset applied',
    'Resonance read strict preset applied',
  ];
  for (const marker of markers) {
    assert.ok(projects.includes(marker), `Missing Batch 4 read authority export marker "${marker}"`);
  }
});

test('read authority provenance cache is persisted for ai and resonance surfaces', async () => {
  const cache = await read('src/contracts/projections/read-authority-provenance.ts');
  const aiContext = await read('src/contexts/AIContext.tsx');
  const resonancePage = await read('src/components/pages/ResonanceEnginePage.tsx');
  const markers = [
    'syncscript:phase2b:read-authority-provenance',
    'recordReadAuthorityProvenance',
    'getLatestReadAuthorityProvenanceBySurface',
  ];
  for (const marker of markers) {
    assert.ok(cache.includes(marker), `Missing provenance cache marker "${marker}"`);
  }
  assert.ok(
    aiContext.includes("recordReadAuthorityProvenance('ai', 'task'"),
    'Missing AI provenance write marker',
  );
  assert.ok(
    resonancePage.includes("recordReadAuthorityProvenance('resonance', 'task'"),
    'Missing resonance provenance write marker',
  );
});
