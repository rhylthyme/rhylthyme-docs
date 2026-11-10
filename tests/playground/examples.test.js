'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { validateProgram, analyzeSchedule } = require('@rhylthyme/timeline/schedule');
const { applySuggestion } = require('../../playground/src/apply');
const { EXAMPLE_IDS, examplesDir, loadExample, shown } = require('./lib/examples');

for (const id of EXAMPLE_IDS) {
  test(`${id}: shape`, () => {
    const ex = loadExample(id);
    assert.equal(typeof ex.title, 'string');
    assert.ok(ex.title.length > 0 && ex.title.length <= 40);
    assert.ok(ex.try.length >= 1 && ex.try.length <= 3);
    assert.ok(ex.try.some((s) => s.path), 'at least one suggestion a test can apply');
    for (const s of ex.try) {
      assert.ok(s.say && s.say.length <= 120);
      assert.equal('path' in s, 'value' in s, 'path and value come together');
    }
    assert.equal(ex.program.schemaVersion, '0.3.0-alpha');
    assert.ok(JSON.stringify(ex.program, null, 2).split('\n').length <= 70);
  });

  test(`${id}: valid, no warnings`, () => {
    const ex = loadExample(id);
    const v = validateProgram(ex.program);
    assert.deepEqual(v.errors, []);
    assert.deepEqual(v.warnings, []);
    assert.ok(v.stats.steps < 10 && v.stats.tracks >= 1 && v.stats.tracks <= 4);
    assert.deepEqual(analyzeSchedule(ex.program).resourceConflicts, []);
  });

  test(`${id}: every suggested change is valid and visible`, () => {
    const ex = loadExample(id);
    const before = shown(ex.program);
    for (const s of ex.try.filter((s) => s.path)) {
      const changed = applySuggestion(ex.program, s);
      assert.deepEqual(validateProgram(changed).errors, [], s.say);
      // A warning the learner cannot relate to the change they made; resource
      // conflicts (the analyzer's) stay allowed.
      assert.deepEqual(validateProgram(changed).warnings, [], s.say);
      assert.notDeepEqual(shown(changed), before, `"${s.say}" changes nothing the panel shows`);
    }
  });
}

test('the examples directory holds exactly the listed ids', () => {
  assert.deepEqual(fs.readdirSync(examplesDir).sort(), EXAMPLE_IDS.map((i) => i + '.json').sort());
});
