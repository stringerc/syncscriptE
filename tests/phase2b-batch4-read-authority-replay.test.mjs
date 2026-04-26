import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

function simulateReadAuthorityStep({ localRows, backendRows, strictMode, backendEnabled }) {
  const localIds = localRows.map((row) => row.id);
  const backendIds = Array.isArray(backendRows) ? backendRows.map((row) => row.id) : null;
  if (!backendEnabled) {
    return {
      ids: localIds,
      source: 'local',
      guardLevel: 'none',
    };
  }
  if (backendIds) {
    return {
      ids: backendIds,
      source: 'backend',
      guardLevel: 'none',
    };
  }
  return {
    ids: localIds,
    source: 'local',
    guardLevel: strictMode ? 'critical' : 'watch',
  };
}

function runDeterministicReadReplay({ strictMode, backendOutcomes }) {
  const localTaskRows = [{ id: 't-1' }, { id: 't-2' }];
  const localGoalRows = [{ id: 'g-1' }];
  const localScheduleRows = [{ id: 'e-1' }];
  let index = 0;

  function nextOutcomeRows(localRows) {
    const outcome = backendOutcomes[index] !== false;
    index += 1;
    if (!outcome) return null;
    return localRows.map((row) => ({ id: row.id }));
  }

  const taskRead = simulateReadAuthorityStep({
    localRows: localTaskRows,
    backendRows: nextOutcomeRows(localTaskRows),
    strictMode,
    backendEnabled: true,
  });
  const goalRead = simulateReadAuthorityStep({
    localRows: localGoalRows,
    backendRows: nextOutcomeRows(localGoalRows),
    strictMode,
    backendEnabled: true,
  });
  const scheduleRead = simulateReadAuthorityStep({
    localRows: localScheduleRows,
    backendRows: nextOutcomeRows(localScheduleRows),
    strictMode,
    backendEnabled: true,
  });

  return {
    parity: {
      taskStable: taskRead.ids.join(',') === localTaskRows.map((row) => row.id).join(','),
      goalStable: goalRead.ids.join(',') === localGoalRows.map((row) => row.id).join(','),
      scheduleStable: scheduleRead.ids.join(',') === localScheduleRows.map((row) => row.id).join(','),
    },
    guardSummary: {
      task: taskRead.guardLevel,
      goal: goalRead.guardLevel,
      schedule: scheduleRead.guardLevel,
    },
  };
}

test('phase2b batch4 read authority replay remains deterministic across backend fallback mixes', () => {
  const baseline = runDeterministicReadReplay({
    strictMode: true,
    backendOutcomes: [true, true, true],
  });
  const withFallbacks = runDeterministicReadReplay({
    strictMode: true,
    backendOutcomes: [false, true, false],
  });
  assert.deepEqual(withFallbacks.parity, {
    taskStable: true,
    goalStable: true,
    scheduleStable: true,
  });
  assert.equal(baseline.guardSummary.task, 'none');
  assert.equal(withFallbacks.guardSummary.task, 'critical');
  assert.equal(withFallbacks.guardSummary.schedule, 'critical');
});

test('phase2b batch4 read authority runtime and surfaces expose strict fallback guards', async () => {
  const runtime = await read('src/contracts/runtime/backend-read-authority.ts');
  const aiContext = await read('src/contexts/AIContext.tsx');
  const resonancePage = await read('src/components/pages/ResonanceEnginePage.tsx');

  const runtimeMarkers = [
    'guardLevel',
    "'watch'",
    "'critical'",
    'resolveGuardLevel',
    'backend_read_authority_strict_fallback_local',
  ];
  for (const marker of runtimeMarkers) {
    assert.ok(runtime.includes(marker), `Missing read guard marker "${marker}"`);
  }

  const surfaceMarkers = [
    'ai.read.authority.strict.fallback',
    'resonance.read.authority.strict.fallback',
  ];
  assert.ok(aiContext.includes(surfaceMarkers[0]), `Missing surface guard marker "${surfaceMarkers[0]}"`);
  assert.ok(
    resonancePage.includes(surfaceMarkers[1]),
    `Missing surface guard marker "${surfaceMarkers[1]}"`,
  );
});
