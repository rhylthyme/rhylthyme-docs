'use strict';
// Every fenced code block in the pages of tests/snippets.config carries a
// marker, and every snippet id is run by a test:
//
//   <!-- snippet: <id> -->              a test under tests/ calls snippet('<id>')
//   <!-- snippet: skip — <reason> -->   illustrative only, with the reason
//
// Fails on an unmarked block, a malformed or misplaced marker, a duplicate id,
// an id no test runs, and a test asking for an id no page has. A call counts
// only in code that can run (see lib/coverage.js): not in a comment, a dead
// branch or a function nothing calls.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { ROOT, allBlocks, configPages, pinnedVersion } = require('./lib/docs');
const env = require('./lib/env');
const { idsUsedByTests } = require('./lib/coverage');

const where = (b) => `${b.page}:${b.line}`;

test('the pages in tests/snippets.config exist', () => {
  const pages = configPages();
  assert.ok(pages.length > 0);
  for (const p of pages) assert.ok(fs.existsSync(path.join(ROOT, p)), p);
});

test('every code block has a snippet marker', () => {
  const { blocks } = allBlocks();
  assert.ok(blocks.length > 0);
  const unmarked = blocks.filter((b) => !b.marker).map((b) => `${where(b)} (\`\`\`${b.lang}) has no <!-- snippet: <id> --> or <!-- snippet: skip — <reason> --> marker`);
  assert.deepEqual(unmarked, []);
  const bad = blocks.filter((b) => b.marker && b.marker.error).map((b) => `${where(b)}: ${b.marker.error}`);
  assert.deepEqual(bad, []);
});

test('every marker is directly in front of a code block', () => {
  assert.deepEqual(allBlocks().orphanMarkers.map((m) => `${m.page}:${m.line} ${m.text} is not followed by a code block`), []);
});

test('snippet ids are unique', () => {
  const seen = new Map();
  const dups = [];
  for (const b of allBlocks().blocks.filter((b) => b.marker && b.marker.id)) {
    if (seen.has(b.marker.id)) dups.push(`${b.marker.id}: ${seen.get(b.marker.id)} and ${where(b)}`);
    else seen.set(b.marker.id, where(b));
  }
  assert.deepEqual(dups, []);
});

test('every snippet id is run by a test', () => {
  const used = idsUsedByTests();
  const untested = allBlocks()
    .blocks.filter((b) => b.marker && b.marker.id && !used.has(b.marker.id))
    .map((b) => `${b.marker.id} (${where(b)}) is not run by any test under tests/`);
  assert.deepEqual(untested, []);
});

test('every id a test asks for is marked in the docs', () => {
  const marked = new Set(allBlocks().blocks.filter((b) => b.marker && b.marker.id).map((b) => b.marker.id));
  const unknown = [...idsUsedByTests()].filter(([id]) => !marked.has(id)).map(([id, f]) => `${f} asks for snippet "${id}", which no page marks`);
  assert.deepEqual(unknown, []);
});

test('package.json pins @rhylthyme/timeline at the version the docs pin', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies['@rhylthyme/timeline'], pinnedVersion());
});

test('node_modules holds the build under test', () => {
  assert.equal(env.installedVersion(), pinnedVersion());
  if (env.TARBALL) {
    assert.equal(env.tarballVersion(env.TARBALL), pinnedVersion(), 'the tarball is the pinned version');
    assert.ok(env.installedMatchesTarball(), 'node_modules/@rhylthyme/timeline is the tarball (npm test runs tests/setup.js first)');
  } else {
    assert.ok(!String(env.installedResolved()).startsWith('file:'), 'node_modules has a tarball install left over; run npm ci');
  }
});
