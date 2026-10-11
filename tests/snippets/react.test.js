'use strict';
// docs/development/embedding.md, "In React": the component, saved as
// RhylthymeTimeline.jsx, bundled with esbuild against the installed
// @rhylthyme/timeline and run in Chromium on React 18 and on React 19.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require('esbuild');
const { ROOT, snippet } = require('./lib/docs');
const { launch, playToEnd } = require('./lib/browser');

// The test's own app around the documented component: a small program whose
// second step waits for Done, two sets of handlers (to see the effect
// cleanup), and window hooks for the test.
const MAIN = `
import { createRoot } from 'react-dom/client';
import { version } from 'react';
import { RhylthymeTimeline } from './RhylthymeTimeline.jsx';

const program = { schemaVersion: '0.1.0', programId: 'tea', name: 'Tea', tracks: [{ trackId: 'tea', name: 'Tea', steps: [
  { stepId: 'boil', name: 'Boil', startTrigger: { type: 'programStart' }, duration: { type: 'fixed', seconds: 60 } },
  { stepId: 'drink', name: 'Drink', startTrigger: { type: 'afterStep', stepId: 'boil' }, duration: { type: 'indefinite', defaultSeconds: 60 } } ] }] };

window.reactVersion = version;
window.events = [];
const handlers = (tag) => ({
  onStepComplete: (d) => window.events.push([tag, 'step', d.stepId]),
  onComplete: (d) => window.events.push([tag, 'complete', d.time]),
});
const container = document.createElement('div');
document.body.appendChild(container);
const root = createRoot(container);
const render = (tag) => root.render(<RhylthymeTimeline program={program} speed={1000} {...handlers(tag)} />);
window.app = { render, unmount: () => root.unmount() };
render('first');
`;

async function bundle(reactMajor) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `rt-react${reactMajor}-`));
  fs.writeFileSync(path.join(dir, 'RhylthymeTimeline.jsx'), snippet('react-component').code);
  fs.writeFileSync(path.join(dir, 'main.jsx'), MAIN);
  const out = path.join(dir, 'main.out.js');
  await esbuild.build({
    entryPoints: [path.join(dir, 'main.jsx')],
    bundle: true,
    outfile: out,
    format: 'iife',
    jsx: 'automatic',
    nodePaths: [path.join(ROOT, 'node_modules')],
    alias: { react: `react${reactMajor}`, 'react-dom': `react-dom${reactMajor}` },
    define: { 'process.env.NODE_ENV': '"development"' },
    logLevel: 'silent',
  });
  return out;
}

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser?.close();
});

for (const major of [18, 19]) {
  test(`react-component: works in React ${major}`, { timeout: 60000 }, async () => {
    const script = await bundle(major);
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push('console.error: ' + m.text()));
    try {
      await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
      await page.addScriptTag({ path: script });
      assert.equal(String(await page.evaluate(() => window.reactVersion)).split('.')[0], String(major));

      await page.waitForFunction(() => document.querySelector('rhylthyme-timeline')?.timings?.boil, null, { timeout: 15000 });
      const el = await page.evaluate(() => {
        const el = document.querySelector('rhylthyme-timeline');
        return { mode: el.getAttribute('mode'), svg: !!el.shadowRoot.querySelector('svg'), program: el.program && el.program.programId };
      });
      assert.deepEqual(el, { mode: 'player', svg: true, program: 'tea' });

      // New handler props: the effect must drop the old listeners.
      await page.evaluate(() => window.app.render('second'));
      assert.equal(await playToEnd(page), 'completed', 'played at speed={1000}');
      await page.waitForFunction(() => window.events.some((e) => e[1] === 'complete'), null, { timeout: 10000 });
      const events = await page.evaluate(() => window.events);
      assert.deepEqual(events.filter((e) => e[0] === 'first'), [], 'the first handlers were removed');
      assert.deepEqual(events.filter((e) => e[1] === 'step').map((e) => e[2]), ['drink'], 'onStepComplete for the step a person finished');
      assert.equal(events.filter((e) => e[1] === 'complete').length, 1, 'onComplete once');

      await page.evaluate(() => window.app.unmount());
      assert.equal(await page.evaluate(() => document.querySelector('rhylthyme-timeline')), null);
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  });
}
