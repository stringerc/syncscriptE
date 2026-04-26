import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const idxTs = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/index.ts'), 'utf8');
const idxTsx = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/index.tsx'), 'utf8');
const push = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/push-device-routes.tsx'), 'utf8');

assert.match(push, /\/register/);
assert.ok(idxTs.includes('push-device-routes'));
assert.ok(idxTs.includes("'/make-server-57781ad9/push'"));
assert.ok(idxTsx.includes("'/make-server-57781ad9/push'"));

console.log('push-device-routes-contract: ok');
