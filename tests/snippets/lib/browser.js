'use strict';
// Chromium through Playwright, with the jsDelivr URLs of the pinned
// @rhylthyme/timeline answered from the tarball when one is given.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { pinnedVersion } = require('./docs');
const env = require('./env');

const TYPES = { '.js': 'application/javascript', '.mjs': 'application/javascript', '.json': 'application/json', '.css': 'text/css' };

// PLAYWRIGHT_CHANNEL=chrome uses an installed Google Chrome. Without it, the
// Chromium from `npx playwright install chromium`, falling back to Chrome.
async function launch() {
  if (process.env.PLAYWRIGHT_CHANNEL) return chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  try {
    return await chromium.launch();
  } catch (e) {
    if (!/Executable doesn't exist/.test(e.message)) throw e;
    return chromium.launch({ channel: 'chrome' });
  }
}

// Opens `html` as a file:// page (as a reader would after saving the snippet
// to an .html file). Collects page errors, console lines and the requests made
// to the pinned version on jsDelivr.
async function openPage(browser, html, { name = 'snippet' } = {}) {
  const base = env.cdnBase(pinnedVersion());
  const page = await browser.newPage();
  const errors = [];
  const logs = [];
  const cdn = { hits: [], failures: [] };
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    logs.push(m.text());
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });
  page.on('request', (r) => {
    if (r.url().startsWith(base)) cdn.hits.push(r.url().slice(base.length));
  });
  page.on('response', (r) => {
    if (r.url().startsWith(base) && r.status() >= 400) {
      cdn.failures.push(`${r.status()} ${r.url()}`);
    }
  });
  page.on('requestfailed', (r) => {
    if (r.url().startsWith(base)) cdn.failures.push(`${r.failure()?.errorText} ${r.url()}`);
  });
  if (env.TARBALL) {
    const root = env.unpackedTarball();
    await page.route(base + '**', (route) => {
      const rel = decodeURIComponent(new URL(route.request().url()).pathname.slice(new URL(base).pathname.length));
      const file = path.join(root, rel);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not in the tarball' });
      return route.fulfill({ path: file, contentType: TYPES[path.extname(file)] || 'application/octet-stream' });
    });
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-snippet-'));
  const file = path.join(dir, `${name}.html`);
  fs.writeFileSync(file, html);
  await page.goto('file://' + file);
  if (cdn.failures.length) {
    await page.close();
    throw new Error(
      'the page could not load @rhylthyme/timeline from jsDelivr:\n  ' + cdn.failures.join('\n  ') +
        (env.TARBALL ? '' : `\n  Is ${pinnedVersion()} published on npm? To test a build before publishing, set RHYLTHYME_TIMELINE_TARBALL=<npm pack .tgz>.`),
    );
  }
  return { page, errors, logs, cdn };
}

// In-page: plays the element's current program to the end at its own speed,
// starting steps that wait for a person and finishing steps that stay active
// (indefinite or variable steps), the way a person would press Start and Done.
// Uses no step names; returns the final status.
async function playToEnd(page, selector = 'rhylthyme-timeline', timeoutMs = 20000) {
  return page.evaluate(
    async ({ selector, timeoutMs }) => {
      const el = document.querySelector(selector);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const activeFor = {};
      if (el.status !== 'running') el.start();
      const t0 = Date.now();
      while (el.status !== 'completed' && Date.now() - t0 < timeoutMs) {
        await sleep(50);
        for (const [id, state] of Object.entries(el.stepStates || {})) {
          if (state === 'waiting') el.startStep(id);
          if (state === 'active') {
            activeFor[id] = (activeFor[id] || 0) + 1;
            if (activeFor[id] >= 4) el.completeStep(id);
          }
        }
      }
      return el.status;
    },
    { selector, timeoutMs },
  );
}

module.exports = { launch, openPage, playToEnd };
