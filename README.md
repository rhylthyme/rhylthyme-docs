# Rhylthyme Documentation

Documentation for the Rhylthyme project, built with MkDocs and the Material theme.

**Live site**: https://rhylthyme.github.io/rhylthyme-docs/

## Building Locally

```bash
pip install -r requirements.txt
mkdocs serve
# Open http://127.0.0.1:8000
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
- [rhylthyme-cli-runner](https://github.com/rhylthyme/rhylthyme-cli-runner) - CLI and execution
- [rhylthyme-web](https://github.com/rhylthyme/rhylthyme-web) - Web visualization and MCP
- [rhylthyme-importers](https://github.com/rhylthyme/rhylthyme-importers) - Import plugins
- [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) - Examples
