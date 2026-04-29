import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalModelId,
  finalizeChatCompletionRequestBody,
  modelOmitsSamplingParams,
  modelRejectsToolResultIsErrorField,
  modelUsesMaxCompletionTokens,
  sanitizeChatMessagesForModel,
} from '../api/_lib/openai-compat-model-policy';

test('canonicalModelId strips OpenRouter vendor prefix', () => {
  assert.equal(canonicalModelId('moonshotai/kimi-k2-turbo-preview'), 'kimi-k2-turbo-preview');
  assert.equal(canonicalModelId('kimi-k2-turbo-preview'), 'kimi-k2-turbo-preview');
});

test('Kimi models reject tool is_error field', () => {
  assert.equal(modelRejectsToolResultIsErrorField('moonshotai/kimi-k2'), true);
  assert.equal(modelRejectsToolResultIsErrorField('gpt-4o'), false);
});

test('sanitizeChatMessagesForModel strips is_error for Kimi only', () => {
  const msgs = [
    { role: 'user', content: 'hi' },
    { role: 'tool', tool_call_id: '1', content: 'x', is_error: true },
  ] as Record<string, unknown>[];
  const k = sanitizeChatMessagesForModel('kimi-k2-turbo-preview', msgs);
  assert.equal('is_error' in (k[1] as object), false);
  const g = sanitizeChatMessagesForModel('gpt-4o', msgs);
  assert.equal((g[1] as { is_error?: boolean }).is_error, true);
});

test('GPT-5 and o-series use max_completion_tokens', () => {
  const b = finalizeChatCompletionRequestBody('gpt-5-chat-latest', {
    model: 'gpt-5-chat-latest',
    messages: [],
    max_tokens: 500,
    temperature: 0.2,
  });
  assert.equal(b.max_completion_tokens, 500);
  assert.equal('max_tokens' in b, false);
});

test('o4-mini omits sampling params', () => {
  const b = finalizeChatCompletionRequestBody('o4-mini', {
    model: 'o4-mini',
    messages: [],
    max_tokens: 256,
    temperature: 0.7,
    top_p: 0.9,
  });
  assert.equal(modelOmitsSamplingParams('o4-mini'), true);
  assert.equal('temperature' in b, false);
  assert.equal('top_p' in b, false);
  assert.ok(b.max_completion_tokens === 256 || b.max_tokens === 256);
});

test('gpt-4o keeps max_tokens and temperature', () => {
  const b = finalizeChatCompletionRequestBody('gpt-4o', {
    model: 'gpt-4o',
    messages: [],
    max_tokens: 128,
    temperature: 0.3,
  });
  assert.equal(modelUsesMaxCompletionTokens('gpt-4o'), false);
  assert.equal(b.max_tokens, 128);
  assert.equal(b.temperature, 0.3);
});
