// "Try it live": the overlay with the program editor (CodeMirror) on the left
// and the live <rhylthyme-timeline> player on the right. Bundle entry for
// `npm run build:playground`; sets window.RhylthymePlayground.

import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { json } from '@codemirror/lang-json';
import { linter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';
import '@rhylthyme/timeline'; // the engine, before the element
import '@rhylthyme/timeline/element';
import { validateProgram, analyzeSchedule } from '@rhylthyme/timeline/schedule';
import { checkProgram } from './check.js';
import { firstJsonError } from './json-line.js';

const DEBOUNCE_MS = 300;
const COPIED_MS = 1500;
const SCHEME_ATTR = 'data-md-color-scheme';
const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable]:not([contenteditable="false"])';

const TEMPLATE = `
  <div class="rt-pg-header">
    <h2 class="rt-pg-title" id="rt-pg-title"></h2>
    <div class="rt-pg-actions">
      <button type="button" class="rt-pg-btn rt-pg-reset">Reset</button>
      <button type="button" class="rt-pg-btn rt-pg-copy">Copy link</button>
      <button type="button" class="rt-pg-btn rt-pg-close" aria-label="Close">✕</button>
    </div>
    <label class="rt-pg-linkbox" hidden>
      <span>Copy this link:</span>
      <input type="text" readonly spellcheck="false">
    </label>
  </div>
  <div class="rt-pg-main">
    <div class="rt-pg-editor"></div>
    <div class="rt-pg-preview">
      <p class="rt-pg-stale-note">Showing the last working version</p>
      <rhylthyme-timeline class="rt-pg-player" mode="player" time-format="minutes"></rhylthyme-timeline>
    </div>
  </div>
  <div class="rt-pg-footer">
    <div class="rt-pg-status" role="status" aria-live="polite"></div>
    <div class="rt-pg-try">
      <h3 class="rt-pg-try-label">Try</h3>
      <ul></ul>
    </div>
  </div>`;

const layout = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '&.cm-focused': { outline: '2px solid var(--rt-pg-focus)', outlineOffset: '-2px' },
  '.cm-scroller': {
    fontFamily: 'var(--md-code-font-family, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)',
    lineHeight: '1.55',
  },
});

const lightTheme = EditorView.theme(
  {
    '&': { color: 'var(--rt-pg-code-fg)', backgroundColor: 'var(--rt-pg-code-bg)' },
    '.cm-gutters': { color: 'var(--rt-pg-muted)', backgroundColor: 'var(--rt-pg-code-bg)', borderRight: '1px solid var(--rt-pg-border)' },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'var(--rt-pg-accent-wash)' },
    '.cm-cursor': { borderLeftColor: 'var(--rt-pg-fg)' },
  },
  { dark: false },
);

const themeSlot = new Compartment();

let ui = null; // the dialog's elements, built on the first open
let view = null;
let current = null; // { id, pageUrl, returnFocus, text }
let timer = 0;
let editSeq = 0;
let openSeq = 0;
let schemeWatcher = null;
let copiedTimer = 0;

function isDark() {
  return document.body.getAttribute(SCHEME_ATTR) === 'slate';
}

function build() {
  if (ui) return;
  const root = document.createElement('div');
  root.id = 'rt-playground';
  root.hidden = true;
  root.tabIndex = -1;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'rt-pg-title');
  root.innerHTML = TEMPLATE;
  document.body.appendChild(root);
  const $ = (s) => root.querySelector(s);
  ui = {
    root,
    title: $('.rt-pg-title'),
    copy: $('.rt-pg-copy'),
    linkbox: $('.rt-pg-linkbox'),
    linkInput: $('.rt-pg-linkbox input'),
    preview: $('.rt-pg-preview'),
    player: $('.rt-pg-player'),
    status: $('.rt-pg-status'),
    tryBox: $('.rt-pg-try'),
    tryList: $('.rt-pg-try ul'),
  };
  view = new EditorView({ parent: $('.rt-pg-editor') });
  $('.rt-pg-reset').addEventListener('click', reset);
  ui.copy.addEventListener('click', copyLink);
  $('.rt-pg-close').addEventListener('click', close);
  root.addEventListener('keydown', onKeydown);
}

// ---- editor --------------------------------------------------------------

function jsonLint(v) {
  const text = v.state.doc.toString();
  const error = firstJsonError(text);
  if (!error) return [];
  // At least one character, so the editor underlines it.
  let { from, to } = error;
  if (to <= from && text.length) {
    if (from >= text.length) from = text.length - 1;
    to = from + 1;
  }
  return [{ from, to, severity: 'error', message: 'Not valid JSON' }];
}

function extensions() {
  return [
    basicSetup,
    json(),
    linter(jsonLint, { delay: DEBOUNCE_MS }),
    layout,
    themeSlot.of(isDark() ? oneDark : lightTheme),
    EditorView.contentAttributes.of({ 'aria-label': 'Program JSON' }),
    EditorView.updateListener.of((u) => {
      if (u.docChanged) scheduleCheck();
    }),
  ];
}

function replaceText(text) {
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
}

// ---- edit pipeline -------------------------------------------------------

function scheduleCheck() {
  clearTimeout(timer);
  const mine = ++editSeq;
  timer = setTimeout(() => {
    if (mine === editSeq) check();
  }, DEBOUNCE_MS);
}

function checkNow() {
  clearTimeout(timer);
  editSeq++;
  check();
}

// Parse → validate → if valid, give the program to the player. Otherwise the
// player keeps the last valid program, dimmed.
function check() {
  const text = view.state.doc.toString();
  const error = firstJsonError(text);
  if (error) return showStatus('syntax', [{ kind: 'error', text: `Line ${error.line}: not valid JSON` }]);
  let program;
  try {
    program = JSON.parse(text);
  } catch (e) {
    return showStatus('syntax', [{ kind: 'error', text: 'Not valid JSON: ' + e.message }]);
  }
  try {
    const result = checkProgram(program, { validateProgram, analyzeSchedule });
    if (result.state === 'valid') ui.player.program = program;
    showStatus(result.state, result.lines);
  } catch (e) {
    showStatus('invalid', [{ kind: 'error', text: e.message }]);
  }
}

function showStatus(state, lines) {
  ui.status.dataset.state = state;
  ui.status.replaceChildren(
    ...lines.map((l) => {
      const row = document.createElement('div');
      row.className = 'rt-pg-line';
      row.dataset.kind = l.kind;
      row.textContent = l.text;
      if (l.fix) {
        const fix = document.createElement('span');
        fix.className = 'rt-pg-fix';
        fix.textContent = l.fix;
        row.appendChild(fix);
      }
      return row;
    }),
  );
  ui.preview.classList.toggle('rt-pg-stale', state !== 'valid');
}

// ---- header actions ------------------------------------------------------

function reset() {
  hideLinkbox();
  replaceText(current.text);
  checkNow();
}

function shareLink() {
  const url = new URL(current.pageUrl || location.href, location.href);
  url.searchParams.set('try', current.id);
  url.hash = '';
  return url.href;
}

async function copyLink() {
  const link = shareLink();
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    // No clipboard (insecure page, denied permission): show the link to copy by hand.
    ui.linkInput.value = link;
    ui.linkbox.hidden = false;
    ui.linkInput.focus();
    ui.linkInput.select();
    return;
  }
  hideLinkbox();
  ui.copy.textContent = 'Copied ✓';
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (ui.copy.textContent = 'Copy link'), COPIED_MS);
}

function hideLinkbox() {
  ui.linkbox.hidden = true;
}

// ---- scheme, keyboard ----------------------------------------------------

function applyScheme() {
  const dark = isDark();
  ui.player.setAttribute('theme', dark ? 'dark' : 'light');
  view.dispatch({ effects: themeSlot.reconfigure(dark ? oneDark : lightTheme) });
}

// Focusable elements in document order, into open shadow roots (the player's
// buttons live in its shadow root).
function inTabOrder(el) {
  // Chrome reports tabIndex -1 for a contenteditable without a tabindex
  // attribute (the editor's content), though Tab reaches it.
  const tabIndexOk = el.tabIndex >= 0 || (el.isContentEditable && !el.hasAttribute('tabindex'));
  return el.matches(FOCUSABLE) && tabIndexOk && !el.disabled && el.getClientRects().length > 0;
}

function tabbables(node, out = []) {
  for (const el of node.children) {
    if (inTabOrder(el)) out.push(el);
    if (el.shadowRoot) tabbables(el.shadowRoot, out);
    tabbables(el, out);
  }
  return out;
}

function deepActiveElement() {
  let el = document.activeElement;
  while (el && el.shadowRoot && el.shadowRoot.activeElement) el = el.shadowRoot.activeElement;
  return el;
}

function onKeydown(e) {
  // The dialog is modal: the site's own shortcuts (search on "/", "s" or
  // Ctrl/Cmd+K, next/previous page) listen on window and must not act
  // behind it.
  e.stopPropagation();
  if (e.key === 'Escape') {
    // CodeMirror marks the Escape it used (closing a tooltip or panel) as handled.
    if (!e.defaultPrevented) {
      e.preventDefault();
      close();
    }
    return;
  }
  if (e.key !== 'Tab') return;
  const items = tabbables(ui.root);
  if (!items.length) return;
  const i = items.indexOf(deepActiveElement());
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && i <= 0) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (i === -1 || i === items.length - 1)) {
    e.preventDefault();
    first.focus();
  }
}

// ---- API -----------------------------------------------------------------

function isOpen() {
  return !!ui && !ui.root.hidden;
}

async function open({ id, exampleUrl, pageUrl, returnFocus }) {
  const mine = ++openSeq;
  const res = await fetch(exampleUrl);
  if (!res.ok) throw new Error(`Could not load ${exampleUrl} (HTTP ${res.status})`);
  const example = JSON.parse(await res.text());
  if (mine !== openSeq) return; // a later open() won
  build();
  current = { id, pageUrl, returnFocus, text: JSON.stringify(example.program, null, 2) };
  ui.title.textContent = example.title;
  const suggestions = example.try || [];
  ui.tryList.replaceChildren(
    ...suggestions.map((s) => {
      const li = document.createElement('li');
      li.textContent = s.say;
      return li;
    }),
  );
  ui.tryBox.hidden = suggestions.length === 0;
  hideLinkbox();
  clearTimeout(timer);
  view.setState(EditorState.create({ doc: current.text, extensions: extensions() }));
  checkNow();
  if (!isOpen()) {
    ui.root.hidden = false;
    document.documentElement.classList.add('rt-pg-open');
    schemeWatcher = new MutationObserver(applyScheme);
    schemeWatcher.observe(document.body, { attributes: true, attributeFilter: [SCHEME_ATTR] });
  }
  applyScheme();
  view.focus();
}

function close() {
  if (!isOpen()) return;
  openSeq++;
  clearTimeout(timer);
  editSeq++;
  schemeWatcher.disconnect();
  schemeWatcher = null;
  if (ui.player.status === 'running') ui.player.pause();
  ui.root.hidden = true;
  document.documentElement.classList.remove('rt-pg-open');
  const back = current.returnFocus;
  if (back && back.isConnected) back.focus({ preventScroll: true });
}

function getText() {
  return view ? view.state.doc.toString() : '';
}

// As if typed: the change goes through the debounce.
function setText(text) {
  replaceText(text);
}

window.RhylthymePlayground = { open, close, isOpen, getText, setText };
