'use strict';
// docs/development/player-events.md, run in Chromium against the pinned
// @rhylthyme/timeline (jsDelivr, or the tarball).
//
// Both snippets are fragments: the page around them is the test's. The ELN
// example calls the ELN's own functions (markInProgress, markFinished,
// markCancelled, saveAttachment); the test defines them as recorders and
// checks that the example's branches send each step to the right one in a
// completed run, a stopped run and a dropped run, as the page promises.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { snippet, pinnedVersion } = require('./lib/docs');
const { launch, openPage, playToEnd } = require('./lib/browser');
const { cdnBase } = require('./lib/env');

// A test program: two tracks; `steep` waits for Done, so a run can be
// stopped or dropped while it is active.
const PROGRAM = {
  schemaVersion: '0.1.0', programId: 'tea', name: 'Tea',
  tracks: [
    { trackId: 'tea', name: 'Tea', steps: [
      { stepId: 'boil', name: 'Boil', startTrigger: { type: 'programStart' }, duration: { type: 'fixed', seconds: 60 } },
      { stepId: 'steep', name: 'Steep', startTrigger: { type: 'afterStep', stepId: 'boil' }, duration: { type: 'indefinite', defaultSeconds: 120 } },
    ] },
    { trackId: 'toast', name: 'Toast', steps: [
      { stepId: 'toast', name: 'Toast', startTrigger: { type: 'programStart' }, duration: { type: 'fixed', seconds: 30 } },
    ] },
  ],
};
const STEPS = ['boil', 'steep', 'toast'];

function page(...scripts) {
  const base = cdnBase(pinnedVersion());
  return [
    '<!doctype html>',
    '<meta charset="utf-8">',
    `<script src="${base}src/index.js"></script>`,
    `<script src="${base}src/element.js"></script>`,
    '<rhylthyme-timeline mode="player" speed="1000"></rhylthyme-timeline>',
    ...scripts.map((s) => `<script>\n${s}\n</script>`),
  ].join('\n');
}

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser?.close();
});

test('events-listen: logs a begin and an end for every step, with time and by', { timeout: 60000 }, async () => {
  const { page: p, errors, logs, cdn } = await openPage(browser, page(snippet('events-listen').code), { name: 'events' });
  try {
    assert.deepEqual(cdn.failures, []);
    await p.evaluate((program) => { document.querySelector('rhylthyme-timeline').program = program; }, PROGRAM);
    assert.equal(await playToEnd(p), 'completed');
    const began = logs.map((l) => /^(\S+) began at (\d+(?:\.\d+)?) by (plan|person)$/.exec(l)).filter(Boolean);
    const ended = logs.map((l) => /^(\S+) ended at (\d+(?:\.\d+)?) by (timer|person|trigger)$/.exec(l)).filter(Boolean);
    assert.deepEqual(began.map((m) => m[1]).sort(), STEPS);
    assert.deepEqual(ended.map((m) => m[1]).sort(), STEPS);
    const at = (ms, id) => Number(ms.find((m) => m[1] === id)[2]);
    assert.equal(at(began, 'steep'), at(ended, 'boil'), 'steep begins when boil ends, in program seconds');
    assert.equal(ended.find((m) => m[1] === 'steep')[3], 'person');
    assert.deepEqual(errors, []);
  } finally {
    await p.close();
  }
});

test('eln-example: finished, cancelled and dropped steps reach the right ELN calls', { timeout: 60000 }, async () => {
  const stubs = `
window.calls = [];
function markInProgress(id, time) { calls.push(['inProgress', id, time]); }
function markFinished(id, time) { calls.push(['finished', id, time]); }
function markCancelled(id, time) { calls.push(['cancelled', id, time]); }
function saveAttachment(name, data) { calls.push(['attach', name, data && typeof data === 'object' && Array.isArray(data.steps)]); }
const el = document.querySelector('rhylthyme-timeline');`;
  const { page: p, errors, cdn } = await openPage(browser, page(stubs, snippet('eln-example').code), { name: 'eln' });
  try {
    assert.deepEqual(cdn.failures, []);
    // a fresh program, and the ELN's own ids for its steps (the snippet's `eln` map)
    const load = () => p.evaluate((program) => {
      calls.length = 0;
      el.program = structuredClone(program);
      for (const id of Object.keys(el.timings)) eln.set(id, 'ELN-' + id);
    }, PROGRAM);
    const untilSteepActive = () => p.evaluate(async () => {
      el.start();
      for (let i = 0; i < 200 && el.stepStates.steep !== 'active'; i++) await new Promise((r) => setTimeout(r, 25));
      return el.stepStates.steep;
    });
    const calls = () => p.evaluate(() => calls.slice());
    const of = (cs, kind) => cs.filter((c) => c[0] === kind).map((c) => c[1]).sort();

    // 1. a completed run: every step in progress, then finished; one attachment
    await load();
    assert.equal(await playToEnd(p), 'completed');
    await p.waitForFunction(() => calls.some((c) => c[0] === 'attach'));
    let cs = await calls();
    assert.deepEqual(of(cs, 'inProgress'), STEPS.map((s) => 'ELN-' + s).sort());
    assert.deepEqual(of(cs, 'finished'), STEPS.map((s) => 'ELN-' + s).sort());
    assert.deepEqual(of(cs, 'cancelled'), []);
    assert.deepEqual(cs.filter((c) => c[0] === 'attach'), [['attach', 'run.json', true]]);

    // 2. stop() while steep runs: steep is cancelled, not finished
    await load();
    assert.equal(await untilSteepActive(), 'active');
    await p.evaluate(() => el.stop());
    cs = await calls();
    assert.deepEqual(of(cs, 'cancelled'), ['ELN-steep']);
    assert.deepEqual(of(cs, 'finished'), ['ELN-boil', 'ELN-toast']);
    assert.deepEqual(cs.filter((c) => c[0] === 'attach'), [['attach', 'run.json', true]]);

    // 3. the program is replaced while steep runs: the run is dropped and
    //    the example leaves steep alone (neither finished nor cancelled)
    await load();
    assert.equal(await untilSteepActive(), 'active');
    await p.evaluate((program) => { calls.length = 0; el.program = structuredClone(program); }, PROGRAM);
    await p.waitForFunction(() => calls.some((c) => c[0] === 'attach'));
    cs = await calls();
    assert.deepEqual(of(cs, 'finished'), []);
    assert.deepEqual(of(cs, 'cancelled'), []);
    assert.deepEqual(cs.filter((c) => c[0] === 'attach'), [['attach', 'run.json', true]]);

    assert.deepEqual(errors, []);
  } finally {
    await p.close();
  }
});
