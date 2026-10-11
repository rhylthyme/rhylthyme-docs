'use strict';
// Reads the docs pages listed in tests/snippets.config and pulls out their
// fenced code blocks with the snippet marker in front of each. Tests get the
// code with snippet(id), so the docs are the only copy of every snippet.
//
//   <!-- snippet: <id> -->              the block is run by a test that calls snippet('<id>')
//   <!-- snippet: skip — <reason> -->   the block is illustrative; the reason is required
//
// The marker is the last non-blank line before the opening fence. Fences
// inside blockquotes count too (the marker may be inside or before the quote).

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const CONFIG = path.join(ROOT, 'tests', 'snippets.config');

const MARKER = /^<!--\s*snippet:\s*(.*?)\s*-->$/;
const ID = /^[a-z0-9][a-z0-9-]*$/;
// "skip", then an em or en dash, or a hyphen with space on both sides, then
// the reason. "skip-list" is an id, not a skip.
const SKIP = /^skip(?:(?:\s*[—–]\s*|\s+-+\s+)(\S.*))?$/;
const QUOTE = /^ {0,3}> ?/;

function configPages() {
  return fs
    .readFileSync(CONFIG, 'utf8')
    .split('\n')
    .map((l) => l.replace(/#.*/, '').trim())
    .filter(Boolean);
}

// Parse a marker's text. Returns { kind: 'id', id } | { kind: 'skip', reason } | { error }.
function parseMarker(text) {
  const skip = SKIP.exec(text);
  if (skip) {
    if (!skip[1]) return { error: `"skip" needs a reason: <!-- snippet: skip — <reason> -->` };
    return { kind: 'skip', reason: skip[1] };
  }
  if (!ID.test(text)) return { error: `"${text}" is not a snippet id (lowercase letters, digits and dashes)` };
  return { kind: 'id', id: text };
}

// Strips up to `max` blockquote markers ("> ") off the front of a line.
function unquote(line, max = Infinity) {
  let depth = 0;
  while (depth < max && QUOTE.test(line)) {
    line = line.replace(QUOTE, '');
    depth++;
  }
  return { text: line, depth };
}

// Every fenced block of a page, with its marker, and every marker that is not
// in front of a block.
function parsePage(rel) {
  return parseText(rel, fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

function parseText(rel, text) {
  const raw = text.split('\n');
  const lines = raw.map((l) => unquote(l).text);
  const blocks = [];
  const orphanMarkers = [];
  let lastNonBlank = -1; // index of the last non-blank line outside a fence
  for (let i = 0; i < lines.length; i++) {
    const open = /^(\s*)(`{3,}|~{3,})\s*([\w+-]*)/.exec(lines[i]);
    if (!open) {
      if (lines[i].trim()) {
        if (lastNonBlank >= 0 && MARKER.test(lines[lastNonBlank].trim())) {
          orphanMarkers.push({ page: rel, line: lastNonBlank + 1, text: lines[lastNonBlank].trim() });
        }
        lastNonBlank = i;
      }
      continue;
    }
    const [, indent, fence, lang] = open;
    // Lines inside the fence lose only the quote markers the opening fence had,
    // so a code line starting with ">" keeps it.
    const depth = unquote(raw[i]).depth;
    const inner = (k) => unquote(raw[k], depth).text;
    const close = new RegExp(`^\\s*${fence[0] === '`' ? '`' : '~'}{${fence.length},}\\s*$`);
    let j = i + 1;
    while (j < lines.length && !close.test(inner(j))) j++;
    const code = raw
      .slice(i + 1, j)
      .map((_, k) => inner(i + 1 + k))
      .map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l.trimStart()))
      .join('\n');
    const prev = lastNonBlank >= 0 ? lines[lastNonBlank].trim() : '';
    const m = MARKER.exec(prev);
    blocks.push({
      page: rel,
      line: i + 1,
      lang,
      code: code + '\n',
      marker: m ? parseMarker(m[1]) : null,
    });
    lastNonBlank = -1; // a marker before this block does not carry over to the next
    i = j;
  }
  if (lastNonBlank >= 0 && MARKER.test(lines[lastNonBlank].trim())) {
    orphanMarkers.push({ page: rel, line: lastNonBlank + 1, text: lines[lastNonBlank].trim() });
  }
  return { blocks, orphanMarkers };
}

let cache;
function allBlocks() {
  if (!cache) {
    cache = { blocks: [], orphanMarkers: [] };
    for (const page of configPages()) {
      const p = parsePage(page);
      cache.blocks.push(...p.blocks);
      cache.orphanMarkers.push(...p.orphanMarkers);
    }
  }
  return cache;
}

// The code block marked <!-- snippet: id -->, as { code, lang, page, line }.
function snippet(id) {
  const found = allBlocks().blocks.filter((b) => b.marker && b.marker.id === id);
  if (found.length !== 1) {
    throw new Error(
      found.length
        ? `snippet "${id}" is marked ${found.length} times (${found.map((b) => `${b.page}:${b.line}`).join(', ')})`
        : `no code block is marked <!-- snippet: ${id} --> in the pages of tests/snippets.config`,
    );
  }
  return found[0];
}

// The @rhylthyme/timeline version the docs pin: every "@rhylthyme/timeline@<version>"
// in the configured pages (CDN URLs, npm install lines) must agree.
function pinnedVersion() {
  const seen = new Map();
  for (const page of configPages()) {
    const text = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const m of text.matchAll(/@rhylthyme\/timeline@(\d[^\s/'"`)<>]*)/g)) {
      if (!seen.has(m[1])) seen.set(m[1], page);
    }
  }
  if (seen.size !== 1) {
    throw new Error(
      seen.size
        ? `the docs pin more than one @rhylthyme/timeline version: ${[...seen].map(([v, p]) => `${v} (${p})`).join(', ')}`
        : 'no page in tests/snippets.config pins @rhylthyme/timeline@<version>',
    );
  }
  return [...seen.keys()][0];
}

module.exports = { ROOT, configPages, parsePage, parseText, parseMarker, allBlocks, snippet, pinnedVersion };
