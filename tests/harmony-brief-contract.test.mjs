/**
 * Contract tests for Harmony Daily Briefing System.
 * Ensures the briefing compiler, twilio routing, unified scheduling key lookups, and premium frontend integration conform to system architecture.
 * Does not require external API secrets.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('Harmony Brief Compiler api/ai/insights.ts handler syntax and fallback contract', () => {
  const src = readFileSync(join(root, 'api/ai/insights.ts'), 'utf8');
  assert.match(src, /export default async function handler/, 'must export default handler function');
  assert.match(src, /getAuthenticatedSupabaseUser\(req\)/, 'must authenticate user session');
  assert.match(src, /kvGet\(`harmony_brief:\$\{userId\}`\)/, 'must fetch cached briefing from KV via harmony_brief key');
  assert.match(src, /kvSet\(`harmony_brief:\$\{userId\}`/, 'must cache compiled briefing in KV');
  assert.match(src, /callAI\(/, 'must invoke the AI service engine');
  assert.match(src, /You are Harmony, the elite daily briefing engine for SyncScript/, 'must prompt AI with the elite briefing role');
  assert.match(src, /"text":/, 'must return a JSON schema containing the text parameter');
});

test('Unified KV Helpers api/phone/_helpers.ts scheduling key resolution and briefing context contracts', () => {
  const src = readFileSync(join(root, 'api/phone/_helpers.ts'), 'utf8');
  assert.match(src, /export async function buildBriefingContext/, 'must export buildBriefingContext');
  assert.match(src, /harmony_brief:\$\{userId\}/, 'must include cached harmony_brief within briefing context');
  assert.match(src, /export async function getBriefingSchedule/, 'must export getBriefingSchedule');
  assert.match(src, /kvGet\(`briefing_schedule:\$\{userId\}:morning`\)/, 'getBriefingSchedule must fallback to morning key');
  assert.match(src, /kvGet\(`briefing_schedule:\$\{userId\}:evening`\)/, 'getBriefingSchedule must fallback to evening key');
});

test('Twilio Call Greeting api/phone/_route-twiml.ts dynamic welcome override', () => {
  const src = readFileSync(join(root, 'api/phone/_route-twiml.ts'), 'utf8');
  assert.match(src, /harmony_brief:\$\{convUserId\}/, 'must check harmony_brief cache for greeting');
  assert.match(src, /greeting = cached\.text/, 'must override default greeting with compiled brief text');
  assert.match(src, /console\.log\(`\[TwilioTwiML\] Speaking compiled Harmony brief for user/, 'must log speaking action');
});

test('Premium Dashboard Card src/components/DashboardBriefing.tsx frontend integrations', () => {
  const src = readFileSync(join(root, 'src/components/DashboardBriefing.tsx'), 'utf8');
  assert.match(src, /export function DashboardBriefing\(\)/, 'must export DashboardBriefing component');
  assert.match(src, /fetch\('\/api\/ai\/harmony-brief'/, 'must fetch cached daily brief');
  assert.match(src, /window\.speechSynthesis\.speak\(utterance\)/, 'must support on-demand local SpeechSynthesis speak fallback');
  assert.match(src, /fetch\('\/api\/phone\/calls\?action=outbound'/, 'must support Call Phone Twilio outbound dispatches');
  assert.match(src, /AnimatePresence/, 'must use AnimatePresence for premium expanding transitions');
  assert.match(src, /motion\.div/, 'must use motion.div for expanding animations');
  assert.match(src, /🔒/, 'must support rendering locked milestones icon');
});
