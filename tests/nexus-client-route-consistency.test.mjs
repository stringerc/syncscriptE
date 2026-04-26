/**
 * Ensures Nexus App AI clients use same-origin routes (no hard-coded production host).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('InvoiceFormModal must not hard-code production nexus-user URL', () => {
  const src = readFileSync(join(root, 'src/components/InvoiceFormModal.tsx'), 'utf8');
  assert.ok(
    !src.includes('www.syncscript.app/api/ai/nexus-user'),
    'Use NEXUS_USER_CHAT_PATH from src/config/nexus-vercel-ai-routes.ts',
  );
  assert.ok(src.includes('NEXUS_USER_CHAT_PATH'), 'Import shared Nexus route constant');
});

test('nexus-voice-user-client uses shared NEXUS_USER_CHAT_PATH', () => {
  const src = readFileSync(join(root, 'src/utils/nexus-voice-user-client.ts'), 'utf8');
  assert.ok(src.includes('NEXUS_USER_CHAT_PATH'));
  assert.ok(!src.match(/fetch\(['"]\/api\/ai\/nexus-user['"]/));
});
