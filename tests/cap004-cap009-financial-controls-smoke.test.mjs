import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('financial policy guardrails and immutable controls are present', () => {
  const source = read('supabase/functions/make-server-57781ad9/financial-routes.tsx');
  const markers = [
    'type FinancialPolicyAction',
    'createPolicyDecisionRecord',
    'assertPolicyApproval',
    'app.post("/policy/evaluate"',
    'app.post("/policy/approve"',
    'app.post("/policy/rollback-disconnect"',
    'appendImmutableControlEntry',
    'financial_disconnect_completed',
    'reportFinancialIncident',
    'app.get("/incidents"',
    'type FinancialGovernanceRole',
    'resolveFinancialGovernanceRole',
    'requireFinancialGovernanceRole',
    'app.post("/proof-packets"',
    'app.get("/proof-packets"',
  ];
  for (const marker of markers) {
    assert.ok(source.includes(marker), `Expected financial controls marker "${marker}"`);
  }
});

test('financial UI hook performs policy approval for disconnect', () => {
  const hook = read('src/hooks/useFinancialIntelligence.ts');
  const markers = [
    'requestFinancialApprovalToken',
    '/financial/policy/evaluate',
    '/financial/policy/approve',
    "'X-Financial-Approval-Token'",
    '/financial/proof-packets',
    'persistEvidenceArtifactRemote',
    'mergeEvidenceHistories',
  ];
  for (const marker of markers) {
    assert.ok(hook.includes(marker), `Expected financial hook marker "${marker}"`);
  }
});

test('policy approval endpoint enforces server-side non-observer role', () => {
  const source = read('supabase/functions/make-server-57781ad9/financial-routes.tsx');
  assert.ok(
    source.includes('requireFinancialGovernanceRole(c, user, ["owner", "advisor"], "policy.approve"'),
    'Expected policy approve route to enforce owner/advisor role server-side',
  );
});

test('mission cockpit consumes shared proof packets from backend', () => {
  const source = read('src/components/pages/MissionCockpitPage.tsx');
  const markers = [
    'loadFinancialProofPackets',
    '/financial/proof-packets?workspaceId=',
    'syncscript:phase2a:financial-evidence-history',
  ];
  for (const marker of markers) {
    assert.ok(source.includes(marker), `Expected mission cockpit packet sync marker "${marker}"`);
  }
});
