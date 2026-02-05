# Documentation Deployment

The docs are built with MkDocs + Material theme and deployed to GitHub Pages.

## Local Development

```bash
pip install -r requirements.txt
mkdocs serve
# Open http://127.0.0.1:8000
```

## Build

```bash
mkdocs build
# Output in site/
```

## Deployment

Pushes to `main` automatically build and deploy via GitHub Actions (`.github/workflows/deploy.yml`).

The site is published at: https://rhylthyme.github.io/rhylthyme-docs/

### Manual Deploy

```bash
mkdocs gh-deploy
```

### GitHub Pages Setup

1. Go to repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Set Branch to `gh-pages` / `/ (root)`
4. Enable HTTPS
