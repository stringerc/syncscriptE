import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('EX-013 memory layering contract exists in OpenClaw bridge', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /type MemoryLayer = 'thought_memory' \| 'goal_memory' \| 'execution_memory'/);
  assert.match(bridge, /MEMORY_LAYER_TYPES/);
  assert.match(bridge, /classifyMemoryLayer/);
  assert.match(bridge, /openclawBridge\.post\('\/memory\/layered'/);
  assert.match(bridge, /source: 'syncscript-layered-memory'/);
});

test('EX-013 thought-to-goal promotion requires explicit confirmation and cooldown', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  assert.match(bridge, /openclawBridge\.post\('\/memory\/promote-goal'/);
  assert.match(bridge, /if \(!confirmed\)/);
  assert.match(bridge, /setMemoryPromotionCooldown/);
  assert.match(bridge, /PROMOTION_COOLDOWN_ACTIVE/);
  assert.match(bridge, /promoted_from_thought/);
});

test('EX-013 execution memory artifacts and client APIs are wired', () => {
  const bridge = read('supabase/functions/make-server-57781ad9/openclaw-bridge.tsx');
  const client = read('src/utils/openclaw-client.ts');
  assert.match(bridge, /openclawBridge\.post\('\/memory\/execution-artifact'/);
  assert.match(bridge, /'execution_memory'/);
  assert.match(client, /memoryLayered: '\/memory\/layered'/);
  assert.match(client, /promoteThoughtToGoal/);
  assert.match(client, /storeExecutionArtifactMemory/);
});
