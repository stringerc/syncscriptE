import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('institutional readiness utility defines scorecard model', () => {
  const utility = read('src/utils/institutional-readiness.ts');
  const markers = [
    'InstitutionalReadinessStage',
    'InstitutionalReadinessInput',
    'InstitutionalReadinessScorecard',
    'computeInstitutionalReadinessScorecard',
    'institution_ready',
    'pilot_ready',
    'foundation',
  ];
  for (const marker of markers) {
    assert.ok(utility.includes(marker), `Expected readiness utility marker "${marker}"`);
  }
});

test('mission control surfaces institutional readiness scorecard', () => {
  const page = read('src/components/pages/EnterpriseToolsPage.tsx');
  const markers = [
    'Institutional Readiness Scorecard',
    'exportInstitutionalReadinessScorecard',
    'institutionalReadiness.criteria',
    'stage: {institutionalReadiness.stage',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Expected enterprise page marker "${marker}"`);
  }
});
