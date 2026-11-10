# Tests

`npm test` runs every `tests/**/*.test.js` with `node --test` (Node 22 or
newer), after `tests/setup.js`. `npm run test:snippets` runs only
`tests/snippets/`.

```bash
npm ci
npx playwright install chromium        # or PLAYWRIGHT_CHANNEL=chrome to use Google Chrome
npm test
```

## Docs snippets

Every fenced code block in the pages listed in `tests/snippets.config`,
including blocks in lists, admonitions and blockquotes, has an HTML comment
right before it (blank lines in between are fine):

```markdown
<!-- snippet: player-html -->
```

```markdown
<!-- snippet: skip — pseudo-code, calls functions the reader writes -->
```

- `<!-- snippet: <id> -->`: a test under `tests/` runs this block. It
  gets the code with `snippet('<id>')` (from `tests/snippets/lib/docs.js`),
  so the page is the only copy. Ids are lowercase letters, digits and
  dashes, unique across the configured pages.
- `<!-- snippet: skip — <reason> -->`: the block is illustrative. The
  reason is required. The separator is an em or en dash, or a hyphen with
  spaces around it; `skip-list` is an id, not a skip.

`tests/snippets/coverage.test.js` fails on an unmarked block, a marker not
in front of a block, a duplicate id, an id no `.js` file under `tests/` calls
`snippet('<id>')` with, and a `snippet('<id>')` with no marked block. A
call counts only in code that can run: `tests/snippets/lib/coverage.js`
runs each file through esbuild first, which drops comments, dead branches
and functions nothing calls. An id built at runtime (`snippet(name)`) is not
seen; write the literal id. The
markers are comments, so the site does not show them;
`site-markers.test.js` checks a `site/` built by `zensical build`.

To cover a new page, add it to `tests/snippets.config`, mark its blocks and
write the tests.

## Which @rhylthyme/timeline

The pages pin one version (`@rhylthyme/timeline@<version>` in the CDN URLs
and install lines; the tests fail if they disagree), and `package.json`
must pin the same one.

| Environment | Effect |
|---|---|
| *(default)* | The browser loads the pinned version from jsDelivr; Node and the React build use `node_modules` (npm). |
| `RHYLTHYME_TIMELINE_TARBALL=path/to/rhylthyme-timeline-X.tgz` | Test an `npm pack` tarball before publishing it: jsDelivr requests for the pinned version are answered from the unpacked tarball, and `tests/setup.js` installs the tarball with `--no-save`. Its version must be the pinned one. Run `npm ci` afterwards to go back. |
| `RHYLTHYME_LIVE_MCP=1` | Also run the curl and fetch snippets against the live `mcp.rhylthyme.com` (CI sets it). They call `validate_program` and `analyze_schedule` only; a snippet that calls `visualize_schedule`, which publishes, fails instead of running. |
| `PLAYWRIGHT_CHANNEL=chrome` | Use the installed Google Chrome instead of Playwright's Chromium. |
| `MKDOCS_SITE_DIR=dir` | Where `site-markers.test.js` and `playground/site.test.js` look for the built site (default `site/`). |

React 18 and 19 are installed side by side as the aliases `react18`,
`react-dom18`, `react19` and `react-dom19` (hence `legacy-peer-deps` in
`.npmrc`); `react.test.js` bundles the documented component with esbuild
once per version.

## The demo

`tests/demo.test.js` plays `docs/demo/potion-night/index.html` (the toy app
linked from the embedding guide) end to end in Chromium against the pinned
package, or the tarball: every station lights, every step is logged once,
the night completes, and the cursed recipe is explained with `findingCodes`.

## Live examples

The "Try it live" buttons (see "Adding a live example" in the top-level
`README.md`) are tested by `tests/playground/`. `npm test` builds the
overlay bundle first (`npm run build:playground`, in `pretest`).

- `examples.test.js`: each example file has the right shape, its program
  is valid with no warnings or conflicts, and each suggestion with a `path`
  keeps it valid and changes what the panel shows.
- `apply.test.js`, `check.test.js`: applying a suggestion, and what the
  status bar says (JSON error line, validator and analyzer messages).
- `pages.test.js`: each page in `PAGE_EXAMPLES` (`lib/examples.js`) has
  its buttons in order, every button in the Markdown has an example and
  every example a button, in the standard markup; the loader and stylesheet
  are in `mkdocs.yml`.
- `loader.test.js`, `panel.test.js`: the loader and the overlay in Chromium
  on a fixture page (`tests/playground/fixture/`).
- `site.test.js`: the built pages in Chromium: each listed page's buttons,
  instant navigation to and away from the page, `?try=<id>` links, the
  overlay above the site's header and its keyboard shortcuts, the page
  behind not scrolling, no errors or failed requests; and that `site/`
  itself holds the bundle, loader, stylesheet and examples. It needs a
  build of the site and is skipped without one (`MKDOCS_SITE_DIR` as for
  `site-markers.test.js`), except in CI (`CI` set), where a missing build
  fails. Otherwise it serves the bundle, loader and stylesheet from `docs/`,
  so a stale copy in `site/` does not matter:

  ```bash
  npm run build:playground
  python tools/page_dates.py
  zensical build --strict -f mkdocs.dates.yml
  npm test
  ```
