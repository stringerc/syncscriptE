import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('EX-030 approval cards expose approve/deny/rollback/snooze actions', () => {
  const page = read('src/components/pages/MissionCockpitPage.tsx');
  assert.match(page, /Approval Inbox/);
  assert.match(page, /respondApproval\(approval, 'approve'\)/);
  assert.match(page, /respondApproval\(approval, 'deny'\)/);
  assert.match(page, /respondApproval\(approval, 'rollback'\)/);
  assert.match(page, /Snooze 15m/);
  assert.match(page, /snoozeApproval\(approval\.id, 15\)/);
});

test('EX-030 watch actions are wired from approval cards', () => {
  const page = read('src/components/pages/MissionCockpitPage.tsx');
  assert.match(page, /createWatchQuickActions/);
  assert.match(page, /queueAgentAction/);
  assert.match(page, /Push approval actions to watch/);
  assert.match(page, /pushApprovalActionsToWatch/);
});
