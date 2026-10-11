#!/usr/bin/env node
'use strict';
// Writes docs/development/finding-codes.md from the finding-code catalogue
// that @rhylthyme/timeline ships (require('@rhylthyme/timeline/schedule')
// .findingCodes, src/schedule/finding-codes.json in rhylthyme-timeline), so
// the page lists exactly the codes the validator can emit.
//
//   node tools/gen-finding-codes.js          write the page
//   node tools/gen-finding-codes.js --check  exit 1 if the page is stale
//
// The package is found, in order, at:
//   1. $RHYLTHYME_TIMELINE, a rhylthyme-timeline checkout or an installed
//      package directory;
//   2. node_modules (`npm install @rhylthyme/timeline`);
//   3. ../rhylthyme-timeline, a sibling checkout as the monorepo lays it out.
// tests/finding-codes-page.test.js fails when the committed page differs
// from a fresh generation.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGE = path.join(ROOT, 'docs', 'development', 'finding-codes.md');

// { schedule, version, from } for the first package found.
function loadPackage() {
  const tried = [];
  const fromDir = (dir, label) => {
    const pkg = path.join(dir, 'package.json');
    tried.push(`${label}: ${dir}`);
    if (!fs.existsSync(pkg)) return null;
    const { name, version } = JSON.parse(fs.readFileSync(pkg, 'utf8'));
    if (name !== '@rhylthyme/timeline') return null;
    return { schedule: require(path.join(dir, 'src', 'schedule')), version, from: label };
  };
  if (process.env.RHYLTHYME_TIMELINE) {
    const found = fromDir(path.resolve(process.env.RHYLTHYME_TIMELINE), 'RHYLTHYME_TIMELINE');
    if (found) return found;
    throw new Error(`RHYLTHYME_TIMELINE=${process.env.RHYLTHYME_TIMELINE} is not an @rhylthyme/timeline package`);
  }
  try {
    const schedule = require.resolve('@rhylthyme/timeline/schedule', { paths: [ROOT] });
    const { version } = require(require.resolve('@rhylthyme/timeline/package.json', { paths: [ROOT] }));
    return { schedule: require(schedule), version, from: 'node_modules' };
  } catch (e) {
    tried.push('node_modules: @rhylthyme/timeline not installed');
  }
  const sibling = fromDir(path.join(ROOT, '..', 'rhylthyme-timeline'), 'sibling checkout');
  if (sibling) return sibling;
  throw new Error(`@rhylthyme/timeline not found (tried ${tried.join('; ')})`);
}

function loadCatalogue() {
  const pkg = loadPackage();
  const catalogue = pkg.schedule.findingCodes;
  if (!catalogue || !catalogue.codes) {
    throw new Error(`@rhylthyme/timeline ${pkg.version} (${pkg.from}) has no findingCodes export (added in 2.0.0-beta.7: use a build that includes it, or set RHYLTHYME_TIMELINE)`);
  }
  return { catalogue, version: pkg.version };
}

// ---------------------------------------------------------------------

// Codes the hosted MCP server's own validator (rhylthyme-mcp,
// mcp-api/schedule.js) still reports and @rhylthyme/timeline does not: the
// logic-check codes 2.0.0-beta.7 replaced with schema_* findings. The page
// names them so a reader of a hosted finding is not left without an entry;
// tests/finding-codes-page.test.js checks none of them is catalogued. Drop
// this list when the hosted server runs @rhylthyme/timeline's validator.
const HOSTED_ONLY = [
  'missing_program_id', 'missing_name', 'no_tracks', 'bad_track', 'missing_track_id',
  'missing_track_name', 'bad_step', 'missing_step_id', 'missing_step_name',
  'missing_start_trigger', 'bad_duration_type', 'fixed_without_seconds',
  'variable_without_bounds', 'indefinite_without_default', 'choice_too_few_options', 'bad_alert',
];

const code = (s) => '`' + s + '`';
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
// JSON on one line, with a space after each comma and colon.
function flat(v) {
  if (Array.isArray(v)) return `[${v.map(flat).join(', ')}]`;
  if (v && typeof v === 'object') {
    const entries = Object.entries(v);
    return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${flat(x)}`).join(', ')} }` : '{}';
  }
  return JSON.stringify(v);
}

// JSON, indented two spaces, keeping any object or array that fits within
// WIDTH columns (counting what precedes it on its line) on one line.
const WIDTH = 88;
function json(v, indent = '', lead = 0) {
  const one = flat(v);
  if (!v || typeof v !== 'object' || lead + one.length <= WIDTH) return one;
  const inner = indent + '  ';
  if (Array.isArray(v)) return `[\n${v.map((x) => inner + json(x, inner, inner.length)).join(',\n')}\n${indent}]`;
  const lines = Object.entries(v).map(([k, x]) => {
    const head = `${inner}${JSON.stringify(k)}: `;
    return head + json(x, inner, head.length);
  });
  return `{\n${lines.join(',\n')}\n${indent}}`;
}

function pythonCell(py) {
  const strict = py.strict ? `${code(py.strict)} (with ${code('--strict')})` : null;
  if (py.cli === null && py.library === null) return strict ? `${strict} only` : 'no';
  const part = (c, where) => (c === null ? `none (${where})` : `${code(c)} (${where})`);
  const base = py.cli === py.library ? code(py.cli) : `${part(py.cli, 'CLI')}, ${part(py.library, 'library')}`;
  return strict ? `${base}; ${strict}` : base;
}

function pythonLine(py) {
  const sev = py.severity ? `, as ${py.severity === 'error' ? 'an error' : `a ${py.severity}`}` : '';
  let text;
  if (py.cli === null && py.library === null) text = py.strict ? 'Python reports nothing for it by default.' : 'Python reports nothing for it.';
  else if (py.cli === py.library) text = `Python reports ${code(py.cli)}${sev}.`;
  else {
    const part = (c, where) => (c === null ? `${where} reports nothing` : `${where} reports ${code(c)}`);
    text = `${part(py.cli, '`rhylthyme validate`')}${py.cli !== null ? sev : ''}; ${part(py.library, '`validate_program_structured`')}${py.library !== null && py.library !== 'logic_error' ? sev : ''}.`;
  }
  if (py.strict) text += ` ${code('rhylthyme validate --strict')} reports ${code(py.strict)}, as an error.`;
  if (py.requires) text += ` Needs ${py.requires.map(code).join(' / ')}.`;
  if (py.note) text += ` ${py.note}`;
  return text;
}

function exampleBlock(label, ex) {
  const lines = [];
  const how = ex.whole
    ? 'Passed to `validateProgram` as it is:'
    : `Merged over the [base program](#base-program)${ex.omit ? `, without ${ex.omit.map(code).join(', ')}` : ''}:`;
  lines.push(`**${label}.** ${how}`, '', '```json', json(ex.program), '```', '');
  const notes = [];
  if (ex.bigint) notes.push(`${code(ex.bigint.join('.'))} is passed as a JavaScript BigInt, which no JSON text can carry.`);
  if (ex.entry === 'browser') notes.push('Validated with the browser entry before the LabMCP catalogue is registered.');
  if (ex.note && !ex.bigint && ex.entry !== 'browser') notes.push(ex.note);
  if (notes.length) lines.push(notes.join(' '), '');
  return lines;
}

function generate(catalogue, version) {
  const codes = Object.entries(catalogue.codes);
  const out = [];
  out.push(
    '# Finding codes',
    '',
    `<!-- Generated by tools/gen-finding-codes.js from @rhylthyme/timeline ${version}; do not edit. -->`,
    '',
    'Every finding the Rhylthyme validator reports has a `code`, a `message`, a `where` (the step, track or',
    'path it is about) and a `fix`. This page lists every code: what it means, a program that triggers it,',
    'and how to fix it. The codes are those of `validateProgram` in',
    '[`@rhylthyme/timeline/schedule`](embedding.md#5-validate-and-analyze-in-the-browser).',
    '',
    '!!! note "The hosted MCP server"',
    '    The MCP tool [`validate_program`](../web-app/mcp.md#available-tools) and the checks',
    '    `visualize_schedule` runs before it publishes still use the server\'s own copy of the',
    '    validator. It reports many of the codes below, and also these, which this page does not',
    `    list: ${HOSTED_ONLY.slice(0, -1).map(code).join(', ')} and ${code(HOSTED_ONLY[HOSTED_ONLY.length - 1])}.`,
    '    `validateProgram` reports each of those problems as a `schema_*` finding instead (they',
    '    were removed from it in 2.0.0-beta.7).',
    '',
    'Errors make a program invalid; warnings and info notes do not. The **Python** column says what the',
    '`rhylthyme` package\'s validator reports for the same program: `rhylthyme validate --json` (the',
    '**CLI**, which checks the program as written) and `validate_program_structured` (the **library**,',
    'which expands replicates first). It reports schema problems as one `schema_error` and has no code of',
    'its own for many logic checks.',
    '',
    `This page is generated from the catalogue that @rhylthyme/timeline ships (${code('findingCodes')},`,
    `version ${version} here) by ${code('tools/gen-finding-codes.js')}; a test fails when it falls behind.`,
    '',
  );
  // Overview
  out.push('## All codes', '');
  for (const [area, { title }] of Object.entries(catalogue.areas)) {
    const list = codes.filter(([, e]) => e.area === area).map(([c]) => `[${code(c)}](#${c})`);
    out.push(`- **[${title}](#${area})**: ${list.join(', ')}`);
  }
  out.push('', '## Base program {#base-program}', '',
    'Each example below is a fragment: its top-level keys replace those of this valid program, which',
    'has no findings at all.', '', '```json', json(catalogue.baseProgram), '```', '');

  for (const [area, { title, description }] of Object.entries(catalogue.areas)) {
    out.push(`## ${title} {#${area}}`, '', description, '');
    const inArea = codes.filter(([, e]) => e.area === area);
    out.push('| Code | Severity | Summary | Python |', '|---|---|---|---|');
    for (const [c, e] of inArea) {
      out.push(`| [${code(c)}](#${c}) | ${e.severity.join(', ')} | ${cell(e.summary)}${e.reachable === false ? ' (not reachable today)' : ''} | ${cell(pythonCell(e.python))} |`);
    }
    out.push('');
    for (const [c, e] of inArea) {
      out.push(`### ${code(c)} {#${c}}`, '');
      out.push(`**${e.severity.map((s) => s[0].toUpperCase() + s.slice(1)).join(' or ')}.** ${e.summary}`, '');
      out.push(e.explanation, '');
      if (e.reachable === false) {
        out.push('!!! note "Not reachable today"', `    ${e.unreachableBecause}`, '');
      }
      e.examples.forEach((ex, i) => {
        const label = e.examples.length > 1 ? `Example ${i + 1} (${ex.severity})` : 'Example';
        out.push(...exampleBlock(label, ex));
      });
      out.push(`**Fix.** ${e.fix}`, '');
      out.push(`**Python.** ${pythonLine(e.python)}`, '');
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n');
}

module.exports = { loadPackage, loadCatalogue, generate, PAGE, HOSTED_ONLY };

if (require.main === module) {
  const { catalogue, version } = loadCatalogue();
  const page = generate(catalogue, version);
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(PAGE) ? fs.readFileSync(PAGE, 'utf8') : '';
    if (current !== page) {
      console.error(`${path.relative(ROOT, PAGE)} is stale: run node tools/gen-finding-codes.js`);
      process.exit(1);
    }
    console.log(`${path.relative(ROOT, PAGE)} is up to date (@rhylthyme/timeline ${version})`);
  } else {
    fs.writeFileSync(PAGE, page);
    console.log(`wrote ${path.relative(ROOT, PAGE)}: ${Object.keys(catalogue.codes).length} codes from @rhylthyme/timeline ${version}`);
  }
}
