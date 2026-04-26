import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

const vercel = JSON.parse(fs.readFileSync(join(root, '../vercel.json'), 'utf8'));
const globalHeaders = vercel.headers?.find((h) => h.source === '/(.*)');
const csp = globalHeaders?.headers?.find((x) => x.key === 'Content-Security-Policy')?.value || '';
assert.ok(
  csp.includes('frame-src') && csp.includes('openstreetmap.org'),
  'vercel.json CSP must allow OSM iframe (frame-src … openstreetmap.org)',
);

console.log('nexus-map-csp-and-resolve-contract: ok');
