'use strict';
// docs/development/finding-codes.md is generated from the finding-code
// catalogue @rhylthyme/timeline ships; it must equal a fresh generation.
// The package is found as tools/gen-finding-codes.js says: $RHYLTHYME_TIMELINE,
// node_modules, or the sibling ../rhylthyme-timeline checkout.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { loadCatalogue, generate, PAGE } = require('../tools/gen-finding-codes.js');

test('finding-codes.md matches the catalogue in @rhylthyme/timeline', () => {
  const { catalogue, version } = loadCatalogue();
  const fresh = generate(catalogue, version);
  const committed = fs.readFileSync(PAGE, 'utf8');
  assert.ok(committed === fresh, 'docs/development/finding-codes.md is stale: run node tools/gen-finding-codes.js');
});

test('every code has an anchored heading, so finding-codes.md#<code> links work', () => {
  const { catalogue } = loadCatalogue();
  const page = fs.readFileSync(PAGE, 'utf8');
  for (const code of Object.keys(catalogue.codes)) {
    assert.ok(page.includes(`\n### \`${code}\` {#${code}}\n`), `no heading for ${code}`);
  }
  for (const area of Object.keys(catalogue.areas)) assert.match(page, new RegExp(`\\n## .+ \\{#${area}\\}\\n`));
});
