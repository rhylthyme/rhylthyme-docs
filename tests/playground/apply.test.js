'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applySuggestion } = require('../../playground/src/apply');

test('replaces a value at a path of keys and indexes', () => {
  const p = { tracks: [{ steps: [{ duration: { seconds: 60 } }] }] };
  const out = applySuggestion(p, { path: ['tracks', 0, 'steps', 0, 'duration', 'seconds'], value: 600 });
  assert.equal(out.tracks[0].steps[0].duration.seconds, 600);
  assert.equal(p.tracks[0].steps[0].duration.seconds, 60); // input untouched
});

test('an index one past the end appends', () => {
  const out = applySuggestion({ a: [1] }, { path: ['a', 1], value: 2 });
  assert.deepEqual(out.a, [1, 2]);
});

test('bad paths throw', () => {
  for (const path of [['nope', 0], ['a', 3], ['a', 'x'], [0]]) {
    assert.throws(() => applySuggestion({ a: [1] }, { path, value: 1 }), /^Error: bad path: /);
  }
});
