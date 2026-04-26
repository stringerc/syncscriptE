import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('batch5 migration boundary planner projection cache is wired', async () => {
  const planner = await read('src/contracts/projections/migration-boundary-planner.ts');
  const markers = [
    'syncscript:phase2b:batch5:migration-boundary-plans',
    'buildBatch5MigrationBoundaryPlan',
    'appendBatch5MigrationBoundaryPlan',
    'listBatch5MigrationBoundaryPlans',
    "mode: 'dry_run'",
    'rollbackCheckpointRequired: true',
    "parityGuard: 'strict'",
  ];
  for (const marker of markers) {
    assert.ok(planner.includes(marker), `Missing batch5 planner marker "${marker}"`);
  }
});

test('projects system health exposes batch5 migration dry-run controls and export', async () => {
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'handleGenerateBatch5MigrationDryRunPlan',
    'handleExportBatch5MigrationDryRunPlan',
    "packetKind: 'phase2b-batch5-migration-dry-run-plan'",
    'Approved checkpoint required before Batch 5 migration dry-run export',
    'Generate Batch 5 migration dry-run plan',
    'Export Batch 5 migration dry-run plan',
    'Batch 5 migration plans',
    'batch5.migration.plan.generated',
  ];
  for (const marker of markers) {
    assert.ok(projects.includes(marker), `Missing batch5 projects marker "${marker}"`);
  }
});

test('batch5 migration apply runtime exposes idempotency and rollback checkpoints', async () => {
  const runtime = await read('src/contracts/projections/migration-apply-runtime.ts');
  const markers = [
    'syncscript:phase2b:batch5:migration-apply-runs',
    'syncscript:phase2b:batch5:migration-rollback-checkpoints',
    'applyBatch5Migration',
    'idempotencyKey',
    "status: 'applied' | 'replayed'",
    'stateSignature',
    'taskCalendarParityPercent',
    'crossSurfaceParityPercent',
    'backendMirrorParityPercent',
  ];
  for (const marker of markers) {
    assert.ok(runtime.includes(marker), `Missing batch5 apply runtime marker "${marker}"`);
  }
});

test('projects system health exposes batch5 apply controls and checkpoint guards', async () => {
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    'handleApplyBatch5MigrationSlice',
    'handleExportBatch5ApplyDriftEvidence',
    'handleExportBatch5RolloutGateProof',
    'Approved checkpoint required before Batch 5 migration apply',
    'Batch 1 readiness must be GO before Batch 5 migration apply',
    'Approved checkpoint required before Batch 5 apply evidence export',
    'Batch 5 rollout gate must be GO before exporting apply evidence',
    'Approved checkpoint required before Batch 5 rollout gate export',
    'Batch 5 rollout gate must be GO before exporting rollout proof',
    'Generate a Batch 5 migration dry-run plan before apply',
    'Run Batch 5 migration apply at least once before exporting apply evidence',
    'Rollback checkpoint required before exporting Batch 5 apply evidence',
    'Apply Batch 5 migration slice (idempotent)',
    'Export Batch 5 apply drift evidence',
    'Export Batch 5 rollout gate proof',
    "packetKind: 'phase2b-batch5-migration-apply-evidence'",
    "packetKind: 'phase2b-batch5-rollout-gate-proof'",
    'driftDiff',
    'buildBatch5RolloutGate',
    'Batch 5 rollout gate',
    'batch5.migration.replay.assertion.passed',
    'batch5.migration.replay.assertion.failed',
    'replay assertion:',
    'Batch 5 apply runs',
    'Rollback checkpoints',
    'batch5.migration.apply.applied',
    'batch5.migration.apply.replayed',
  ];
  for (const marker of markers) {
    assert.ok(projects.includes(marker), `Missing batch5 apply projects marker "${marker}"`);
  }
});
