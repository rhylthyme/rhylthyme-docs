# Documentation Deployment

The docs are built with Zensical (reading `mkdocs.yml`) and deployed to GitHub Pages.

## Local Development

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

## Build

```bash
python tools/page_dates.py
zensical build --strict -f mkdocs.dates.yml
# Output in site/
```

## Deployment

Pushes to `main` automatically build and deploy via GitHub Actions (`.github/workflows/deploy.yml`).

The site is published at: https://rhylthyme.github.io/rhylthyme-docs/

### Manual Deploy

Zensical has no `gh-deploy`: push to `main` to deploy.

### GitHub Pages Setup

1. Go to repository Settings > Pages
2. Set Source to "Deploy from a branch"
3. Set Branch to `gh-pages` / `/ (root)`
4. Enable HTTPS
