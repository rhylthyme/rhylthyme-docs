'use strict';
// docs/demo/potion-night/index.html: the toy app, played end to end in
// Chromium against the pinned @rhylthyme/timeline (or the tarball).

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { launch, openPage, playToEnd } = require('./snippets/lib/browser');
const { pinnedVersion } = require('./snippets/lib/docs');

const PAGE = path.join(__dirname, '..', 'docs', 'demo', 'potion-night', 'index.html');
const html = fs.readFileSync(PAGE, 'utf8');

let browser;
before(async () => { browser = await launch(); });
after(async () => { if (browser) await browser.close(); });

test('the demo loads the version the docs pin', () => {
  const versions = [...html.matchAll(/@rhylthyme\/timeline@([^/"']+)\//g)].map((m) => m[1]);
  assert.ok(versions.length >= 3, 'three script tags');
  for (const v of versions) assert.equal(v, pinnedVersion());
});

test('the demo program is valid and plans back from midnight', async () => {
  const { page, errors } = await openPage(browser, html, { name: 'potion-night' });
  try {
    const verdict = await page.textContent('#verdict');
    assert.match(verdict, /checks out/);
    const rows = await page.$$eval('#plan li', (li) => li.map((x) => [x.dataset.step, x.querySelector('time').textContent]));
    const program = await page.evaluate(() => JSON.parse(document.getElementById('potion-night').textContent));
    const stepCount = program.tracks.reduce((n, t) => n + t.steps.length, 0);
    assert.equal(rows.length, stepCount, 'one schedule row per step');
    // The last row ends at midnight: the plan is anchored with finishAt.
    const lastEnd = await page.evaluate(() => {
      const rows = window.Rhylthyme.itinerary(JSON.parse(document.getElementById('potion-night').textContent), {
        finishAt: (() => { const d = new Date(); d.setHours(24, 0, 0, 0); return d; })(),
      });
      return new Date(Math.max(...rows.map((r) => Date.parse(r.endAt)))).getHours();
    });
    assert.equal(lastEnd, 0);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('playing the night lights every station, logs every step once, and completes', { timeout: 90000 }, async () => {
  const { page, errors } = await openPage(browser, html, { name: 'potion-night' });
  try {
    // Record which stations were ever busy while the night plays.
    await page.evaluate(() => {
      window.__busy = new Set();
      window.__both = false;
      new MutationObserver(() => {
        for (const s of document.querySelectorAll('.station.busy')) window.__busy.add(s.dataset.task);
        const doing = (k) => document.querySelector(`.station[data-task="${k}"] .doing`).textContent;
        if (doing('person') !== 'nothing, yet' && doing('person').split(' · ').some((n) => doing('apprentice').includes(n))) window.__both = true;
      }).observe(document.getElementById('tower'), { subtree: true, attributes: true, attributeFilter: ['class'] });
      document.getElementById('player').setAttribute('speed', '600');
    });
    const status = await playToEnd(page, '#player', 60000);
    assert.equal(status, 'completed');
    await page.waitForFunction(() => document.querySelector('#log').textContent.includes('All brewed'));
    const result = await page.evaluate(() => {
      const program = JSON.parse(document.getElementById('potion-night').textContent);
      const steps = program.tracks.reduce((n, t) => n + t.steps.length, 0);
      const log = [...document.querySelectorAll('#log li')].map((li) => li.textContent);
      return {
        steps,
        began: log.filter((t) => t.includes('▶')).length,
        ended: log.filter((t) => t.includes('✓')).length,
        personStarted: log.filter((t) => t.includes('you started it')).length,
        personEnded: log.filter((t) => t.includes('you said so')).length,
        busy: [...window.__busy].sort(),
        statusWord: document.getElementById('status').textContent,
        both: window.__both,
        running: document.getElementById('n-running').textContent,
        done: document.getElementById('n-done').textContent,
        planDone: document.querySelectorAll('#plan li.done').length,
      };
    });
    assert.equal(result.began, result.steps, 'one began per step');
    assert.equal(result.ended, result.steps, 'one ended per step');
    assert.ok(result.personStarted >= 1, 'the gate was started by a person');
    assert.ok(result.personEnded >= 1, 'a step was finished by a person');
    assert.deepEqual(result.busy, ['apprentice', 'cauldron', 'dragon', 'person']);
    assert.ok(result.both, 'a step that needs a person and holds a resource lights both stations');
    assert.equal(result.running, '0');
    assert.equal(result.done, String(result.steps));
    assert.equal(result.planDone, result.steps);
    assert.equal(result.statusWord, 'all brewed', 'the counter uses the player\'s label');
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('the cursed recipe is explained with findingCodes and not played', async () => {
  const { page, errors } = await openPage(browser, html, { name: 'potion-night' });
  try {
    await page.evaluate(() => { const p = document.getElementById('player'); p.setAttribute('speed', '600'); p.start(); });
    await page.waitForFunction(() => document.querySelectorAll('#log li').length > 0);
    await page.click('[data-recipe="cursed"]');
    const verdict = await page.$$eval('#verdict li', (li) => li.map((x) => ({
      code: x.querySelector('.code').textContent,
      why: [...x.querySelectorAll('.why')].map((w) => w.textContent),
    })));
    const codes = verdict.map((v) => v.code).sort();
    for (const c of ['dangling_step_ref', 'schema_oneOf', 'task_not_constrained']) assert.ok(codes.includes(c), codes.join());
    const catalogue = await page.evaluate(() => window.RhylthymeSchedule.findingCodes.codes);
    for (const v of verdict) {
      assert.ok(catalogue[v.code], `${v.code} is catalogued`);
      assert.ok(v.why.includes(catalogue[v.code].explanation), `${v.code} shows the catalogue's explanation`);
    }
    assert.equal(await page.$eval('[data-recipe="cursed"]', (b) => b.getAttribute('aria-pressed')), 'true');
    assert.match(await page.textContent('#plan'), /fix the recipe first/);
    assert.equal(await page.$eval('#player', (p) => p.status), 'stopped', 'the running night was doused');
    assert.equal(await page.textContent('#n-running'), '0');
    // Back to the good recipe: a fresh night.
    await page.click('[data-recipe="potion-night"]');
    assert.match(await page.textContent('#verdict'), /checks out/);
    assert.equal(await page.$$eval('#log li', (li) => li.length), 0);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test('switching recipes mid-run starts a clean log after the dropped ends', async () => {
  const { page, errors } = await openPage(browser, html, { name: 'potion-night' });
  try {
    await page.evaluate(() => { const p = document.getElementById('player'); p.setAttribute('speed', '600'); p.start(); });
    await page.waitForFunction(() => document.getElementById('n-running').textContent !== '0');
    await page.click('[data-recipe="potion-night"]');
    const after = await page.evaluate(() => ({
      log: document.querySelectorAll('#log li').length,
      running: document.getElementById('n-running').textContent,
      status: document.getElementById('player').status,
    }));
    assert.deepEqual(after, { log: 0, running: '0', status: 'stopped' });
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});
