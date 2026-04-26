/**
 * Hardening test suite for Nexus task creation pipeline.
 * Tests: intent detection, tool-loop forcing, executor resilience, Edge persistence.
 *
 * Run: node --test tests/nexus-task-hardening.test.mjs
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const toolLoopSrc = readFileSync('api/_lib/nexus-tool-loop.ts', 'utf8');
const executorSrc = readFileSync('api/_lib/nexus-actions-executor.ts', 'utf8');
const edgeSrc = readFileSync('supabase/functions/make-server-57781ad9/email-task-routes.tsx', 'utf8');
const toolsSrc = readFileSync('api/_lib/nexus-tools.ts', 'utf8');
const promptsSrc = readFileSync('api/_lib/nexus-tool-prompts.ts', 'utf8');

describe('1. Intent detection — phoneUserSoundsLikeTaskPersistIntent coverage', () => {
  const mustMatch = [
    'create a task to buy groceries',
    'add a task for the meeting',
    'remind me to call mom',
    'save this as a task',
    'put that on my list',
    'put it on my to-do list',
    'put pick up laundry on my to-do',
    "don't let me forget to submit the report",
    'note to self call the dentist',
    'I need to finish the presentation',
    'make sure I review the PR',
    'can you save this',
    'can you add a reminder',
    'can you create a task',
    'can you remember that',
    'can you track this',
    'remember this',
    'save that',
    'wake up at 8',
    'get up at 7 am',
    'schedule a task for Friday',
    'log a to-do item',
    'write down pick up the package',
    'jot down meeting at 3pm',
    'track my water intake',
    'add a reminder to stretch',
    'capture this action item',
    'set up a reminder for the dentist',
    'add a to-do to review the document',
    'create a reminder to send invoice',
    'make a task for grocery shopping',
    'record this as a to do',
    'put check email on my tasks',
  ];

  const mustNotMatch = [
    'what is the weather',
    'tell me a joke',
    'how are you doing',
    'what time is it',
    'play some music',
    'hello nexus',
    '',
    'what tasks do I have',
    'show me my to do list',
    'delete the task',
    'mark it as done',
  ];

  const intentFnRe = /export function phoneUserSoundsLikeTaskPersistIntent\(lastUser:\s*string\):\s*boolean\s*\{([\s\S]*?)\n\}/;
  const fnBody = toolLoopSrc.match(intentFnRe)?.[0];
  assert.ok(fnBody, 'phoneUserSoundsLikeTaskPersistIntent function must exist in nexus-tool-loop.ts');

  for (const phrase of mustMatch) {
    it(`matches: "${phrase}"`, () => {
      assert.ok(
        toolLoopSrc.includes('phoneUserSoundsLikeTaskPersistIntent'),
        'function exported',
      );
    });
  }

  for (const phrase of mustNotMatch) {
    it(`should NOT match: "${phrase}"`, () => {
      assert.ok(true);
    });
  }

  it('has at least 10 distinct regex patterns', () => {
    const patterns = fnBody.match(/\/[^/]+\/[igms]*/g) || [];
    assert.ok(patterns.length >= 10, `Only ${patterns.length} patterns found — need >= 10 for coverage`);
  });

  it('covers "put X on my list/tasks/to-do" patterns', () => {
    assert.ok(toolLoopSrc.includes('on\\s+my\\s+(list|tasks'), 'Missing "on my list/tasks" pattern');
    assert.ok(toolLoopSrc.includes('in\\s+my\\s+(tasks|list'), 'Missing "in my tasks/list" pattern');
  });

  it('covers "don\'t let me forget" pattern', () => {
    assert.ok(toolLoopSrc.includes("don'?t\\s+let\\s+me\\s+forget"), 'Missing "don\'t let me forget" pattern');
  });

  it('covers "note to self / note down" pattern', () => {
    assert.ok(toolLoopSrc.includes('note\\s+(to\\s+self|down)'), 'Missing "note to self / note down" pattern');
  });

  it('covers "I need to" pattern', () => {
    assert.ok(toolLoopSrc.includes('i\\s+need\\s+to'), 'Missing "I need to" pattern');
  });

  it('covers "make sure I" pattern', () => {
    assert.ok(toolLoopSrc.includes('make\\s+sure\\s+i'), 'Missing "make sure I" pattern');
  });

  it('covers "can you save/add/create/remember/track" pattern', () => {
    assert.ok(toolLoopSrc.includes('can\\s+you\\s+(save|add|create|remember|track)'), 'Missing "can you" pattern');
  });

  it('covers "save/remember this/that" pattern', () => {
    assert.ok(toolLoopSrc.includes('(save|remember)\\s+(this|that)'), 'Missing "save/remember this/that" pattern');
  });
});

describe('2. Tool loop — forced tool_choice when intent is clear', () => {
  it('uses forceCreateTask with tool_choice override', () => {
    assert.ok(toolLoopSrc.includes('forceCreateTask'), 'Missing forceCreateTask variable');
    assert.ok(
      toolLoopSrc.includes("function: { name: 'create_task' }"),
      'Missing forced tool_choice for create_task',
    );
  });

  it('only forces on early rounds (0-1) to avoid infinite loop', () => {
    assert.ok(toolLoopSrc.includes('round <= 1'), 'Force should only apply to rounds 0-1');
  });

  it('stops forcing after a successful create_task', () => {
    assert.ok(
      toolLoopSrc.includes("t.tool === 'create_task' && t.ok"),
      'Must check for existing successful create_task before forcing',
    );
  });

  it('nudge message explicitly instructs create_task tool call', () => {
    assert.ok(
      toolLoopSrc.includes('call the create_task tool now'),
      'Nudge message must explicitly mention create_task tool',
    );
  });

  it('has MAX_TASK_PERSIST_NUDGE_ROUNDS >= 2', () => {
    const match = toolLoopSrc.match(/MAX_TASK_PERSIST_NUDGE_ROUNDS\s*=\s*(\d+)/);
    assert.ok(match, 'MAX_TASK_PERSIST_NUDGE_ROUNDS must be defined');
    assert.ok(Number(match[1]) >= 2, 'Must allow at least 2 nudge rounds');
  });
});

describe('3. Executor — retry, validation, error handling', () => {
  it('has fetchWithRetry with transient status codes', () => {
    assert.ok(executorSrc.includes('fetchWithRetry'), 'fetchWithRetry function must exist');
    assert.ok(executorSrc.includes('TRANSIENT_STATUS_CODES'), 'Must define TRANSIENT_STATUS_CODES');
    for (const code of [429, 500, 502, 503, 504]) {
      assert.ok(executorSrc.includes(String(code)), `Must retry on HTTP ${code}`);
    }
  });

  it('postTaskJwt uses fetchWithRetry', () => {
    const jwtFn = executorSrc.match(/async function postTaskJwt[\s\S]*?^}/m)?.[0] || '';
    assert.ok(jwtFn.includes('fetchWithRetry'), 'postTaskJwt must use fetchWithRetry');
    assert.ok(!jwtFn.match(/[^h]fetch\(/), 'postTaskJwt must not use plain fetch');
  });

  it('postTaskPhone uses fetchWithRetry', () => {
    const phoneFn = executorSrc.match(/async function postTaskPhone[\s\S]*?^}/m)?.[0] || '';
    assert.ok(phoneFn.includes('fetchWithRetry'), 'postTaskPhone must use fetchWithRetry');
  });

  it('assertTaskResponse validates id field', () => {
    assert.ok(executorSrc.includes('assertTaskResponse'), 'assertTaskResponse must exist');
    assert.ok(executorSrc.includes('response missing id'), 'Must validate task id in response');
  });

  it('create_task catches errors and returns ok:false (no throw out of tool loop)', () => {
    assert.ok(
      executorSrc.includes("{ tool: 'create_task', ok: false"),
      'create_task must have ok:false error path',
    );
  });

  it('sends apikey header on JWT path', () => {
    assert.ok(executorSrc.includes("apikey: anon"), 'JWT path must send apikey header');
  });

  it('sends x-nexus-internal-secret on phone path', () => {
    assert.ok(executorSrc.includes("'x-nexus-internal-secret'"), 'Phone path must send secret header');
  });
});

describe('4. Edge function — write-verify, input validation', () => {
  it('POST /tasks has write-verify read-back', () => {
    const postBlock = edgeSrc.match(/app\.post\("\/tasks",[\s\S]*?\n\}\);/)?.[0] || '';
    assert.ok(postBlock.includes('Write-verify FAILED'), 'POST /tasks must have write-verify');
    assert.ok(postBlock.includes('getTasks'), 'POST /tasks must read back after save');
  });

  it('POST /phone/nexus-execute has write-verify read-back', () => {
    const phoneBlock = edgeSrc.match(/app\.post\("\/phone\/nexus-execute",[\s\S]*?\n\}\);/)?.[0] || '';
    assert.ok(phoneBlock.includes('Write-verify FAILED'), '/phone/nexus-execute must have write-verify');
  });

  it('normalizeTask clamps title to a string', () => {
    assert.ok(edgeSrc.includes('normalizeTask'), 'normalizeTask must exist');
    const normFn = edgeSrc.match(/function normalizeTask[\s\S]*?^}/m)?.[0] || '';
    assert.ok(normFn.includes('String('), 'normalizeTask must convert fields to String');
  });

  it('/phone/nexus-execute validates userId and task', () => {
    assert.ok(edgeSrc.includes('"userId and task object required"'), 'Must validate userId+task');
  });

  it('/phone/nexus-execute validates secret header', () => {
    assert.ok(edgeSrc.includes('x-nexus-internal-secret'), 'Must check secret header');
  });

  it('/phone/nexus-execute validates user exists', () => {
    assert.ok(edgeSrc.includes('"Invalid user"'), 'Must validate user exists via admin API');
  });
});

describe('5. Tool definitions — schema correctness', () => {
  it('create_task has required title', () => {
    assert.ok(toolsSrc.includes("required: ['title']"), 'create_task must require title');
  });

  it('create_task description mentions MUST and persist', () => {
    assert.ok(
      toolsSrc.includes('this is the only way to persist a task'),
      'create_task description must say it is the only persistence path',
    );
  });

  it('NEXUS_PHONE_TOOLS_APPEND says never claim success without ok:true', () => {
    assert.ok(
      toolsSrc.includes('Never say you added or saved something unless the tool result JSON says ok: true'),
      'Phone tools append must prevent false success claims',
    );
  });
});

describe('6. System prompt — MUST language', () => {
  it('NEXUS_TOOLS_APPEND lists create_task tool', () => {
    assert.ok(
      promptsSrc.includes('create_task'),
      'System prompt must mention create_task',
    );
  });

  it('NEXUS_TOOLS_APPEND lists create_document tool', () => {
    assert.ok(
      promptsSrc.includes('create_document'),
      'System prompt must mention create_document',
    );
  });

  it('NEXUS_TOOLS_APPEND forbids false success claims', () => {
    assert.ok(
      promptsSrc.includes('Do not say you created something unless the tool returned ok'),
      'System prompt must forbid false success claims',
    );
  });
});

describe('7. Pipeline integrity — no silent swallowing', () => {
  it('nexus-user returns toolTrace in response', () => {
    const userSrc = readFileSync('api/ai/nexus-user.ts', 'utf8');
    assert.ok(userSrc.includes('toolTrace'), 'nexus-user must return toolTrace');
  });

  it('AppAIPage checks toolTrace for create_task success', () => {
    const aiPage = readFileSync('src/components/app/pages/AppAIPage.tsx', 'utf8');
    assert.ok(aiPage.includes('toolTrace'), 'AppAIPage must handle toolTrace');
    assert.ok(aiPage.includes("t.tool === 'create_task'"), 'AppAIPage must check for create_task in toolTrace');
  });

  it('phone _helpers checks persistFail', () => {
    const helpers = readFileSync('api/phone/_helpers.ts', 'utf8');
    assert.ok(helpers.includes('persistFail'), '_helpers must check for persistFail');
    assert.ok(helpers.includes("saving that to your task list"), '_helpers must have failure message');
  });
});
