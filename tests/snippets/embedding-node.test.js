'use strict';
// docs/development/embedding.md: the Node snippets, against the installed
// @rhylthyme/timeline (the pinned version from npm, or the tarball).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { snippet } = require('./lib/docs');
const { projectDir, run } = require('./lib/node');

test('static-chart-node: renderTimelineSvg writes the SVG of the program the docs fetch', { timeout: 60000 }, async () => {
  const s = snippet('static-chart-node');
  const input = /readFileSync\('([^']+\.json)'/.exec(s.code)[1];
  const output = /writeFileSync\('([^']+\.svg)'/.exec(s.code)[1];
  // the same example program the live player snippet loads
  const url = /src="(https:[^"]+\/[^"/]+\.json)"/.exec(snippet('player-html').code)[1];
  assert.equal(path.basename(url), input, 'the Node snippet reads the program the player snippet loads');
  const dir = projectDir();
  const res = await fetch(url);
  assert.equal(res.status, 200, url);
  fs.writeFileSync(path.join(dir, input), await res.text());
  fs.writeFileSync(path.join(dir, 'render.js'), s.code);
  run('node', ['render.js'], dir);
  const svg = fs.readFileSync(path.join(dir, output), 'utf8');
  assert.match(svg, /^<svg[\s>]/);
  assert.ok(svg.length > 1000, `${svg.length} bytes`);
  assert.ok((svg.match(/<rect/g) || []).length > 10, 'the SVG has bars');
});

test('schedule-esm-import: the import works in an ES module', () => {
  const s = snippet('schedule-esm-import');
  const names = /import\s*\{([^}]+)\}/.exec(s.code)[1].split(',').map((n) => n.trim());
  const dir = projectDir();
  fs.writeFileSync(path.join(dir, 'check.mjs'), s.code + `\nconsole.log(JSON.stringify({ ${names.join(', ')} }, (k, v) => (k ? typeof v : v)));\n`);
  const types = JSON.parse(run('node', ['check.mjs'], dir));
  for (const n of names) assert.equal(types[n], 'function', n);
});

test('finding-codes-explain: every error a program gets is explained from findingCodes', () => {
  const s = snippet('finding-codes-explain');
  // An invalid program for the snippet's free variable: a task with no
  // resource constraint, and an indefinite step without defaultSeconds.
  const program = {
    schemaVersion: '0.3.0-alpha', programId: 'p', name: 'p', resourceConstraints: [],
    tracks: [{ trackId: 't', name: 'T', steps: [
      { stepId: 'a', name: 'A', task: 'oven', startTrigger: { type: 'programStart' }, duration: { type: 'fixed', seconds: 60 } },
      { stepId: 'b', name: 'B', startTrigger: { type: 'afterStep', stepId: 'a' }, duration: { type: 'indefinite' } },
    ] }],
  };
  const dir = projectDir();
  fs.writeFileSync(path.join(dir, 'explain.mjs'), `const program = ${JSON.stringify(program)};\n` + s.code);
  const out = run('node', ['explain.mjs'], dir);
  const blocks = out.trim().split(/\n(?=\S)/);
  assert.ok(blocks.length >= 2, out);
  for (const b of blocks) {
    const [head, explanation, fix] = b.split('\n');
    assert.match(head, /^[A-Za-z_]+: \S/, b);
    assert.ok(explanation && explanation.trim().length > 20 && explanation.trim() !== 'undefined', 'explanation from findingCodes: ' + b);
    assert.match(fix, /^  fix: \S/, b);
  }
  assert.ok(blocks.some((b) => b.startsWith('task_not_constrained:')), out);
});

test('prose: the inline `import { ... } from \'@rhylthyme/timeline\'` works', () => {
  // Inline code in the Static chart section, not a fenced block.
  const page = fs.readFileSync(path.join(__dirname, '..', '..', snippet('static-chart-node').page), 'utf8');
  const imports = [...page.matchAll(/`(import \{[^}]+\} from '@rhylthyme\/timeline[^']*';?)`/g)].map((m) => m[1]);
  assert.ok(imports.length > 0, 'the page shows an inline import');
  const dir = projectDir();
  for (const imp of imports) {
    const names = /\{([^}]+)\}/.exec(imp)[1].split(',').map((n) => n.trim());
    fs.writeFileSync(path.join(dir, 'inline.mjs'), `${imp.replace(/;?$/, ';')}\nconsole.log(${names.map((n) => `typeof ${n}`).join(', ')});\n`);
    assert.equal(run('node', ['inline.mjs'], dir).trim(), names.map(() => 'function').join(' '), imp);
  }
});
