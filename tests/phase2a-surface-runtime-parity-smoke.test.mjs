import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('surface parity runtime storage and event hooks exist', async () => {
  const runtime = await read('src/contracts/projections/surface-parity-runtime.ts');
  const actions = await read('src/contracts/projections/surface-parity-actions.ts');
  const incidents = await read('src/contracts/projections/surface-parity-incidents.ts');
  const markers = [
    'recordTaskSurfaceSnapshot',
    'getTaskSurfaceSnapshotState',
    'requestTaskSurfaceSnapshotRefresh',
    'SURFACE_PARITY_SNAPSHOT_EVENT',
    'SURFACE_PARITY_REFRESH_REQUEST_EVENT',
    'syncscript:phase2a:surface-parity-snapshots',
  ];
  for (const marker of markers) {
    assert.ok(runtime.includes(marker), `Expected runtime marker "${marker}"`);
  }
  assert.ok(actions.includes('buildSurfaceParityActions'));
  assert.ok(actions.includes('copy_missing_ids'));
  assert.ok(incidents.includes('evaluateSurfaceParityEscalation'));
  assert.ok(incidents.includes('appendSurfaceParityIncident'));
  assert.ok(incidents.includes('updateSurfaceParityIncidentStatus'));
  assert.ok(incidents.includes('toggleSurfaceParityIncidentRunbookStep'));
  assert.ok(incidents.includes('isSurfaceParityIncidentRunbookComplete'));
});

test('major surfaces write parity snapshots and projects renders actions', async () => {
  const tasksPage = await read('src/components/pages/TasksGoalsPage.tsx');
  const workstream = await read('src/components/projects/WorkstreamFlowCanvas.tsx');
  const today = await read('src/components/TodaySection.tsx');
  const resonance = await read('src/components/pages/ResonanceEnginePage.tsx');
  const aiPage = await read('src/components/pages/AIAssistantPage.tsx');
  const projects = await read('src/components/projects/ProjectsOperatingSystem.tsx');
  const markers = [
    tasksPage.includes('recordTaskSurfaceSnapshot') && tasksPage.includes("'tasks_tab'"),
    tasksPage.includes('recordTaskSurfaceSnapshot') && tasksPage.includes("'goals'"),
    workstream.includes('recordTaskSurfaceSnapshot') && workstream.includes("'workstream'"),
    today.includes('recordTaskSurfaceSnapshot') && today.includes("'dashboard'"),
    resonance.includes('recordTaskSurfaceSnapshot') && resonance.includes("'resonance'"),
    aiPage.includes('recordTaskSurfaceSnapshot') && aiPage.includes("'ai_assistant'"),
    projects.includes('Cross-surface parity'),
    projects.includes('Goals missing'),
    projects.includes('Resonance missing'),
    projects.includes('AI missing'),
    projects.includes('Request surface refresh'),
    projects.includes('Export surface parity'),
    projects.includes('handleExportTaskSurfaceParity'),
    projects.includes('copySurfaceGapList'),
    projects.includes('Show actions'),
    projects.includes('surface.parity.escalated'),
    projects.includes('handleExportSurfaceIncidents'),
    projects.includes('Acknowledge'),
    projects.includes('Resolve'),
    projects.includes('Runbook checklist'),
    projects.includes('Runbook complete'),
    projects.includes('Runbook pending'),
  ];
  assert.ok(markers.every(Boolean), 'Expected surface parity runtime markers across surfaces');
});
