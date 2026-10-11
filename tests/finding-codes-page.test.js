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

test('inline code spans in the page are well formed (no backtick nested in a span)', () => {
  const page = fs.readFileSync(PAGE, 'utf8');
  const prose = page.split(/^```.*$/m).filter((_, i) => i % 2 === 0).join('\n');
  for (const line of prose.split('\n')) {
    assert.equal((line.match(/`/g) || []).length % 2, 0, `unpaired backtick: ${line}`);
    for (const m of line.matchAll(/`([^`]*)`/g)) assert.ok(!/^\s|\s$/.test(m[1]), `code span \`${m[1]}\` in: ${line}`);
  }
});

// The hosted MCP server still runs its own validator, so the docs must not
// say the page lists every code validate_program reports, and the codes the
// page names as hosted-only must really be missing from the catalogue.
test('the docs do not claim the page lists every hosted validate_program code', () => {
  const { catalogue } = loadCatalogue();
  const { HOSTED_ONLY } = require('../tools/gen-finding-codes.js');
  assert.deepEqual(HOSTED_ONLY.filter((c) => catalogue.codes[c]), [], 'now catalogued: drop them from HOSTED_ONLY');
  const path = require('path');
  const root = path.join(__dirname, '..', 'docs');
  const files = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(md|txt)$/.test(e.name)) files.push(p);
  });
  walk(root);
  const claims = [/every code `?validate_program`? reports/i, /explains every (one|code)/i, /explains each code/i, /\[every code\]\([^)]*finding-codes/i];
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    for (const re of claims) assert.doesNotMatch(text, re, `${path.relative(root, f)}`);
  }
});
