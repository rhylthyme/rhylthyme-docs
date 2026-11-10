'use strict';
// The "Try it live" overlay (docs/javascripts/playground.bundle.js, built by
// `npm run build:playground`) on a fixture page, in Chromium.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { launch } = require('../snippets/lib/browser');
const { serve } = require('./lib/server');
const { firstJsonErrorLine } = require('../../playground/src/json-line');

const ROOT = path.join(__dirname, '..', '..');
const ID = 'duration-fixed';
const DEBOUNCE_SETTLED_MS = 600;

let browser;
let site;
before(async () => {
  browser = await launch();
  site = await serve({ roots: [path.join(ROOT, 'docs'), path.join(ROOT, 'tests', 'playground')] });
});
after(async () => {
  if (browser) await browser.close();
  if (site) await site.close();
});

// A fresh page on the fixture with the bundle loaded. Collects page errors
// and console errors; `done()` closes the page and asserts there were none
// (`allow`: console errors the test expects, such as a 404 it asked for).
async function fixture({ viewport = { width: 1440, height: 900 }, permissions } = {}) {
  const context = await browser.newContext({ viewport });
  if (permissions) await context.grantPermissions(permissions, { origin: site.url });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });
  await page.goto(site.url + '/fixture/');
  await page.addScriptTag({ url: '/javascripts/playground.bundle.js' });
  return {
    page,
    errors,
    async done({ allow } = {}) {
      await context.close();
      assert.deepEqual(errors.filter((e) => !(allow && e.startsWith('console.error: ') && allow.test(e))), []);
    },
  };
}

// Opens the overlay on `id` and waits until the player has planned it.
async function openExample(page, id = ID) {
  await page.evaluate(async (id) => {
    await window.RhylthymePlayground.open({
      id,
      exampleUrl: `/playground/examples/${id}.json`,
      pageUrl: location.href,
      returnFocus: document.querySelector('.rt-try'),
    });
  }, id);
  await page.waitForFunction(() => Object.keys(document.querySelector('.rt-pg-player').timings || {}).length > 0);
}

// The example as the page fetches it.
function fetchExample(page, id = ID) {
  return page.evaluate((id) => fetch(`/playground/examples/${id}.json`).then((r) => r.json()), id);
}

// The first step of the first track: its id and its fixed duration, read from
// the example (no step names in the tests).
async function firstStep(page) {
  const { program } = await fetchExample(page);
  const step = program.tracks[0].steps[0];
  return { id: step.stepId, seconds: step.duration.seconds, program };
}

const setText = (page, text) => page.evaluate((t) => window.RhylthymePlayground.setText(t), text);
const getText = (page) => page.evaluate(() => window.RhylthymePlayground.getText());
const statusState = (page) => page.getAttribute('.rt-pg-status', 'data-state');
const waitForState = (page, state) =>
  page.waitForFunction((s) => document.querySelector('.rt-pg-status').dataset.state === s, state);
const focusInEditor = (page) => page.evaluate(() => !!document.activeElement.closest('.rt-pg-editor'));
const focusInside = (page) => page.evaluate(() => document.getElementById('rt-playground').contains(document.activeElement));

test('opens with the example: title, pretty JSON, bars drawn', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const example = await fetchExample(page);
  assert.equal((await page.textContent('.rt-pg-title')).trim(), example.title);
  assert.equal(await getText(page), JSON.stringify(example.program, null, 2));
  const dialog = page.locator('#rt-playground');
  assert.equal(await dialog.getAttribute('role'), 'dialog');
  assert.equal(await dialog.getAttribute('aria-modal'), 'true');
  assert.ok(await dialog.isVisible());
  assert.ok(await page.locator('.rt-pg-editor .cm-editor').isVisible(), 'CodeMirror is in the editor pane');
  assert.equal(await statusState(page), 'valid');
  assert.match(await page.textContent('.rt-pg-status .rt-pg-line[data-kind="ok"]'), /^✓ Valid/);
  assert.equal(await page.locator('.rt-pg-try li').count(), example.try.length);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('rt-pg-open')), true);
  assert.equal(await page.evaluate(() => window.RhylthymePlayground.isOpen()), true);
  assert.ok(await focusInside(page), 'focus moved into the dialog');
  assert.ok(await focusInEditor(page), 'on a wide screen, into the editor');
  await done();
});

test('an edit that changes no status line leaves the status region alone', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const { program } = await fetchExample(page);
  await page.evaluate(() => {
    window.__statusMutations = 0;
    window.__loads = 0;
    new MutationObserver((records) => (window.__statusMutations += records.length)).observe(
      document.querySelector('.rt-pg-status'),
      { childList: true, subtree: true, characterData: true, attributes: true },
    );
    document.querySelector('.rt-pg-player').addEventListener('rt-load', () => window.__loads++);
  });
  // The same program, laid out differently: checked again, same lines.
  await setText(page, JSON.stringify(program));
  await page.waitForFunction(() => window.__loads > 0);
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.__statusMutations), 0, 'the aria-live region was not rewritten');
  // A change that does change a line is still shown.
  const changed = structuredClone(program);
  changed.tracks[0].steps[0].duration.seconds *= 20;
  const before = await page.textContent('.rt-pg-status');
  await setText(page, JSON.stringify(changed, null, 2));
  await page.waitForFunction((t) => document.querySelector('.rt-pg-status').textContent !== t, before);
  await done();
});

test('editing a duration moves the bar', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const step = await firstStep(page);
  const before = await page.evaluate((id) => document.querySelector('.rt-pg-player').timings[id].end, step.id);
  const changed = structuredClone(step.program);
  changed.tracks[0].steps[0].duration.seconds = step.seconds * 2;
  await setText(page, JSON.stringify(changed, null, 2));
  await page.waitForFunction(
    ({ id, before }) => document.querySelector('.rt-pg-player').timings[id].end > before,
    { id: step.id, before },
  );
  assert.equal(await statusState(page), 'valid');
  await done();
});

test('broken JSON: line number, stale player, then recovery', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const original = await getText(page);
  const timings = await page.evaluate(() => JSON.stringify(document.querySelector('.rt-pg-player').timings));
  const lines = original.split('\n');
  lines[2] = lines[2].replace(/,$/, ''); // a missing comma at the end of line 3
  const broken = lines.join('\n');
  await setText(page, broken);
  await waitForState(page, 'syntax');
  const first = (await page.textContent('.rt-pg-status .rt-pg-line')).trim();
  assert.ok(first.startsWith('Line '), first);
  assert.equal(first, `Line ${firstJsonErrorLine(broken)}: not valid JSON`);
  assert.ok(await page.evaluate(() => document.querySelector('.rt-pg-preview').classList.contains('rt-pg-stale')));
  assert.ok(await page.locator('.rt-pg-stale-note').isVisible());
  assert.equal(await page.evaluate(() => JSON.stringify(document.querySelector('.rt-pg-player').timings)), timings);
  await page.waitForSelector('.rt-pg-editor .cm-lintRange-error'); // the editor underlines it
  await setText(page, original);
  await waitForState(page, 'valid');
  assert.equal(await page.evaluate(() => document.querySelector('.rt-pg-preview').classList.contains('rt-pg-stale')), false);
  assert.equal(await page.locator('.rt-pg-stale-note').isVisible(), false);
  await done();
});

test('a rule violation shows message and fix', async () => {
  const { page, done } = await fixture();
  await openExample(page, 'trigger-after-step');
  const { program } = await fetchExample(page, 'trigger-after-step');
  program.tracks[0].steps.shift(); // another step depends on this one
  await setText(page, JSON.stringify(program, null, 2));
  await waitForState(page, 'invalid');
  const error = page.locator('.rt-pg-status .rt-pg-line[data-kind="error"]').first();
  assert.ok((await error.textContent()).trim());
  assert.ok((await error.locator('.rt-pg-fix').textContent()).trim());
  assert.ok(await page.evaluate(() => document.querySelector('.rt-pg-preview').classList.contains('rt-pg-stale')));
  await done();
});

test('only the latest edit is applied', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const step = await firstStep(page);
  const a = structuredClone(step.program);
  a.tracks[0].steps[0].duration.seconds = step.seconds * 2;
  const b = structuredClone(step.program);
  b.tracks[0].steps[0].duration.seconds = step.seconds * 3;
  await page.evaluate(() => {
    window.__loads = 0;
    document.querySelector('.rt-pg-player').addEventListener('rt-load', () => window.__loads++);
  });
  await setText(page, JSON.stringify(a, null, 2));
  await page.waitForTimeout(50);
  await setText(page, JSON.stringify(b, null, 2));
  await page.waitForTimeout(DEBOUNCE_SETTLED_MS);
  const result = await page.evaluate(() => ({
    loads: window.__loads,
    program: document.querySelector('.rt-pg-player').program,
  }));
  assert.equal(result.loads, 1, 'the player was set once');
  assert.deepEqual(result.program, b);
  await done();
});

test('reset restores the example', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  const original = await getText(page);
  await setText(page, '{ "oops": ');
  await waitForState(page, 'syntax');
  await page.click('.rt-pg-reset');
  assert.equal(await getText(page), original);
  await waitForState(page, 'valid');
  await done();
});

test('copy link writes ?try=<id>', async () => {
  const { page, done } = await fixture({ permissions: ['clipboard-read', 'clipboard-write'] });
  await openExample(page);
  await page.click('.rt-pg-copy');
  await page.waitForFunction(async () => (await navigator.clipboard.readText()).includes('?try='));
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(copied, site.url + '/fixture/?try=' + ID);
  assert.equal(await page.locator('.rt-pg-linkbox').isVisible(), false);
  // Announced through the status bar's live region, then gone again.
  const note = page.locator('.rt-pg-status[aria-live] .rt-pg-line', { hasText: 'Link copied' });
  assert.equal(await note.count(), 1);
  await note.waitFor({ state: 'detached' });
  assert.match(await page.textContent('.rt-pg-status'), /^✓ Valid/);
  await done();
});

test('copy link falls back to a text field', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error('no clipboard here'));
  });
  await page.click('.rt-pg-copy');
  const input = page.locator('.rt-pg-linkbox input');
  await input.waitFor({ state: 'visible' });
  const box = await input.evaluate((el) => ({
    value: el.value,
    focused: document.activeElement === el,
    selected: el.selectionStart === 0 && el.selectionEnd === el.value.length,
  }));
  assert.ok(box.value.endsWith('?try=' + ID), box.value);
  assert.ok(box.focused && box.selected, 'the link is selected');
  await done();
});

test('Esc closes, focus returns, scroll position kept', async () => {
  const { page, done } = await fixture();
  await page.evaluate(() => window.scrollTo(0, 300));
  await page.focus('.rt-try');
  await page.evaluate(() => window.scrollTo(0, 300));
  await openExample(page);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('rt-pg-open')), true);
  await page.keyboard.press('Escape');
  const after = await page.evaluate(() => ({
    open: window.RhylthymePlayground.isOpen(),
    visible: !!document.getElementById('rt-playground').getClientRects().length,
    htmlClass: document.documentElement.classList.contains('rt-pg-open'),
    focusOnButton: document.activeElement === document.querySelector('.rt-try'),
    scrollY: window.scrollY,
  }));
  assert.deepEqual(after, { open: false, visible: false, htmlClass: false, focusOnButton: true, scrollY: 300 });
  await done();
});

test('focus stays inside the dialog', async () => {
  const { page, done } = await fixture();
  await openExample(page);
  // Where focus is: the header buttons, the editor, or the player (whose
  // controls are in its shadow root).
  const where = () =>
    page.evaluate(() => {
      const el = document.activeElement;
      if (el.matches('.rt-pg-player')) return 'player';
      if (el.closest('.rt-pg-editor')) return 'editor';
      return el.className;
    });
  for (const key of ['Tab', 'Shift+Tab']) {
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(key);
      assert.ok(await focusInside(page), `after ${key} #${i + 1}`);
      seen.add(await where());
    }
    for (const stop of ['editor', 'player', 'rt-pg-btn rt-pg-reset', 'rt-pg-btn rt-pg-close']) {
      assert.ok(seen.has(stop), `${key} reaches ${stop}: ${[...seen].join(', ')}`);
    }
  }
  await done();
});

test('phone width stacks player above editor', async () => {
  const { page, done } = await fixture({ viewport: { width: 390, height: 800 } });
  await openExample(page);
  const layout = await page.evaluate(() => {
    const player = document.querySelector('.rt-pg-player').getBoundingClientRect();
    const editor = document.querySelector('.rt-pg-editor').getBoundingClientRect();
    const dialog = document.getElementById('rt-playground');
    return {
      playerBottom: player.bottom,
      editorTop: editor.top,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      dialogScrollsSideways: dialog.scrollWidth > dialog.clientWidth,
    };
  });
  assert.ok(layout.playerBottom <= layout.editorTop, JSON.stringify(layout));
  // Not into the editor: a phone's keyboard would cover the panel.
  assert.ok(await focusInside(page), 'focus moved into the dialog');
  assert.equal(await focusInEditor(page), false, 'focus is not in the editor');
  assert.equal(await page.evaluate(() => document.activeElement.matches('.rt-pg-close')), true, 'focus is on Close');
  assert.equal(layout.pageScrollsSideways, false);
  assert.equal(layout.dialogScrollsSideways, false);
  await done();
});

test('dark scheme: player theme and editor theme', async () => {
  const { page, done } = await fixture();
  await page.evaluate(() => document.body.setAttribute('data-md-color-scheme', 'slate'));
  await openExample(page);
  const editorBg = () => page.evaluate(() => getComputedStyle(document.querySelector('.rt-pg-editor .cm-editor')).backgroundColor);
  assert.equal(await page.getAttribute('.rt-pg-player', 'theme'), 'dark');
  const darkBg = await editorBg();
  await page.evaluate(() => document.body.setAttribute('data-md-color-scheme', 'default'));
  await page.waitForFunction(() => document.querySelector('.rt-pg-player').getAttribute('theme') === 'light');
  assert.notEqual(await editorBg(), darkBg, 'the editor theme follows the scheme');
  await done();
});

test('open() rejects when the example cannot be fetched', async () => {
  const { page, done } = await fixture();
  const outcome = await page.evaluate(() =>
    window.RhylthymePlayground.open({
      id: 'no-such-example',
      exampleUrl: '/playground/examples/no-such-example.json',
      pageUrl: location.href,
      returnFocus: document.querySelector('.rt-try'),
    }).then(() => 'resolved', (e) => 'rejected: ' + e.message),
  );
  assert.match(outcome, /^rejected: /);
  assert.equal(await page.evaluate(() => window.RhylthymePlayground.isOpen()), false);
  await done({ allow: /status of 404/ }); // the browser logs the 404 this test asks for
});
