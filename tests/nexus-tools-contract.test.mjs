import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, '../api/_lib/nexus-tools.ts'), 'utf8');

assert.match(src, /name:\s*'create_task'/);
assert.match(src, /name:\s*'add_note'/);
assert.match(src, /name:\s*'propose_calendar_hold'/);
assert.match(src, /name:\s*'send_document_for_signature'/);
assert.match(src, /name:\s*'update_document'/);
assert.ok(src.includes('NEXUS_TOOL_DEFINITIONS'));

console.log('nexus-tools-contract: ok');
