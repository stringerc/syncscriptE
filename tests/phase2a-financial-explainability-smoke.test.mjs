import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function read(relPath) {
  return readFile(path.join(root, relPath), 'utf8');
}

test('financial contract enforces explainability fields', async () => {
  const contract = await read('src/contracts/domains/financial-contract.ts');
  const markers = [
    'inputsUsed',
    'policyApplied',
    'confidence',
    'rollbackPath',
    'assertFinancialRecommendationContract',
  ];
  for (const marker of markers) {
    assert.ok(contract.includes(marker), `Expected financial contract marker "${marker}"`);
  }
});

test('financial command adapter and hook wire explainability path', async () => {
  const adapter = await read('src/contracts/adapters/local-financial-command-adapter.ts');
  const hook = await read('src/hooks/useFinancialIntelligence.ts');
  const financialPage = await read('src/components/pages/FinancialsPage.tsx');
  const adapterMarkers = [
    'LocalFinancialCommandAdapter',
    'generateRecommendation',
    'policyApplied',
    'confidence',
    'rollbackPath',
  ];
  for (const marker of adapterMarkers) {
    assert.ok(adapter.includes(marker), `Expected financial adapter marker "${marker}"`);
  }
  const hookMarkers = [
    'generateExplainableRecommendation',
    'approveRecommendation',
    'latestEvidenceArtifact',
    'evidenceArtifactHistory',
    'exportLatestEvidenceArtifact',
    'exportEvidenceArtifactById',
    'exportEvidenceArtifactBatch',
    'SHA-256',
    'integrity',
    'eventIds',
    'finance.recommendation.generated',
    'finance.action.approved',
    'inputsUsed',
    'policyApplied',
    'confidence',
    'rollbackPath',
  ];
  for (const marker of hookMarkers) {
    assert.ok(hook.includes(marker), `Expected financial hook marker "${marker}"`);
  }
  const pageMarkers = [
    'Explainability Packet',
    'generateExplainabilityPacket',
    'handleApproveRecommendation',
    'Export evidence',
    'Evidence history',
    'exportFilteredEvidenceArtifacts',
    'Export filtered',
    'evidenceStatusFilter',
    'expandedEvidenceArtifactId',
    'buildAuditSummaryLine',
    'copyAuditSummaryLine',
    'Copy audit summary',
    'View diff',
    'Hide diff',
    'Before approval',
    'After approval',
    'exportEvidenceArtifactById',
    'Re-export',
    'latestEvidenceArtifact.eventIds.recommendationGenerated',
    'latestRecommendation.rollbackPath',
    'latestRecommendation.policyApplied',
    'latestRecommendation.confidence',
  ];
  for (const marker of pageMarkers) {
    assert.ok(financialPage.includes(marker), `Expected FinancialsPage marker "${marker}"`);
  }
});
