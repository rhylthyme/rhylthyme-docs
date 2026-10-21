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
