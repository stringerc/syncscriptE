import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const enterprisePage = readFileSync(
  new URL('../src/components/pages/EnterpriseToolsPage.tsx', import.meta.url),
  'utf8'
);
const openclawBridge = readFileSync(
  new URL('../supabase/functions/make-server-57781ad9/openclaw-bridge.tsx', import.meta.url),
  'utf8'
);
const aiContextConfig = readFileSync(
  new URL('../src/utils/ai-context-config.ts', import.meta.url),
  'utf8'
);

test('enterprise page is mission-control based', () => {
  assert.match(enterprisePage, /Enterprise Mission Control/);
  assert.match(enterprisePage, /Mission Control/);
  assert.match(enterprisePage, /Tasks/);
  assert.match(enterprisePage, /Agents/);
  assert.match(enterprisePage, /Enterprise/);
  assert.match(enterprisePage, /Office/);
  assert.match(enterprisePage, /Memory/);
  assert.match(enterprisePage, /Status/);
  assert.match(enterprisePage, /Do/);
  assert.match(enterprisePage, /Doing/);
  assert.match(enterprisePage, /Done/);
});

test('openclaw bridge exposes enterprise facade routes', () => {
  assert.match(openclawBridge, /openclawBridge\.get\('\/enterprise\/mission-control'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/policy'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/operations\/run'/);
  assert.match(openclawBridge, /openclawBridge\.get\('\/enterprise\/runtime\/status'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/runtime\/pairing\/create'/);
  assert.match(openclawBridge, /openclawBridge\.get\('\/enterprise\/telemetry'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/tasks\/status'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/tasks\/create'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/goals'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/smart\/create'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/org\/generate'/);
  assert.match(openclawBridge, /openclawBridge\.post\('\/enterprise\/org\/team\/members\/add'/);
});

test('unified memory path is wired in openclaw bridge', () => {
  assert.match(openclawBridge, /source:\s*'syncscript-unified-memory'/);
  assert.match(openclawBridge, /getUnifiedMemorySnapshot/);
});

test('enterprise route has dedicated AI context', () => {
  assert.match(aiContextConfig, /'\/enterprise':\s*\{/);
  assert.match(aiContextConfig, /Enterprise Mission Control/);
});
