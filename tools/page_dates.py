"""Write mkdocs.dates.yml: mkdocs.yml plus each page's git dates.

Zensical has no git-revision-date-localized plugin, so CI runs this before
`zensical build -f mkdocs.dates.yml`, and overrides/partials/source-file.html
shows the dates ("Last update", "Created") under each page as the plugin did.
A plain `zensical build` works too, without the dates.
"""

import json
import pathlib
import subprocess
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"


def url(path):
    """docs/a/b.md -> a/b/, docs/a/index.md -> a/, docs/index.md -> ''."""
    parts = list(path.relative_to(DOCS).with_suffix("").parts)
    if parts[-1] == "index":
        parts.pop()
    return "/".join(parts) + "/" if parts else ""


def fmt(ts):
    d = datetime.fromtimestamp(ts, timezone.utc)
    day = f"{d:%B} {d.day}, {d.year}"
    return {"date": day, "title": f"{day} {d:%H:%M:%S} UTC"}


def dates(path):
    log = subprocess.run(
        ["git", "log", "--follow", "--format=%at", "--", str(path)],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout.split()
    if not log:  # not committed yet
        return None
    return {"updated": fmt(int(log[0])), "created": fmt(int(log[-1]))}


pages = {}
for path in sorted(DOCS.rglob("*.md")):
    found = dates(path)
    if found:
        pages[url(path)] = found

# JSON is valid YAML, and needs no PyYAML here
config = "INHERIT: mkdocs.yml\nextra:\n  page_dates: %s\n" % json.dumps(pages)
(ROOT / "mkdocs.dates.yml").write_text(config, encoding="utf-8")
print("dates for %d pages" % len(pages))
