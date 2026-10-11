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

Every fenced code block in the pages listed in `tests/snippets.config` has
an HTML comment right before it (blank lines in between are fine):

```markdown
<!-- snippet: player-html -->
```

```markdown
<!-- snippet: skip — pseudo-code, calls functions the reader writes -->
```

- `<!-- snippet: <id> -->`: a test in `tests/snippets/` runs this block. It
  gets the code with `snippet('<id>')` (from `tests/snippets/lib/docs.js`),
  so the page is the only copy. Ids are lowercase letters, digits and
  dashes, unique across the configured pages.
- `<!-- snippet: skip — <reason> -->`: the block is illustrative. The
  reason is required.

`tests/snippets/coverage.test.js` fails on an unmarked block, a marker not
in front of a block, a duplicate id, an id no test file calls
`snippet('<id>')` with, and a `snippet('<id>')` with no marked block. The
markers are comments, so the site does not show them;
`site-markers.test.js` checks a `site/` built by `mkdocs build`.

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
| `MKDOCS_SITE_DIR=dir` | Where `site-markers.test.js` looks for the built site (default `site/`). |

React 18 and 19 are installed side by side as the aliases `react18`,
`react-dom18`, `react19` and `react-dom19` (hence `legacy-peer-deps` in
`.npmrc`); `react.test.js` bundles the documented component with esbuild
once per version.
