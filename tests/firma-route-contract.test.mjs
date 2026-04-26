import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const firma = readFileSync(join(root, 'api/firma/[action].ts'), 'utf8');
const executor = readFileSync(join(root, 'api/_lib/nexus-actions-executor.ts'), 'utf8');
const edge = readFileSync(
  join(root, 'supabase/functions/make-server-57781ad9/email-task-routes.tsx'),
  'utf8',
);

assert.ok(
  firma.includes('signing-requests/create-and-send'),
  'Firma route must use atomic create-and-send so signers receive email',
);
assert.ok(firma.includes('FIRMA_URL'), 'Firma handler must call Firma API');
assert.ok(firma.includes('/internal/firma-webhook'), 'Vercel webhook must forward to Edge');
assert.ok(firma.includes("case 'webhook'"), 'Firma router must expose webhook action');
assert.ok(firma.includes("case 'create-signing-request'"), 'Firma router must expose create-signing-request action');
assert.ok(executor.includes("name === 'send_document_for_signature'"), 'Nexus executor must handle Firma tool');
assert.ok(executor.includes('/api/firma/create-signing-request'), 'Executor must call Vercel Firma route');
assert.match(edge, /\/internal\/firma-webhook/);

console.log('firma-route-contract: ok');
