import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizePublicContext,
  sanitizePrivateContext,
  serializePromptContext,
} from '../api/ai/_lib/nexus-context-firewall.mjs';

test('public context allows only public keys', () => {
  const result = sanitizePublicContext({
    surface: 'landing',
    page: 'pricing',
    pricing: [{ name: 'Starter', monthly: 19 }],
    features: ['AI scheduling'],
    ignored: 'drop-me',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.context, {
    surface: 'landing',
    page: 'pricing',
    pricing: [{ name: 'Starter', monthly: 19 }],
    features: ['AI scheduling'],
  });
});

test('public context rejects private-like keys', () => {
  const result = sanitizePublicContext({
    user: { id: 'u1' },
    page: 'landing',
  });

  assert.equal(result.valid, false);
  assert.match(result.reason || '', /Forbidden public context key/i);
});

test('private context allows only private keys', () => {
  const result = sanitizePrivateContext({
    user: { id: 'u1' },
    dashboard: { streak: 8 },
    resonance: { readinessPercent: 82 },
    timestamp: '2026-02-18T00:00:00.000Z',
    page: 'landing',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.context, {
    user: { id: 'u1' },
    dashboard: { streak: 8 },
    resonance: { readinessPercent: 82 },
    timestamp: '2026-02-18T00:00:00.000Z',
  });
});

test('context sanitizer rejects non-object payloads', () => {
  const pub = sanitizePublicContext('bad');
  const priv = sanitizePrivateContext(['bad']);

  assert.equal(pub.valid, false);
  assert.equal(priv.valid, false);
});

test('prompt serializer returns stable JSON for valid objects', () => {
  const output = serializePromptContext({
    surface: 'authenticated',
    dashboard: { level: 24, streak: 12 },
  });

  assert.match(output, /"surface": "authenticated"/);
  assert.match(output, /"level": 24/);
});
