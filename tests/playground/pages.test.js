'use strict';
// The docs pages that carry "Try it live" buttons, checked in their Markdown
// source (the built site is checked by the site tests).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { EXAMPLE_IDS, PAGE_EXAMPLES } = require('./lib/examples');

const ROOT = path.join(__dirname, '..', '..');
// A button is <button class="rt-try" data-example="<id>">Try it live</button>;
// inside a <p class="rt-try-row"> its text is "Try it live: <label>" instead.
const BUTTON = /<button class="rt-try" data-example="([a-z0-9-]+)">(Try it live(?:: ([^<]*))?)<\/button>/g;
const ROW = /<p class="rt-try-row">([\s\S]*?)<\/p>/g;

// The page's buttons in order: { id, text, label, row } (row: index of the
// .rt-try-row holding it, or -1).
function buttons(md) {
  const rows = [...md.matchAll(ROW)].map((m) => [m.index, m.index + m[0].length]);
  return [...md.matchAll(BUTTON)].map((m) => ({
    id: m[1],
    text: m[2],
    label: m[3],
    row: rows.findIndex(([from, to]) => m.index > from && m.index < to),
  }));
}

function checkLabels(file, found) {
  for (const b of found) {
    if (b.row === -1) assert.equal(b.text, 'Try it live', `${file}: ${b.id} is outside a row, so its text is "Try it live"`);
    else assert.match(b.text, /^Try it live: \S(.*\S)?$/, `${file}: ${b.id} is in a row, so it reads "Try it live: <label>"`);
  }
  const rows = new Set(found.filter((b) => b.row !== -1).map((b) => b.row));
  for (const row of rows) {
    const labels = found.filter((b) => b.row === row).map((b) => b.label);
    assert.equal(new Set(labels).size, labels.length, `${file}: labels repeat within a row`);
  }
}

function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return markdownFiles(p);
    return e.name.endsWith('.md') ? [p] : [];
  });
}

for (const [file, ids] of Object.entries(PAGE_EXAMPLES)) {
  test(`${file} has its ${ids.length} buttons in order`, () => {
    const found = buttons(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    assert.deepEqual(found.map((b) => b.id), ids);
  });
}

test('the pages together have every example once', () => {
  const all = Object.values(PAGE_EXAMPLES).flat();
  assert.deepEqual([...all].sort(), [...EXAMPLE_IDS].sort());
  assert.equal(new Set(all).size, all.length, 'an example is on two pages');
});

test('the Concepts page has the 12 buttons, the trigger row labelled', () => {
  const md = fs.readFileSync(path.join(ROOT, 'docs/getting-started/concepts.md'), 'utf8');
  const found = buttons(md);
  assert.deepEqual(found.map((b) => b.id), EXAMPLE_IDS);
  const row = found.filter((b) => b.row !== -1);
  assert.deepEqual(row.map((b) => b.label), ['programStart', 'afterStep', 'manual']);
});

test('every button in the docs has an example, and every example a button', () => {
  const seen = [];
  for (const file of markdownFiles(path.join(ROOT, 'docs'))) {
    const md = fs.readFileSync(file, 'utf8');
    const found = buttons(md);
    checkLabels(file, found);
    const ids = found.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length, `${file}: an id appears twice`);
    const classed = (md.match(/<[a-z]+[^>]*class="(?:[^"]*\s)?rt-try(?:\s[^"]*)?"[^>]*>/g) || []).length;
    assert.equal(classed, ids.length, `${file}: an rt-try element does not match the standard markup`);
    const attrs = (md.match(/data-example="/g) || []).length;
    assert.equal(attrs, ids.length, `${file}: a data-example is not on a standard button`);
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    if (ids.length) assert.ok(PAGE_EXAMPLES[rel], `${rel} has buttons: list it in PAGE_EXAMPLES`);
    seen.push(...ids);
  }
  assert.deepEqual([...seen].sort(), [...EXAMPLE_IDS].sort());
});

test('the loader and stylesheet are wired in mkdocs.yml', () => {
  const yml = fs.readFileSync(path.join(ROOT, 'mkdocs.yml'), 'utf8');
  assert.match(yml, /^extra_css:\n(?:  - .*\n)*  - stylesheets\/try-it-live\.css$/m);
  assert.match(yml, /^extra_javascript:\n(?:  - .*\n)*  - javascripts\/try-it-live\.js$/m);
});
