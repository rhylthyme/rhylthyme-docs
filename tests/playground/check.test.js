'use strict';
// What the panel's status bar says: the JSON error line, and the check of a
// parsed program against the validator and the analyzer.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const schedule = require('@rhylthyme/timeline/schedule');
const { firstJsonErrorLine } = require('../../playground/src/json-line');
const { checkProgram, formatClock } = require('../../playground/src/check');
const { applySuggestion } = require('../../playground/src/apply');
const { loadExample } = require('./lib/examples');

test('firstJsonErrorLine', () => {
  assert.equal(firstJsonErrorLine('{\n  "a": 1\n}'), null);
  assert.equal(firstJsonErrorLine('{\n  "a": 1,\n  "b": }\n'), 3);
  assert.equal(firstJsonErrorLine(''), 1);
  assert.equal(firstJsonErrorLine('   \n'), 1);
});

test('formatClock', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(125), '2:05');
  assert.equal(formatClock(3725), '62:05');
});

test('a valid example: ok line with steps and makespan', () => {
  const ex = loadExample('duration-fixed');
  const r = checkProgram(ex.program, schedule);
  assert.equal(r.state, 'valid');
  assert.match(r.lines[0].text, /^✓ Valid · \d+ steps? · takes .+/);
  assert.equal(r.lines.length, 1);
});

test('a rule violation: the validator message and fix', () => {
  const p = structuredClone(loadExample('trigger-after-step').program);
  p.tracks[0].steps.shift(); // something now points at a missing step
  const r = checkProgram(p, schedule);
  assert.equal(r.state, 'invalid');
  assert.equal(r.lines[0].kind, 'error');
  assert.ok(r.lines[0].text);
  assert.ok(r.lines[0].fix);
});

test('more than three errors are summarised', () => {
  const r = checkProgram({ tracks: 'no', steps: 1, a: [], schemaVersion: 9 }, schedule);
  assert.ok(r.lines.length <= 4);
});

test('not an object: the validator says so', () => {
  assert.match(checkProgram([], schedule).lines[0].text, /JSON object/);
});

test('resource over-use is a warning on a valid program', () => {
  const ex = loadExample('resource-constraints');
  const changed = applySuggestion(ex.program, ex.try.find((s) => s.path));
  const r = checkProgram(changed, schedule);
  assert.equal(r.state, 'valid');
  const warn = r.lines.find((l) => l.kind === 'warn');
  assert.match(warn.text, /^⚠ .+: \d+ at once, limit \d+ \(\d+:\d\d–\d+:\d\d\)$/);
  assert.ok(warn.fix);
});
