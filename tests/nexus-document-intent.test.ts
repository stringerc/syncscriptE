import assert from 'node:assert/strict';
import test from 'node:test';
import { userSoundsLikeDocumentEditIntent } from '../api/_lib/nexus-document-intent';

test('detects paragraph / document edit requests', () => {
  assert.equal(userSoundsLikeDocumentEditIntent('Change the second paragraph to be shorter'), true);
  assert.equal(userSoundsLikeDocumentEditIntent('Revise the memo above'), true);
  assert.equal(userSoundsLikeDocumentEditIntent('Make it one paragraph'), true);
});

test('ignores trivial strings', () => {
  assert.equal(userSoundsLikeDocumentEditIntent('hi'), false);
  assert.equal(userSoundsLikeDocumentEditIntent(''), false);
});
