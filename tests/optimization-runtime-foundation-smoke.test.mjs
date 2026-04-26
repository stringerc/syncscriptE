import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('optimization runtime foundation files are present and wired', () => {
  const runtimeTypes = read('src/orchestration/types.ts');
  const missionRuntime = read('src/orchestration/mission-runtime.ts');
  const orchestrationService = read('src/orchestration/service.ts');

  assert.match(runtimeTypes, /kind: 'plan' \| 'code' \| 'test' \| 'review' \| 'deploy' \| 'camera' \| 'notify' \| 'optimize' \| 'custom'/);
  assert.match(runtimeTypes, /reproducibilityToken\?: string/);
  assert.match(runtimeTypes, /replayPassed\?: boolean/);
  assert.match(missionRuntime, /Optimization rail execution/);
  assert.match(missionRuntime, /const replayFailed/);
  assert.match(orchestrationService, /executeOptimization/);
});

test('optimizer release gate artifacts exist in package scripts', () => {
  const pkg = read('package.json');
  assert.match(pkg, /"test:optimization-runtime-foundation-smoke"/);
  assert.match(pkg, /"release:gate:optimizer"/);
});
