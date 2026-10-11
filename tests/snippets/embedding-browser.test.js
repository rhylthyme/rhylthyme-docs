'use strict';
// docs/development/embedding.md: the HTML snippets, each opened as a saved
// .html file in Chromium, exactly as written.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { snippet } = require('./lib/docs');
const { launch, openPage, playToEnd } = require('./lib/browser');

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser?.close();
});

const noCdnFailures = (cdn) => assert.deepEqual(cdn.failures, [], 'jsDelivr requests failed');

test('player-html: loads src, plays to the end, logs every event it listens to', { timeout: 60000 }, async () => {
  const { page, errors, logs, cdn } = await openPage(browser, snippet('player-html').code, { name: 'player' });
  try {
    await page.waitForFunction(() => {
      const t = document.querySelector('rhylthyme-timeline').timings;
      return t && Object.keys(t).length > 0;
    }, null, { timeout: 20000 });
    noCdnFailures(cdn);
    assert.deepEqual(cdn.hits.sort(), ['src/element.js', 'src/index.js']);
    const stepIds = await page.evaluate(() => Object.keys(document.querySelector('rhylthyme-timeline').timings));
    assert.ok(await page.evaluate(() => !!document.querySelector('rhylthyme-timeline').shadowRoot.querySelector('svg')), 'the element drew an SVG');

    await page.evaluate(() => document.querySelector('rhylthyme-timeline').setAttribute('speed', '20000'));
    assert.equal(await playToEnd(page), 'completed');
    await new Promise((r) => setTimeout(r, 300));

    assert.ok(logs.some((l) => l.startsWith('loaded')), 'rt-load logged');
    assert.ok(logs.some((l) => l.startsWith('all done at')), 'rt-complete logged');
    const began = logs.filter((l) => l.startsWith('began ')).map((l) => l.split(' ')[1]);
    const ended = logs.filter((l) => l.startsWith('ended ')).map((l) => l.split(' ')[1]);
    // "they fire once per step per run, for every step"
    assert.deepEqual([...began].sort(), [...stepIds].sort(), 'rt-step-began once for every step');
    assert.deepEqual([...ended].sort(), [...stepIds].sort(), 'rt-step-ended once for every step');
    for (const l of logs.filter((x) => /^(began|ended) /.test(x))) {
      assert.match(l, /^(began|ended) \S+ at \d+(\.\d+)? by (plan|person|timer|trigger)$/, l);
    }
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('static-chart-html: draws the SVG into #chart', { timeout: 60000 }, async () => {
  const { page, errors, cdn } = await openPage(browser, snippet('static-chart-html').code, { name: 'chart' });
  try {
    await page.waitForSelector('#chart svg', { timeout: 20000 });
    const rects = await page.evaluate(() => document.querySelectorAll('#chart svg rect').length);
    assert.ok(rects > 10, `${rects} rects`);
    noCdnFailures(cdn);
    assert.deepEqual(cdn.hits, ['src/index.js']);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('timings-html: prints the timings its own comment promises', { timeout: 60000 }, async () => {
  const s = snippet('timings-html');
  // "// { boil:  { start: 0,   end: 180, ..." lines in the snippet
  const promised = [...s.code.matchAll(/\/\/\s*\{?\s*(\w+):\s*\{\s*start:\s*(\d+),\s*end:\s*(\d+)/g)].map((m) => [m[1], +m[2], +m[3]]);
  assert.ok(promised.length >= 2, 'the snippet comments the expected timings');
  const { page, errors, cdn } = await openPage(browser, s.code, { name: 'timings' });
  try {
    await page.waitForFunction(() => document.getElementById('out').textContent.length > 0);
    const timings = JSON.parse(await page.textContent('#out'));
    for (const [id, start, end] of promised) {
      assert.equal(timings[id]?.start, start, `${id}.start`);
      assert.equal(timings[id]?.end, end, `${id}.end`);
    }
    noCdnFailures(cdn);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('schedule-browser: prints exactly the "It prints" block (schedule-browser-output)', { timeout: 60000 }, async () => {
  const { page, errors, cdn } = await openPage(browser, snippet('schedule-browser').code, { name: 'schedule' });
  try {
    await page.waitForFunction(() => document.getElementById('out').textContent.length > 0, null, { timeout: 20000 });
    const got = (await page.textContent('#out')).trim();
    const want = snippet('schedule-browser-output').code.trim();
    assert.equal(got, want);
    noCdnFailures(cdn);
    assert.deepEqual(cdn.hits, ['browser/schedule.js']);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});
