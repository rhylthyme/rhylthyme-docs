'use strict';
// The docs pages that carry "Try it live" buttons, checked in their Markdown
// source (the built site is checked by the site tests).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { EXAMPLE_IDS } = require('./lib/examples');

const ROOT = path.join(__dirname, '..', '..');
const BUTTON = /<button class="rt-try" data-example="([a-z0-9-]+)">Try it live<\/button>/g;

function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return markdownFiles(p);
    return e.name.endsWith('.md') ? [p] : [];
  });
}

test('the Concepts page has the 12 buttons in order', () => {
  const md = fs.readFileSync(path.join(ROOT, 'docs/getting-started/concepts.md'), 'utf8');
  const ids = [...md.matchAll(BUTTON)].map((m) => m[1]);
  assert.deepEqual(ids, EXAMPLE_IDS);
});

test('every button in the docs has an example, and every example a button', () => {
  const seen = [];
  for (const file of markdownFiles(path.join(ROOT, 'docs'))) {
    const md = fs.readFileSync(file, 'utf8');
    const ids = [...md.matchAll(BUTTON)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${file}: an id appears twice`);
    const classed = (md.match(/<[a-z]+[^>]*class="(?:[^"]*\s)?rt-try(?:\s[^"]*)?"[^>]*>/g) || []).length;
    assert.equal(classed, ids.length, `${file}: an rt-try element does not match the standard markup`);
    const attrs = (md.match(/data-example="/g) || []).length;
    assert.equal(attrs, ids.length, `${file}: a data-example is not on a standard button`);
    seen.push(...ids);
  }
  assert.deepEqual([...seen].sort(), [...EXAMPLE_IDS].sort());
});

test('the loader and stylesheet are wired in mkdocs.yml', () => {
  const yml = fs.readFileSync(path.join(ROOT, 'mkdocs.yml'), 'utf8');
  assert.match(yml, /^extra_css:\n(?:  - .*\n)*  - stylesheets\/try-it-live\.css$/m);
  assert.match(yml, /^extra_javascript:\n(?:  - .*\n)*  - javascripts\/try-it-live\.js$/m);
});
