import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('partner-rail contract and orchestration registry are present', () => {
  const contract = read('src/contracts/domains/partner-rail-contract.ts');
  const rail = read('src/orchestration/partner-rail.ts');
  const contractMarkers = [
    'PartnerRailType',
    'PartnerRailConnectorContract',
    'PartnerRailExecutionRequest',
    'PartnerRailExecutionResult',
    'PartnerRailAdapterContract',
  ];
  for (const marker of contractMarkers) {
    assert.ok(contract.includes(marker), `Expected contract marker "${marker}"`);
  }
  const railMarkers = [
    'listPartnerRailConnectors',
    'resolvePartnerRailAdapter',
    'getPartnerRailHealthSummary',
    'plaid-custody',
    'alpaca-brokerage',
    'open-execution-sandbox',
  ];
  for (const marker of railMarkers) {
    assert.ok(rail.includes(marker), `Expected partner rail marker "${marker}"`);
  }
});

test('integrations page exposes partner-rail readiness section', () => {
  const page = read('src/components/pages/IntegrationsPage.tsx');
  const markers = [
    'Partner-Rail Readiness',
    'custody/brokerage/execution',
    'partnerRailHealth',
    'partnerRails.map',
  ];
  for (const marker of markers) {
    assert.ok(page.includes(marker), `Expected integrations marker "${marker}"`);
  }
});
