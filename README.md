# Rhylthyme Documentation

Documentation for the Rhylthyme project, built with [Zensical](https://zensical.org) from `mkdocs.yml`, with
the Material look (`theme.variant: classic`) and the overrides in `overrides/`.

**Live site**: https://rhylthyme.github.io/rhylthyme-docs/

## Building Locally

```bash
pip install -r requirements.txt
zensical serve
# Open http://127.0.0.1:8000
```

`zensical serve` leaves out the page dates. To see them, as CI builds the site:

```bash
python tools/page_dates.py
zensical serve -f mkdocs.dates.yml
```

## Adding a live example

A "Try it live" button opens an editor with a program and its live timeline
over the page. Each button has one example file,
`docs/playground/examples/<id>.json` (`<id>`: lowercase letters, digits and
dashes):

```json
{
  "title": "A gap between steps",
  "try": [
    {
      "say": "Change \"bufferSeconds\" from 60 to 600: the gap grows to ten minutes.",
      "path": ["tracks", 0, "steps", 1, "startTrigger", "bufferSeconds"],
      "value": 600
    },
    { "say": "Press the play button and watch the gap pass." }
  ],
  "program": { "programId": "…", "schemaVersion": "0.3.0-alpha", "tracks": [] }
}
```

- `title`: the overlay's heading (40 characters at most).
- `try`: one to three suggestions, shown under "Try". `say` is the text (120
  characters at most). A suggestion that changes the program also has `path`
  (keys and array indexes into `program`) and `value` (what goes there);
  the two come together, and at least one suggestion must have them. An
  index one past the end of an array appends `value` to it. The tests apply
  each one and check that the program stays valid and that the panel shows
  a difference.
- `program`: a valid Rhylthyme program with no warnings and no resource
  conflicts, short enough to read in the editor (70 lines at most when
  pretty-printed).

Then add the id to `EXAMPLE_IDS` in `tests/playground/lib/examples.js` and
put the button on its own line in the page, with blank lines around it:

```html
<button class="rt-try" data-example="<id>">Try it live</button>
```

Several buttons under one table go in one `<p class="rt-try-row">`, one
button per line; only there a button reads `Try it live: <label>`, with a
short label (unique in its row) that says which example it opens.
`tests/playground/pages.test.js` checks both forms.

The overlay is a bundle that is built, not committed. Build it before
serving the site, and run the tests:

```bash
npm ci
npm run build:playground    # writes docs/javascripts/playground.bundle.js
zensical serve
npm test                    # see tests/README.md, "Live examples"
```

## Structure

```
docs/
├── index.md                    # Homepage
├── installation.md             # Installation guide
├── quick-start.md              # Quick start guide
├── environment-guide.md        # Environment usage guide
├── examples.md                 # Examples
├── api/
│   ├── cli.md                  # CLI commands reference
│   ├── schema.md               # Program schema reference
│   └── environment-schema.md   # Environment schema reference
└── development/
    ├── architecture.md         # Architecture overview
    └── contributing.md         # Contributing guide
```

## Deployment

Pushes to `main` auto-deploy via GitHub Actions. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Related Repositories

- [rhylthyme-spec](https://github.com/rhylthyme/rhylthyme-spec) - Schema definitions
- [rhylthyme](https://github.com/rhylthyme/rhylthyme) - Core library, CLI and execution
- [rhylthyme-server](https://github.com/rhylthyme/rhylthyme-server) - Web visualization and MCP
- [rhylthyme-importers](https://github.com/rhylthyme/rhylthyme-importers) - Import plugins
- [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) - Examples
