import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const app = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const nav = readFileSync(join(root, 'src', 'utils', 'navigation.ts'), 'utf8');
const edge = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/resources-library-routes.tsx'), 'utf8');
const idx = readFileSync(join(root, 'supabase/functions/make-server-57781ad9/index.ts'), 'utf8');
const mig = readFileSync(join(root, 'supabase/migrations/20260412100000_user_files_library.sql'), 'utf8');

assert.match(app, /path="library"/);
assert.match(nav, /library:\s*'\/library'/);
assert.ok(edge.includes('/resources/upload'));
assert.ok(edge.includes('/resources/upload-json'));
assert.ok(edge.includes('requireLibraryUser'));
assert.ok(edge.includes('/resources/search'));
assert.ok(edge.includes('/resources/file/:id/email-self'));
assert.ok(edge.includes('/resources/file/:id/pin-to-library'));
assert.ok(edge.includes('user_files'));
assert.ok(idx.includes('resources-library-routes'));
assert.ok(mig.includes('user_files'));
assert.ok(mig.includes('file_entity_links'));

console.log('user-files-library-contract: ok');
