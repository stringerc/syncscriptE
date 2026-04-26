/**
 * Contract: Nexus Concierge Playbooks spec exists and retains required sections.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('nexus-concierge-playbooks.md is build-complete spec', () => {
  const p = join(root, 'integrations/research/nexus-concierge-playbooks.md');
  const raw = readFileSync(p, 'utf8');
  assert.match(raw, /\*\*Codename:\*\* `nexus-concierge-playbooks`/);
  assert.match(raw, /## 4\. Canonical data model/);
  assert.match(raw, /third_party_calls|third-party call/i);
  assert.match(raw, /email_expectations|wait_email/i);
  assert.match(raw, /Human gates/);
  assert.match(raw, /Appendix C/);
});
