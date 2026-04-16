import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tools = readFileSync(join(__dirname, '../api/_lib/nexus-tools.ts'), 'utf8');
const executor = readFileSync(join(__dirname, '../api/_lib/nexus-actions-executor.ts'), 'utf8');

assert.match(tools, /name:\s*'update_document'/);
assert.match(executor, /name === 'update_document'/);
assert.match(executor, /tool:\s*'update_document'/);

console.log('nexus-update-document-contract: ok');
