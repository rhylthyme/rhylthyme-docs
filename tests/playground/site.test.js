'use strict';
// "Try it live" in the built site: the Concepts page as `zensical build` makes
// it (site/, or $MKDOCS_SITE_DIR), with Zensical's instant navigation, header
// and search. Skipped when there is no build, except in CI ($CI set), where a
// missing build fails. The bundle, loader and stylesheet are served from
// docs/ (fresh from `pretest`) even when site/ holds older copies; one test
// checks the copies in site/ itself, which is what gets deployed.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { launch } = require('../snippets/lib/browser');
const { serve } = require('./lib/server');
const { EXAMPLE_IDS, PAGE_EXAMPLES, pageUrlPath, loadExample } = require('./lib/examples');
const { applySuggestion } = require('../../playground/src/apply');

const ROOT = path.join(__dirname, '..', '..');
const SITE = path.resolve(process.env.MKDOCS_SITE_DIR || path.join(ROOT, 'site'));
const built = fs.existsSync(path.join(SITE, 'index.html'));
const skip = built ? false : `no build in ${SITE}`;

if (!built && process.env.CI) {
  test('the site is built before the tests in CI', () => {
    assert.fail(`no build in ${SITE}: run zensical build before npm test`);
  });
}

const CONCEPTS = '/getting-started/concepts/';
const QUICK_START = '/getting-started/quick-start/';
const FAILED = 'Could not load the editor. Reload the page to try again.';
const fromDocs = (rel) => path.join(ROOT, 'docs', rel);

let browser;
let site;
before(async () => {
  if (!built) return;
  browser = await launch();
  site = await serve({
    roots: [SITE],
    overrides: {
      '/javascripts/playground.bundle.js': fromDocs('javascripts/playground.bundle.js'),
      '/javascripts/try-it-live.js': fromDocs('javascripts/try-it-live.js'),
      '/stylesheets/try-it-live.css': fromDocs('stylesheets/try-it-live.css'),
    },
  });
});
after(async () => {
  if (browser) await browser.close();
  if (site) await site.close();
});

// A fresh page of the built site. Requests that leave the test server (web
// fonts, the GitHub API for the repository facts in the header) are answered
// empty, so the tests do not depend on the network. Collects page errors,
// console errors and failed requests; `done()` closes the context and asserts
// there were none (`allow`: console errors the test expects).
async function sitePage(urlPath, { viewport = { width: 1440, height: 900 }, colorScheme = 'light', setup } = {}) {
  const context = await browser.newContext({ viewport, colorScheme });
  const page = await context.newPage();
  const errors = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith(site.url)) return route.fallback();
    const json = new URL(url).hostname === 'api.github.com';
    return route.fulfill({ status: 200, contentType: json ? 'application/json' : 'text/plain', body: json ? '{}' : '' });
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => errors.push(`failed ${r.failure()?.errorText} ${r.url()}`));
  if (setup) await setup(page);
  await page.goto(site.url + urlPath);
  return {
    page,
    errors,
    async done({ allow } = {}) {
      await context.close();
      assert.deepEqual(errors.filter((e) => !(allow && allow.test(e))), []);
    },
  };
}

const button = (page, id) => page.locator(`.rt-try[data-example="${id}"]`);
const isOpen = (page) => page.evaluate(() => !!window.RhylthymePlayground && window.RhylthymePlayground.isOpen());
const dialogOpen = (page) =>
  page.waitForFunction(() => window.RhylthymePlayground && window.RhylthymePlayground.isOpen());
const dialogClosed = (page) =>
  page.waitForFunction(() => !window.RhylthymePlayground || !window.RhylthymePlayground.isOpen());
const title = async (page) => (await page.textContent('.rt-pg-title')).trim();
const htmlHasOpen = (page) => page.evaluate(() => document.documentElement.classList.contains('rt-pg-open'));

// From Quick Start to Concepts by the sidebar link, as a reader would: an
// instant navigation (no full load), checked with a marker on `window`.
async function arriveByNav(page) {
  await page.evaluate(() => {
    window.__noReload = true;
  });
  await page.locator(`.md-sidebar--primary a.md-nav__link[href$="concepts/"]`).first().click();
  await page.waitForURL((u) => u.pathname === CONCEPTS);
  await page.waitForSelector('.rt-try', { state: 'visible' });
  assert.equal(await page.evaluate(() => window.__noReload), true, 'the page was not reloaded');
}

test('the built site itself holds the loader, stylesheet, bundle and examples', { skip }, () => {
  const files = [
    'javascripts/playground.bundle.js',
    'javascripts/try-it-live.js',
    'stylesheets/try-it-live.css',
    ...EXAMPLE_IDS.map((id) => `playground/examples/${id}.json`),
  ];
  for (const rel of files) {
    const file = path.join(SITE, rel);
    assert.ok(fs.existsSync(file), `site/${rel} is missing`);
    assert.ok(fs.statSync(file).size > 0, `site/${rel} is empty`);
    if (rel.endsWith('.json')) assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, 'utf8')), `site/${rel}`);
  }
});

test('every page with buttons has its working buttons, in order', { skip }, async () => {
  const seen = [];
  for (const [md, expected] of Object.entries(PAGE_EXAMPLES)) {
    const { page, done } = await sitePage(pageUrlPath(md));
    const ids = await page.$$eval('button.rt-try', (bs) => bs.map((b) => b.getAttribute('data-example')));
    assert.deepEqual(ids, expected, md);
    seen.push(...ids);
    await openEach(page, ids);
    await done();
  }
  assert.deepEqual([...seen].sort(), [...EXAMPLE_IDS].sort());
});

async function openEach(page, ids) {
  for (const id of ids) {
    const b = button(page, id);
    assert.equal(await b.evaluate((el) => el.closest('pre, code') === null), true, `${id}: not in a code block`);
    assert.ok(await b.isVisible(), `${id}: visible`);
    const text = await b.textContent();
    await b.click();
    await dialogOpen(page);
    assert.equal(await title(page), loadExample(id).title, id);
    await page.click('.rt-pg-close');
    await dialogClosed(page);
    assert.equal(await b.textContent(), text, `${id}: its own text is back`);
  }
}

test('a labelled row button gets its own label back after loading', { skip }, async () => {
  const { page, done } = await sitePage(CONCEPTS);
  const label = 'Try it live: afterStep';
  const b = page.locator('.rt-try-row .rt-try', { hasText: label });
  assert.equal(await b.count(), 1);
  await b.click(); // the first click also loads the bundle
  await dialogOpen(page);
  await page.click('.rt-pg-close');
  await dialogClosed(page);
  assert.equal(await b.textContent(), label);
  await b.click(); // and a second open, bundle already there
  await dialogOpen(page);
  await page.click('.rt-pg-close');
  await dialogClosed(page);
  assert.equal(await b.textContent(), label);
  await done();
});

test('instant navigation: arriving from another page', { skip }, async () => {
  const { page, done } = await sitePage(QUICK_START);
  await arriveByNav(page);
  const id = EXAMPLE_IDS[0];
  await button(page, id).click();
  await dialogOpen(page);
  assert.equal(await title(page), loadExample(id).title);
  await done();
});

test('leaving the page closes the overlay', { skip }, async () => {
  const { page, done } = await sitePage(QUICK_START);
  await arriveByNav(page);
  await button(page, EXAMPLE_IDS[1]).click();
  await dialogOpen(page);
  await page.evaluate(() => history.back());
  await page.waitForURL((u) => u.pathname === QUICK_START);
  await dialogClosed(page);
  assert.equal(await page.locator('#rt-playground').isVisible(), false);
  assert.equal(await htmlHasOpen(page), false);
  assert.equal(await page.evaluate(() => window.__noReload), true, 'back was an instant navigation');
  await done();
});

test('a pending open does not land on the next page', { skip }, async () => {
  let release;
  const held = new Promise((ok) => (release = ok));
  const { page, done } = await sitePage(CONCEPTS, {
    setup: (p) =>
      p.route('**/playground.bundle.js', async (route) => {
        await held;
        await route.fallback();
      }),
  });
  await button(page, EXAMPLE_IDS[0]).click(); // the bundle is held back
  await page.evaluate(() => {
    window.__noReload = true;
    document.querySelector(`.md-sidebar--primary a.md-nav__link[href$="quick-start/"]`).click();
  });
  await page.waitForURL((u) => u.pathname === QUICK_START);
  release();
  await page.waitForFunction(() => !!window.RhylthymePlayground);
  await page.waitForTimeout(500); // time for an example fetch and an open
  assert.equal(await isOpen(page), false, 'no overlay on the new page');
  assert.equal(await htmlHasOpen(page), false);
  assert.equal(await page.evaluate(() => window.__noReload), true, 'an instant navigation');
  await done();
});

test('a ?try= link scrolls to its button, so closing leaves the reader there', { skip }, async () => {
  const [md, ids] = Object.entries(PAGE_EXAMPLES)[0];
  const id = ids[ids.length - 1]; // far down the page
  const { page, done } = await sitePage(`${pageUrlPath(md)}?try=${id}`);
  await dialogOpen(page);
  await page.click('.rt-pg-close');
  await dialogClosed(page);
  const inView = await button(page, id).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= innerHeight;
  });
  assert.ok(await page.evaluate(() => scrollY > 0), 'the page is scrolled');
  assert.ok(inView, 'the button is in view');
  await done();
});

test('?try= works on the real page', { skip }, async () => {
  const { page, done } = await sitePage(`${CONCEPTS}?try=instances`);
  await dialogOpen(page);
  assert.equal(await title(page), loadExample('instances').title);
  await page.click('.rt-pg-close');
  await page.waitForFunction(() => location.search === '');
  await done();
});

test('going back to a ?try= link keeps its ?try= while the old overlay closes', { skip }, async () => {
  const [shared, other] = [EXAMPLE_IDS[3], EXAMPLE_IDS[4]];
  // A shared link, then another page (an instant navigation, which closes
  // the overlay), where an overlay is open when the reader goes back.
  const { page, done } = await sitePage(`${CONCEPTS}?try=${shared}`);
  await dialogOpen(page);
  await page.evaluate(() => {
    window.__noReload = true;
    document.querySelector(`.md-sidebar--primary a.md-nav__link[href$="quick-start/"]`).click();
  });
  await page.waitForURL((u) => u.pathname === QUICK_START);
  await dialogClosed(page);
  await page.evaluate((id) => window.RhylthymeTryItLive.open(id), other);
  await dialogOpen(page);
  await page.evaluate(() => history.back());
  await page.waitForURL((u) => u.pathname === CONCEPTS);
  await page.waitForFunction((t) => document.querySelector('.rt-pg-title').textContent.trim() === t, loadExample(shared).title);
  assert.ok(await isOpen(page));
  await page.waitForTimeout(100); // after the close observer
  assert.equal(await page.evaluate(() => new URLSearchParams(location.search).get('try')), shared);
  assert.equal(await page.evaluate(() => window.__noReload), true, 'instant navigations only');
  await page.click('.rt-pg-close');
  await page.waitForFunction(() => location.search === '');
  await done();
});

// Zensical's search is a modal <dialog> in the top layer, above any z-index:
// the overlay cannot be drawn over it, so instead its shortcuts must not open
// it (or change the page) while the overlay is open.
const searchIsOpen = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('body > *')].some((el) => {
      const dialog = el.shadowRoot && el.shadowRoot.querySelector('dialog');
      return !!dialog && dialog.open;
    }),
  );
const SITE_KEYS = ['/', 's', 'Meta+k', 'Control+k', 'n', 'p', '.', ','];

test('the overlay sits above the site header and search', { skip }, async () => {
  const { page, done } = await sitePage(CONCEPTS);
  // The search opens on "/" here (so the check below can see it) ...
  await page.keyboard.press('/');
  await page.waitForFunction(() => document.activeElement && document.activeElement.shadowRoot);
  assert.equal(await searchIsOpen(page), true, 'the search dialog is found');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.activeElement || !document.activeElement.shadowRoot);
  assert.equal(await searchIsOpen(page), false);
  // ... and the "back to top" button appears when scrolling up.
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(300);
  await page.mouse.wheel(0, -400);
  await page.waitForSelector('.md-top:not([hidden])');

  const id = EXAMPLE_IDS[0];
  await page.evaluate((id) => window.RhylthymeTryItLive.open(id), id);
  await dialogOpen(page);
  const layers = ['.md-header', '.md-search', '.md-top', '.md-sidebar--primary', '.md-sidebar--secondary'];
  const covered = await page.evaluate((layers) => {
    const dialog = document.getElementById('rt-playground');
    return layers.map((sel) => {
      const el = document.querySelector(sel);
      const r = el && el.getBoundingClientRect();
      if (!r || !r.width || !r.height) return `${sel}: not shown`;
      const x = Math.max(0, Math.min(r.left + r.width / 2, innerWidth - 1));
      const y = Math.max(0, Math.min(r.top + r.height / 2, innerHeight - 1));
      return `${sel}: ${dialog.contains(document.elementFromPoint(x, y)) ? 'covered' : 'ON TOP'}`;
    });
  }, layers);
  assert.deepEqual(covered, layers.map((sel) => `${sel}: covered`));

  // Pathname and query: navigation.tracking puts the section in the hash.
  const where = () => page.evaluate(() => location.pathname + location.search);
  const url = await where();
  for (const key of SITE_KEYS) {
    await page.focus('.rt-pg-reset');
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
    assert.equal(await searchIsOpen(page), false, `${key} opened the search`);
    assert.equal(await where(), url, `${key} left the page`);
    assert.ok(await isOpen(page), `${key} closed the overlay`);
  }
  assert.equal(await title(page), loadExample(id).title);
  await done();
});

test('the page behind does not scroll while the overlay is open', { skip }, async () => {
  const { page, done } = await sitePage(CONCEPTS);
  const id = EXAMPLE_IDS[EXAMPLE_IDS.length - 1];
  await button(page, id).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  assert.ok(before > 0, 'the page is scrolled');
  await button(page, id).click();
  await dialogOpen(page);
  for (const sel of ['.rt-pg-title', '.rt-pg-preview', '.rt-pg-status']) {
    const box = await page.locator(sel).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 1500);
    await page.mouse.wheel(0, -3000);
  }
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => scrollY), before, 'the page did not move');
  await page.click('.rt-pg-close');
  await dialogClosed(page);
  assert.equal(await page.evaluate(() => scrollY), before, 'the page is where it was');
  await done();
});

test('the row of trigger buttons wraps on a phone; a failed button reads as an error', { skip }, async () => {
  const id = EXAMPLE_IDS[0];
  const { page, done } = await sitePage(CONCEPTS, {
    viewport: { width: 390, height: 844 },
    setup: (p) => p.route('**/playground.bundle.js', (route) => route.abort()),
  });
  const row = page.locator('.rt-try-row');
  assert.equal(await row.locator('.rt-try').count(), 3);
  const fits = await row.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return [...el.querySelectorAll('.rt-try')].every((b) => b.getBoundingClientRect().right <= r.right + 0.5);
  });
  assert.ok(fits, 'every button of the row fits the column');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'no sideways scroll');

  const normal = await button(page, id).evaluate((el) => getComputedStyle(el).color);
  await button(page, id).click();
  await page.waitForFunction((sel) => document.querySelector(sel).classList.contains('rt-try-failed'), `.rt-try[data-example="${id}"]`);
  assert.equal((await button(page, id).textContent()).trim(), FAILED);
  const failed = await button(page, id).evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, cursor: s.cursor, before: getComputedStyle(el, '::before').content };
  });
  assert.notEqual(failed.color, normal, 'error colour');
  assert.notEqual(failed.before, '"▶"', 'no play mark');
  assert.ok(await button(page, id).evaluate((el) => el.getBoundingClientRect().right <= innerWidth), 'the message fits');
  await done({ allow: /playground\.bundle\.js|^console\.error: Failed to load resource/ });
});

test('no page errors or failed requests on the Concepts page', { skip }, async () => {
  const { page, done } = await sitePage(CONCEPTS);
  await page.waitForLoadState('networkidle');
  const id = 'resource-constraints';
  await button(page, id).click();
  await dialogOpen(page);
  // The example's first suggestion that changes a value, applied as if typed.
  const example = loadExample(id);
  const suggestion = example.try.find((s) => Array.isArray(s.path));
  await page.evaluate((t) => window.RhylthymePlayground.setText(t), JSON.stringify(applySuggestion(example.program, suggestion), null, 2));
  await page.waitForSelector('.rt-pg-status .rt-pg-line[data-kind="warn"]'); // the conflict it causes
  await page.click('.rt-pg-close');
  await dialogClosed(page);
  await done();
});
