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
assert.ok(
  /worker-src[^;]*'self'[^;]*blob:/.test(csp) || /worker-src[^;]*blob:[^;]*'self'/.test(csp),
  'vercel.json CSP must set worker-src for blob workers (e.g. AgentLiveCanvas / bundler worker URLs)',
);
assert.ok(
  csp.includes('us-assets.i.posthog.com') && csp.includes('eu-assets.i.posthog.com'),
  'vercel.json CSP must allow PostHog US/EU asset hosts (web-vitals, recorder, surveys, config)',
);

console.log('nexus-map-csp-and-resolve-contract: ok');
