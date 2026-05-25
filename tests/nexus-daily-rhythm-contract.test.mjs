/**
 * Nexus Daily Rhythm — Contract Tests
 *
 * Validates:
 * 1. Gmail reader module structure and graceful degradation
 * 2. Briefing compiler KV key generation and result shapes
 * 3. Cron router registration for nexus-daily-rhythm
 * 4. Phone dispatch handling of nexus-rhythm-* briefing types
 * 5. Insights endpoint voice-debrief resource handling
 * 6. DailyOpsModal voice debrief hydration code presence
 */

import { readFileSync, existsSync } from 'fs';
import { strict as assert } from 'assert';

const PASS = '\x1b[32m✔\x1b[0m';
const FAIL = '\x1b[31m✘\x1b[0m';
let passed = 0;
let failed = 0;

function test(name, fn) {
  const start = performance.now();
  try {
    fn();
    const ms = (performance.now() - start).toFixed(2);
    console.log(`${PASS} ${name} (${ms}ms)`);
    passed++;
  } catch (e) {
    const ms = (performance.now() - start).toFixed(2);
    console.log(`${FAIL} ${name} (${ms}ms)`);
    console.error(`  ${e.message}`);
    failed++;
  }
}

// ── Test 1: Gmail Reader Module ────────────────────────────────────

test('Gmail reader api/_lib/nexus-gmail-reader.ts exists and exports correctly', () => {
  const path = 'api/_lib/nexus-gmail-reader.ts';
  assert.ok(existsSync(path), `${path} must exist`);
  const src = readFileSync(path, 'utf8');

  // Key exports
  assert.ok(src.includes('export interface EmailInsight'), 'Must export EmailInsight interface');
  assert.ok(src.includes('export function isGmailConfigured'), 'Must export isGmailConfigured');
  assert.ok(src.includes('export async function fetchImportantEmails'), 'Must export fetchImportantEmails');
  assert.ok(src.includes('export function extractEmailSummaries'), 'Must export extractEmailSummaries');
  assert.ok(src.includes('export async function getEmailBriefingBlock'), 'Must export getEmailBriefingBlock');

  // Graceful degradation
  assert.ok(src.includes('GMAIL_CLIENT_ID'), 'Must reference GMAIL_CLIENT_ID env var');
  assert.ok(src.includes('GMAIL_CLIENT_SECRET'), 'Must reference GMAIL_CLIENT_SECRET env var');
  assert.ok(src.includes('GMAIL_REFRESH_TOKEN'), 'Must reference GMAIL_REFRESH_TOKEN env var');
  assert.ok(src.includes('return []'), 'Must gracefully return empty on missing credentials');
});

// ── Test 2: Briefing Compiler Module ───────────────────────────────

test('Briefing compiler api/_lib/nexus-briefing-compiler.ts exports correct shape', () => {
  const path = 'api/_lib/nexus-briefing-compiler.ts';
  assert.ok(existsSync(path), `${path} must exist`);
  const src = readFileSync(path, 'utf8');

  // Core compilers
  assert.ok(src.includes('export async function compileMorningBrief'), 'Must export compileMorningBrief');
  assert.ok(src.includes('export async function compileNoonCheckIn'), 'Must export compileNoonCheckIn');
  assert.ok(src.includes('export async function compileDebriefPrompt'), 'Must export compileDebriefPrompt');

  // Persistence
  assert.ok(src.includes('export async function persistVoiceDebrief'), 'Must export persistVoiceDebrief');
  assert.ok(src.includes('export async function getVoiceDebrief'), 'Must export getVoiceDebrief');
  assert.ok(src.includes('export async function deferQuestion'), 'Must export deferQuestion');

  // KV keys
  assert.ok(src.includes('nexus_rhythm_brief'), 'Must use nexus_rhythm_brief KV prefix');
  assert.ok(src.includes('nexus_voice_debrief'), 'Must use nexus_voice_debrief KV prefix');
  assert.ok(src.includes('nexus_deferred_questions'), 'Must use nexus_deferred_questions KV prefix');
  assert.ok(src.includes('nexus_rhythm_dispatched'), 'Must use nexus_rhythm_dispatched KV prefix');

  // Interfaces
  assert.ok(src.includes('export interface MorningBriefResult'), 'Must export MorningBriefResult type');
  assert.ok(src.includes('export interface NoonCheckInResult'), 'Must export NoonCheckInResult type');
  assert.ok(src.includes('export interface DebriefPromptResult'), 'Must export DebriefPromptResult type');
  assert.ok(src.includes('export interface VoiceDebriefData'), 'Must export VoiceDebriefData type');
});

// ── Test 3: Cron Router Registration ───────────────────────────────

test('Cron router api/cron/[job].ts registers nexus-daily-rhythm handler', () => {
  const path = 'api/cron/[job].ts';
  const src = readFileSync(path, 'utf8');

  assert.ok(src.includes("case 'nexus-daily-rhythm':"), 'Must have nexus-daily-rhythm case in switch');
  assert.ok(src.includes('handleNexusDailyRhythm'), 'Must reference handleNexusDailyRhythm function');

  // Idempotency
  assert.ok(src.includes('rhythmDispatchedKey'), 'Must use rhythmDispatchedKey for idempotency');
  assert.ok(src.includes('alreadyDispatched'), 'Must check for already dispatched');

  // EST timezone handling
  assert.ok(src.includes('America/New_York'), 'Must use America/New_York timezone');

  // Three cadences
  assert.ok(src.includes("cadence = 'morning'"), 'Must handle morning cadence');
  assert.ok(src.includes("cadence = 'noon'"), 'Must handle noon cadence');
  assert.ok(src.includes("cadence = 'debrief'"), 'Must handle debrief cadence');

  // Environment config
  assert.ok(src.includes('WAKE_UP_PHONE_NUMBER'), 'Must read WAKE_UP_PHONE_NUMBER');
  assert.ok(src.includes('NEXUS_RHYTHM_USER_ID'), 'Must read NEXUS_RHYTHM_USER_ID');
  assert.ok(src.includes('NEXUS_RHYTHM_USER_EMAIL'), 'Must read NEXUS_RHYTHM_USER_EMAIL');
});

// ── Test 4: Vercel Cron Configuration ──────────────────────────────

test('vercel.json contains nexus-daily-rhythm cron entry (hourly)', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.ok(Array.isArray(config.crons), 'crons must be an array');

  const rhythmCron = config.crons.find(c => c.path === '/api/cron/nexus-daily-rhythm');
  assert.ok(rhythmCron, 'Must have /api/cron/nexus-daily-rhythm cron entry');
  assert.strictEqual(rhythmCron.schedule, '0 * * * *', 'Must run hourly (0 * * * *)');
});

// ── Test 5: Phone Dispatch Handles nexus-rhythm-* Types ────────────

test('Phone helpers _helpers.ts handles nexus-rhythm-* briefing types in dispatch', () => {
  const src = readFileSync('api/phone/_helpers.ts', 'utf8');

  assert.ok(
    src.includes("job.briefingType?.startsWith('nexus-rhythm-')"),
    'Must check for nexus-rhythm- prefix in dispatch',
  );
  assert.ok(src.includes('nexus-rhythm-morning'), 'Must reference nexus-rhythm-morning type');
});

// ── Test 6: TwiML Route Handles Rhythm Call Types ──────────────────

test('TwiML route _route-twiml.ts handles nexus-rhythm-* call types', () => {
  const src = readFileSync('api/phone/_route-twiml.ts', 'utf8');

  // Rhythm briefing loading
  assert.ok(
    src.includes("callType.startsWith('nexus-rhythm-')"),
    'Must check for nexus-rhythm- call types',
  );
  assert.ok(src.includes('nexus_rhythm_brief'), 'Must load from nexus_rhythm_brief KV key');

  // Debrief tracking
  assert.ok(src.includes('callDebriefTracker'), 'Must have callDebriefTracker map');
  assert.ok(src.includes('persistVoiceDebrief'), 'Must call persistVoiceDebrief on debrief call end');
});

// ── Test 7: Insights Endpoint Supports voice-debrief ───────────────

test('Insights api/ai/insights.ts supports voice-debrief and nexus-rhythm-status resources', () => {
  const src = readFileSync('api/ai/insights.ts', 'utf8');

  assert.ok(src.includes("resource === 'voice-debrief'"), 'Must handle voice-debrief resource');
  assert.ok(src.includes('nexus_voice_debrief'), 'Must read from nexus_voice_debrief KV');
  assert.ok(src.includes("resource === 'nexus-rhythm-status'"), 'Must handle nexus-rhythm-status resource');
  assert.ok(src.includes('nexus_rhythm_dispatched'), 'Must read from nexus_rhythm_dispatched KV');
});

// ── Test 8: DailyOpsModal Hydrates Voice Debrief ───────────────────

test('DailyOpsModal src/components/DailyOpsModal.tsx hydrates voice debrief data', () => {
  const src = readFileSync('src/components/DailyOpsModal.tsx', 'utf8');

  assert.ok(src.includes('voice-debrief'), 'Must fetch voice-debrief resource');
  assert.ok(src.includes('voiceDebriefLoaded'), 'Must track voiceDebriefLoaded state');
  assert.ok(src.includes('voiceDebriefTime'), 'Must track voiceDebriefTime for UI indicator');
  assert.ok(src.includes('Nexus captured your debrief'), 'Must show voice debrief indicator text');
});

// ── Summary ────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
