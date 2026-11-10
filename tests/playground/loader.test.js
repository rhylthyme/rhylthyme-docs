'use strict';
// The loader (docs/javascripts/try-it-live.js) on the fixture page, in Chromium.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { launch } = require('../snippets/lib/browser');
const { serve } = require('./lib/server');
const { loadExample } = require('./lib/examples');

const ROOT = path.join(__dirname, '..', '..');
const FAILED = 'Could not load the editor. Reload the page to try again.';
const FIRST = 'duration-fixed';
const SECOND = 'buffers';

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

// A fresh page on the fixture (`query` is appended to the URL). Collects page
// errors, console errors and the bundle requests; `done()` closes the context
// and asserts there were no errors beyond those `allow` matches.
async function fixture({ query = '', setup, javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled });
  const page = await context.newPage();
  const errors = [];
  const bundleRequests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });
  page.on('request', (r) => {
    if (r.url().endsWith('/playground.bundle.js')) bundleRequests.push(r.url());
  });
  if (setup) await setup(page);
  await page.goto(site.url + '/fixture/' + query);
  return {
    page,
    errors,
    bundleRequests,
    async done({ allow } = {}) {
      await context.close();
      assert.deepEqual(errors.filter((e) => !(allow && allow.test(e))), []);
    },
  };
}

const button = (page, id) => page.locator(`.rt-try[data-example="${id}"]`);
const dialogOpen = (page) =>
  page.waitForFunction(() => window.RhylthymePlayground && window.RhylthymePlayground.isOpen());

test('buttons are hidden until the loader runs, then visible', async () => {
  const off = await fixture({ javaScriptEnabled: false });
  assert.equal(await button(off.page, FIRST).isVisible(), false);
  await off.done();

  const on = await fixture();
  assert.ok(await button(on.page, FIRST).isVisible());
  assert.equal(await on.page.evaluate(() => document.documentElement.classList.contains('rt-try-ready')), true);
  await on.done();
});

test('the bundle is not requested until the first click', async () => {
  const { page, bundleRequests, done } = await fixture();
  await page.waitForLoadState('networkidle');
  assert.equal(bundleRequests.length, 0);
  await button(page, FIRST).click();
  await dialogOpen(page);
  assert.equal(bundleRequests.length, 1);
  await done();
});

test('click opens that example', async () => {
  const { page, done } = await fixture();
  await button(page, SECOND).click();
  await dialogOpen(page);
  assert.equal((await page.textContent('.rt-pg-title')).trim(), loadExample(SECOND).title);
  assert.equal(await button(page, SECOND).textContent(), 'Try it live');
  assert.equal(await button(page, SECOND).getAttribute('aria-busy'), null);
  await done();
});

test('a double click opens one dialog', async () => {
  const { page, bundleRequests, done } = await fixture();
  await button(page, FIRST).dblclick();
  await dialogOpen(page);
  assert.equal(bundleRequests.length, 1);
  assert.equal(await page.locator('#rt-playground').count(), 1);
  await done();
});

test('?try=<id> opens it on load; closing clears the parameter', async () => {
  const { page, done } = await fixture({ query: `?try=${FIRST}` });
  await dialogOpen(page);
  assert.equal((await page.textContent('.rt-pg-title')).trim(), loadExample(FIRST).title);
  await page.click('.rt-pg-close');
  await page.waitForFunction(() => location.search === '');
  assert.equal(await page.evaluate(() => location.search), '');
  await done();
});

test('an unknown ?try= is ignored', async () => {
  const { page, bundleRequests, done } = await fixture({ query: '?try=no-such-example' });
  await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('#rt-playground').count(), 0);
  assert.equal(bundleRequests.length, 0);
  await done();
});

test('a failed load is reported on the button', async () => {
  const { page, done } = await fixture({
    setup: (p) => p.route('**/playground.bundle.js', (route) => route.abort()),
  });
  const b = button(page, FIRST);
  await b.click();
  await page.waitForFunction((sel) => document.querySelector(sel).textContent.startsWith('Could not'), '.rt-try');
  assert.equal((await b.textContent()).trim(), FAILED);
  assert.ok(await b.evaluate((el) => el.classList.contains('rt-try-failed')));
  assert.equal(await b.getAttribute('aria-busy'), null);
  await done({ allow: /^console\.error: Failed to load resource/ });
});

test('a failed example fetch is reported on the button', async () => {
  const { page, done } = await fixture({
    setup: (p) => p.route(`**/playground/examples/${FIRST}.json`, (route) => route.fulfill({ status: 404, body: 'no' })),
  });
  const b = button(page, FIRST);
  await b.click();
  await page.waitForFunction((sel) => document.querySelector(sel).textContent.startsWith('Could not'), '.rt-try');
  assert.equal((await b.textContent()).trim(), FAILED);
  assert.ok(await b.evaluate((el) => el.classList.contains('rt-try-failed')));
  assert.equal(await page.evaluate(() => window.RhylthymePlayground.isOpen()), false);
  await done({ allow: /^console\.error: Failed to load resource/ });
});

test('a retry after a failed load restores the button\'s own label', async () => {
  let aborted = 0;
  const { page, bundleRequests, done } = await fixture({
    setup: (p) =>
      p.route('**/playground.bundle.js', (route) => (aborted++ === 0 ? route.abort() : route.fallback())),
  });
  const b = button(page, FIRST);
  const label = await b.textContent();
  await b.click();
  await page.waitForFunction((sel) => document.querySelector(sel).classList.contains('rt-try-failed'), '.rt-try');
  assert.equal((await b.textContent()).trim(), FAILED);
  await b.click(); // now the bundle loads
  await dialogOpen(page);
  await page.click('.rt-pg-close');
  assert.equal(await b.textContent(), label);
  assert.equal(await b.evaluate((el) => el.classList.contains('rt-try-failed')), false);
  assert.equal(await b.getAttribute('aria-busy'), null);
  assert.equal(bundleRequests.length, 2);
  await done({ allow: /^console\.error: Failed to load resource/ });
});

test('a second button clicked while the bundle loads wins, with one bundle and one dialog', async () => {
  let release;
  const held = new Promise((ok) => (release = ok));
  const { page, bundleRequests, done } = await fixture({
    setup: (p) =>
      p.route('**/playground.bundle.js', async (route) => {
        await held;
        await route.fallback();
      }),
  });
  const labels = [await button(page, FIRST).textContent(), await button(page, SECOND).textContent()];
  await button(page, FIRST).click();
  await button(page, SECOND).click();
  assert.equal(await page.evaluate(() => !!window.RhylthymePlayground), false, 'still loading');
  release();
  await dialogOpen(page);
  await page.waitForFunction(() => [...document.querySelectorAll('.rt-try')].every((b) => !b.hasAttribute('aria-busy')));
  assert.equal(bundleRequests.length, 1);
  assert.equal(await page.locator('#rt-playground').count(), 1);
  assert.equal((await page.textContent('.rt-pg-title')).trim(), loadExample(SECOND).title);
  assert.equal(await button(page, FIRST).textContent(), labels[0]);
  assert.equal(await button(page, SECOND).textContent(), labels[1]);
  await done();
});
