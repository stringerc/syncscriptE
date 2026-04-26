import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('canonical ledger contract is defined', () => {
  const contract = read('src/contracts/domains/financial-ledger-contract.ts');
  const markers = [
    'FinancialLedgerPostingContract',
    'FinancialLedgerBatchContract',
    'assertFinancialLedgerPosting',
    'assertFinancialLedgerBatch',
    'immutableHash',
  ];
  for (const marker of markers) {
    assert.ok(contract.includes(marker), `Expected ledger contract marker "${marker}"`);
  }
});

test('financial proof packets and shared governance mode are surfaced', () => {
  const mission = read('src/components/pages/MissionCockpitPage.tsx');
  const financial = read('src/components/pages/FinancialsPage.tsx');
  const markers = [
    'Finance Decision Proof Packets',
    'governanceWorkspaceId',
    'Shared Finance Governance Workspace',
    'Observer role cannot approve financial decisions',
    'Canonical Ledger Integrity',
  ];
  assert.ok(mission.includes(markers[0]), `Expected marker "${markers[0]}"`);
  for (const marker of markers.slice(1)) {
    assert.ok(financial.includes(marker), `Expected marker "${marker}"`);
  }
});
