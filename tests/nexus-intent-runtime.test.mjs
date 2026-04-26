/**
 * Runtime test: actually execute phoneUserSoundsLikeTaskPersistIntent against adversarial phrases.
 *
 * Run: npx tsx tests/nexus-intent-runtime.test.mjs
 *      (or node --loader tsx tests/nexus-intent-runtime.test.mjs)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Inline the function from nexus-tool-loop.ts so we can test it without full import chain
const CREATE_TASK_INTENT_RE =
  /\b(create|add|put|make|set\s+up|remind|schedule|save|capture|log|track|write\s+down|jot\s+down|note\s+down|record).{0,48}(task|todo|reminder|action\s+item|item|to-do|to\s+do)\b/i;

function phoneUserSoundsLikeTaskPersistIntent(lastUser) {
  const u = lastUser.trim();
  if (!u) return false;
  if (CREATE_TASK_INTENT_RE.test(u)) return true;
  if (/\bremind\s+me\s+to\b/i.test(u)) return true;
  if (/\b(wake|get)\s+up\s+at\b/i.test(u)) return true;
  if (/\badd\s+(?:a\s+)?(?:task|reminder|todo|to-do)\b/i.test(u)) return true;
  if (/\b(create|add)\s+(?:a\s+)?(?:task|reminder|todo|to-do)\b/i.test(u)) return true;
  if (/\bput\b.{0,30}\b(on\s+my\s+(list|tasks|to-?do)|in\s+my\s+(tasks|list|to-?do))\b/i.test(u)) return true;
  if (/\bdon'?t\s+let\s+me\s+forget\b/i.test(u)) return true;
  if (/\bnote\s+(to\s+self|down)\b/i.test(u)) return true;
  if (/\b(write|jot)\s+down\b/i.test(u)) return true;
  if (/\btrack\s+(?:my\s+)?\w/i.test(u)) return true;
  if (/\bi\s+need\s+to\b.{2,60}$/i.test(u)) return true;
  if (/\bmake\s+sure\s+i\b/i.test(u)) return true;
  if (/\bcan\s+you\s+(save|add|create|remember|track)\b/i.test(u)) return true;
  if (/\b(save|remember)\s+(this|that)\b/i.test(u)) return true;
  return false;
}

describe('Intent detection — runtime execution', () => {
  const mustMatch = [
    'create a task to buy groceries',
    'add a task for the meeting',
    'remind me to call mom',
    'save this as a task',
    'put that on my list',
    'put it on my to-do list',
    'put pick up laundry on my to-do',
    "don't let me forget to submit the report",
    'dont let me forget about the meeting',
    'note to self call the dentist',
    'I need to finish the presentation',
    'I need to send the invoice by Friday',
    'make sure I review the PR',
    'make sure I call the bank tomorrow',
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
    'Create a task to work out at 6am',
    'ADD TASK: call the plumber',
    'Remind Me To pick up kids from school',
    'Can you save that as a to-do?',
    'note down this idea for the project',
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
    'complete the task',
    'how many tasks are there',
    'list all my reminders',
    'when is my next reminder',
    'good morning',
    'thanks nexus',
    'what can you do',
    'tell me about syncscript',
  ];

  for (const phrase of mustMatch) {
    it(`MATCH: "${phrase}"`, () => {
      assert.ok(
        phoneUserSoundsLikeTaskPersistIntent(phrase),
        `Expected TRUE for: "${phrase}"`,
      );
    });
  }

  for (const phrase of mustNotMatch) {
    it(`NO MATCH: "${phrase}"`, () => {
      assert.ok(
        !phoneUserSoundsLikeTaskPersistIntent(phrase),
        `Expected FALSE for: "${phrase}"`,
      );
    });
  }
});
