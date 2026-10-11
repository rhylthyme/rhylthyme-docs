'use strict';
// The snippet machinery itself: marker parsing, fence detection and which
// snippet('<id>') calls count as run.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseMarker, parseText } = require('./lib/docs');
const { idsInSource, idsUsedByTests, testFiles } = require('./lib/coverage');

const F = '```';
// Fixture sources spell the call through S, so this file asks for no ids itself.
const S = ['snip', 'pet'].join('');

test('parseMarker: ids and skips', () => {
  assert.deepEqual(parseMarker('player-html'), { kind: 'id', id: 'player-html' });
  assert.deepEqual(parseMarker('skip-list-example'), { kind: 'id', id: 'skip-list-example' }, 'an id starting with skip-');
  for (const t of ['skip—pseudo-code', 'skip — pseudo-code', 'skip – pseudo-code', 'skip - pseudo-code', 'skip -- pseudo-code']) {
    assert.deepEqual(parseMarker(t), { kind: 'skip', reason: 'pseudo-code' }, t);
  }
  assert.match(parseMarker('skip').error, /needs a reason/);
  assert.match(parseMarker('skip -x').error, /not a snippet id/);
  assert.match(parseMarker('Player').error, /not a snippet id/);
});

test('parseText: fences in blockquotes are blocks, with the marker inside or before the quote', () => {
  const md = [
    '> Example:',
    '>',
    `> ${F}js`,
    '> undefinedFunction();',
    `> ${F}`,
    '',
    '> <!-- snippet: inside -->',
    `> ${F}js`,
    '> a();',
    `> ${F}`,
    '',
    '<!-- snippet: before -->',
    `> ${F}js`,
    '> b();',
    `> ${F}`,
    '',
    '> > <!-- snippet: nested -->',
    `> > ${F}sh`,
    '> > > prompt',
    `> > ${F}`,
  ].join('\n');
  const { blocks, orphanMarkers } = parseText('page.md', md);
  assert.deepEqual(orphanMarkers, []);
  assert.deepEqual(
    blocks.map((b) => [b.line, b.marker && (b.marker.id || b.marker.error), b.code]),
    [
      [3, null, 'undefinedFunction();\n'],
      [8, 'inside', 'a();\n'],
      [13, 'before', 'b();\n'],
      [18, 'nested', '> prompt\n'],
    ],
  );
});

test('parseText: a ">" line inside an unquoted fence is code, and does not close it', () => {
  const md = ['<!-- snippet: shell -->', `${F}sh`, '> echo hi', `> ${F}`, 'still code', F, 'after'].join('\n');
  const { blocks } = parseText('page.md', md);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].code, `> echo hi\n> ${F}\nstill code\n`);
});

test('idsInSource: only calls in code that runs count', () => {
  const src = `'use strict';
const { snippet } = require('./lib/docs');
// TODO: ${S}('in-line-comment')
/* ${S}('in-block-comment') */
/*! ${S}('in-legal-comment') */
function neverCalled() { return ${S}('unused-helper'); }
const alsoNever = () => ${S}('unused-arrow');
if (false) ${S}('dead-branch');
const text = "${S}('in-a-string')";
function helper() { return ${S}(\`via-helper\`); }
test('t', () => { ${S}('direct'); helper(); });
module.exports = { exported: () => ${S}("exported") };
`;
  assert.deepEqual(idsInSource(src).sort(), ['direct', 'exported', 'via-helper']);
});

test('idsUsedByTests: reads every .js file under tests/, not only tests/snippets/', () => {
  const files = testFiles().map((f) => path.relative(path.join(__dirname, '..'), f));
  assert.ok(files.includes(path.join('snippets', 'machinery.test.js')));
  assert.ok(!files.includes(path.join('snippets', 'coverage.test.js')));
  assert.ok(!files.some((f) => f.includes('node_modules')));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-coverage-'));
  const outside = path.join(dir, 'outside.test.js');
  fs.writeFileSync(outside, `require('node:test').test('x', () => { ${S}('from-outside'); });\n`);
  assert.equal(idsUsedByTests([outside]).get('from-outside'), path.relative(path.join(__dirname, '..'), outside));
});
