import assert from 'node:assert/strict';

function normalizeArgs(fn) {
  let args = fn?.arguments;
  if (args == null) args = '{}';
  if (typeof args === 'object') args = JSON.stringify(args);
  if (typeof args !== 'string') args = String(args);
  return args;
}

const objArgs = { title: 'Buy milk' };
const s = normalizeArgs({ name: 'create_task', arguments: objArgs });
assert.equal(s, '{"title":"Buy milk"}');
const s2 = normalizeArgs({ name: 'create_task', arguments: '{"title":"x"}' });
assert.equal(s2, '{"title":"x"}');

const CREATE_TASK_INTENT_RE =
  /\b(create|add|put|make|set\s+up|remind|schedule|save|capture|log).{0,48}(task|todo|reminder|action\s+item|item)\b/i;
assert.ok(CREATE_TASK_INTENT_RE.test('Please create a task to call Alex'));
assert.ok(!CREATE_TASK_INTENT_RE.test('What is the weather'));

console.log('nexus-tool-call-parse: ok');
