'use strict';
// Which snippet ids the test files ask for. A file counts a snippet('<id>')
// call only when it is code that can run: esbuild drops the comments, the dead
// branches and the functions nothing calls before the calls are matched.

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const TESTS = path.resolve(__dirname, '..', '..');
const SELF = [path.join(TESTS, 'snippets', 'coverage.test.js'), path.join(__dirname, 'docs.js'), __filename];
const CALL = /\bsnippet\(\s*"([^"]+)"\s*\)/g; // esbuild prints string literals with double quotes

// The literal ids `source` (one JavaScript file) passes to snippet().
function idsInSource(source, file = 'source.js') {
  const { code } = esbuild.transformSync(source, {
    loader: 'js',
    format: 'iife',
    minifySyntax: true, // drops if (false) { ... } and turns snippet(`id`) into snippet("id")
    treeShaking: true, // drops functions nothing calls
    legalComments: 'none',
    sourcefile: file,
  });
  return [...code.matchAll(CALL)].map((m) => m[1]);
}

// Every .js file under tests/, except the snippet machinery itself.
function testFiles(dir = TESTS) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') out.push(...testFiles(p));
    } else if (e.name.endsWith('.js') && !SELF.includes(p)) out.push(p);
  }
  return out.sort();
}

// id -> the first file (relative to tests/) that asks for it.
function idsUsedByTests(files = testFiles()) {
  const used = new Map();
  for (const f of files) {
    for (const id of idsInSource(fs.readFileSync(f, 'utf8'), f)) {
      if (!used.has(id)) used.set(id, path.relative(TESTS, f));
    }
  }
  return used;
}

module.exports = { idsInSource, idsUsedByTests, testFiles };
