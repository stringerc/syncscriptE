/**
 * Contract: Twilio phone → canonical Nexus tool loop (no live network).
 * Guards phone-specific persistence (Edge /phone/nexus-execute) vs JWT /tasks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(rel) {
  return readFileSync(join(__dirname, '../', rel), 'utf8');
}

const executor = read('api/_lib/nexus-actions-executor.ts');
const helpers = read('api/phone/_helpers.ts');
const tools = read('api/_lib/nexus-tools.ts');
const routes = read('supabase/functions/make-server-57781ad9/email-task-routes.tsx');

assert.match(executor, /phone\/nexus-execute/);
assert.match(executor, /x-nexus-internal-secret/);
assert.match(executor, /NEXUS_PHONE_EDGE_SECRET/);
assert.match(executor, /VITE_SUPABASE_URL/);
assert.match(executor, /kind:\s*'phone'/);
assert.ok(executor.includes('postTaskPhone') && executor.includes('postTaskJwt'));

assert.match(helpers, /generatePhoneAIResponseWithTools/);
assert.match(helpers, /runNexusToolLoop\(/);
assert.match(helpers, /surface:\s*'phone'/);
assert.match(helpers, /kind:\s*'phone'/);
assert.match(helpers, /NEXUS_PHONE_TOOLS_APPEND/);
assert.match(helpers, /NEXUS_PHONE_USE_OPENCLAW/);
assert.match(helpers, /couldn't save that to your task list from this call/);
assert.match(helpers, /phoneUserSoundsLikeTaskPersistIntent/);

assert.match(tools, /NEXUS_PHONE_TOOLS_APPEND/);
assert.match(tools, /create_task,\s*add_note,\s*propose_calendar_hold/s);

assert.match(routes, /\/phone\/nexus-execute/);
assert.match(routes, /x-nexus-internal-secret/);
assert.match(routes, /saveTasks\(/);

const callsRoute = read('api/phone/_route-calls.ts');
assert.match(callsRoute, /pending-nexus/);
assert.match(callsRoute, /getPendingNexusCallLines/);

const twimlRoute = read('api/phone/_route-twiml.ts');
assert.match(twimlRoute, /formatNexusToolResultsForUi/);
assert.match(twimlRoute, /truncateForTwilioSay/);
assert.match(twimlRoute, /invalid Twilio signature \(returning TwiML/);

const helpersMore = read('api/phone/_helpers.ts');
assert.match(helpersMore, /PHONE_CALLER_INDEX_PREFIX/);
assert.match(helpersMore, /normalizeCallerE164/);
assert.match(helpersMore, /resolvePhoneCallUserBinding/);
assert.match(helpersMore, /registerCallerPhoneForUser/);

const twiml = read('api/phone/_route-twiml.ts');
assert.match(twiml, /resolvePhoneCallUserBinding/);
assert.match(twiml, /callerFrom/);

const manage = read('api/phone/_route-manage.ts');
assert.match(manage, /caller-index/);
assert.match(manage, /registerCallerPhoneForUser/);

console.log('nexus-phone-tools-contract: ok');
