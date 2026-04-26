import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('phase2a contract spec pack contains critical sections', async () => {
  const doc = await read('PHASE_2A_CONTRACT_SPEC_PACK.md');
  const requiredSections = [
    'Canonical Contract Set',
    'Financial Contract',
    'Optimization Provider Contract',
    'Readiness Gate',
    'Contract Event Bus',
  ];
  for (const section of requiredSections) {
    assert.ok(
      doc.includes(section),
      `Missing required section "${section}" in PHASE_2A_CONTRACT_SPEC_PACK.md`,
    );
  }
});

test('phase2a contract code scaffold exists', async () => {
  const files = [
    'src/contracts/core/entity-contract.ts',
    'src/contracts/core/event-envelope.ts',
    'src/contracts/domains/task-graph-contract.ts',
    'src/contracts/domains/financial-contract.ts',
    'src/contracts/domains/optimization-provider-contract.ts',
    'src/contracts/events/contract-event-bus.ts',
    'src/contracts/index.ts',
  ];
  for (const file of files) {
    const contents = await read(file);
    assert.ok(contents.length > 0, `Expected non-empty scaffold file: ${file}`);
  }
});
