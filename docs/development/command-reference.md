# Command Reference

## `rhylthyme generate [REQUEST...]`

Turns a natural-language request into a program and a live timeline using
the hosted MCP server's `import_text` and `visualize_schedule` tools.
Requires `rhylthyme login` (or `RHYLTHYME_TOKEN`).

**Options:**
- `-e, --env`: `generic` (default), `kitchen`, `lab`, `events` or `gym`
- `--by TEXT`: when everything must be finished, e.g. `19:00`
- `--with TEXT`: equipment and people limits, e.g. `one oven, two cooks`
- `-f, --file PATH`: read the request or source text from a file (`-` for stdin)
- `-o, --output PATH`: save the program JSON
- `--run`: run the program in the terminal UI afterwards
- `--open`: open the live timeline in a browser
- `--no-publish`: build the program only
- `--json`: print `{url, program, ...}` as JSON
- `-q, --quiet`: print only the URL

Environment: `RHYLTHYME_TOKEN` (access token, overrides the stored session),
`RHYLTHYME_MCP_URL` (default `https://mcp.rhylthyme.com/mcp`),
`RHYLTHYME_SITE_URL` (default `https://www.rhylthyme.com`).

## `rhylthyme mcp-test`

Smoke-tests a Rhylthyme MCP server and exits 1 if any check fails. By
default it runs the read-only checks against all five hosted endpoints
(`/mcp`, `/kitchen/mcp`, `/lab/mcp`, `/events/mcp`, `/gym/mcp`):

| Check | What it proves |
|---|---|
| `initialize` | server name, protocol version, tools/resources/prompts capabilities, instructions |
| `tools` | core tools and the endpoint's one-shot tools are listed, each with a description and schema |
| `validate-good` / `validate-bad` | a valid program passes (including a `type: "compound"` trigger); a dangling step reference is rejected with a fix hint |
| `analyze` | makespan, critical path and wall-clock itinerary for a known program |
| `resources` / `prompts` | schema and guides are readable, a bundled example validates, `plan_schedule` substitutes its arguments |
| `json-accept` | clients that do not accept SSE (`*/*`, `application/json`) get JSON, not 406 |
| `bad-requests` | unknown method gives -32601, unknown tool gives an error, never a 5xx |
| `login-gate` | account tools refuse without a token and point at `login` |
| `catalog` | public search returns entries that load with a URL (empty catalog = warning) |
| `publish` (`--publish`) | `visualize_schedule` returns a URL on the right site; the page and PNG load |
| `generate` (`--generate`) | the model-backed `import_text` returns a program that validates (needs `login`) |

```bash
rhylthyme mcp-test                         # everything read-only
rhylthyme mcp-test -e lab --publish        # one endpoint, plus a real share
rhylthyme mcp-test -k catalog -k tools     # only some checks
rhylthyme mcp-test --url http://localhost:3000/mcp -e generic
rhylthyme mcp-test --json --strict         # cron / CI: warnings fail too
```

Requests carry `mcp-test` in the User-Agent so the hosted server logs the
errors these checks provoke without alerting anyone. The same suite is
importable (`rhylthyme.cli.remote.checks.run_suite`), and
`RHYLTHYME_MCP_LIVE=1 pytest tests/test_mcp_checks.py` runs it live.

## `rhylthyme login` / `logout` / `whoami`

`login` opens the rhylthyme.com sign-in page and receives the session on a
one-shot listener bound to `127.0.0.1`; `--token TOKEN` stores a pasted
access token instead and `--no-browser` only prints the URL. `whoami`
shows the stored account and expiry; `logout` deletes the stored session.

## `rhylthyme validate`

Validates program files against the schema.

**Options:**
- `--schema PATH`: Path to schema file (default: built-in schema)
- `--verbose, -v`: Show detailed validation information

## `rhylthyme run`

Runs programs with interactive terminal UI.

**Options:**
- `--schema PATH`: Path to schema file (default: built-in schema)
- `-e, --environment TEXT`: Environment ID to use
- `--time-scale FLOAT`: Time scale factor (default: 1.0)
- `--validate / --no-validate`: Validate before running (default: True)
- `--auto-start`: Automatically start without manual trigger

## `rhylthyme analyze`

Total length, critical path, what gates each link of it, resource conflicts
and tracks that finish early. No sign-in; nothing is published.

**Options:**
- `--finish-at TEXT`: when everything must be finished (`19:00`, `7:30pm` or ISO 8601); prints local clock times per step
- `--start-at TEXT`: when the program starts; ignored with `--finish-at`
- `--strict`: exit non-zero when there are resource conflicts
- `--json`: the full analysis

## `rhylthyme publish`

Publishes a program (a file, an http(s) URL, or `-` for standard input) as a
live timeline and prints its URL. No sign-in.
A published timeline is reachable by anyone who has the link.

**Options:**
- `-e, --env`: `generic`, `kitchen`, `lab`, `events`, `gym` (default: from `environmentType`)
- `-q, --quiet`: print only the URL
- `--json`: `url`, `shareId`, `imageUrl`, `makespanSeconds`, `warnings`
- `--image PATH`: also save a PNG of the timeline
- `--open`: open it in a browser

## `rhylthyme import`

Imports a recipe, protocol or slide deck as a program, validates it, and
writes `<programId>.json`. Needs `rhylthyme-importers` (included in
`pip install rhylthyme`).

```bash
rhylthyme import https://www.seriouseats.com/the-best-chili-recipe   # any of ~580 recipe sites
rhylthyme import 52772 -i themealdb --publish                        # a TheMealDB id, straight to a live timeline
rhylthyme import https://www.protocols.io/view/western-blot-...      # needs PROTOCOLS_IO_TOKEN
rhylthyme import https://raw.githubusercontent.com/Opentrons/Protocols/develop/protocols/007992/rna_isolation.ot2.apiv2.py   # an Opentrons protocol
rhylthyme import "Neapolitan Pizza.cook" -i cooklang
rhylthyme importers                                                  # what is installed
rhylthyme search "pad thai" -i spoonacular                           # then import a hit's URL
```

**Options:** `-i IMPORTER` (default: chosen from the URL), `-o PATH`,
`--stdout`, `--publish` (and `--open`), `--no-validate`, `--review`. `-` reads
pasted source from stdin (with `-i`).

`--review` sends the import and its source to a model on the server (GPT-5.6
Luna, the model that related steps best in the paper's evaluation) and prints
what looks wrong: a default duration on "simmer until thick", a step the
parser dropped, steps chained that the source runs in parallel, a total that
disagrees with the source. It needs `rhylthyme login`, spends one model call
(capped per day), and changes nothing: the findings are yours to apply. On
rhylthyme.com the same review runs automatically after every import when you
are signed in.

## `rhylthyme render`

Draws a program as an SVG, PNG or PDF figure through the `rhylthyme-timeline`
package (included in `pip install rhylthyme`; needs Node.js 18+). Every
option of `rhylthyme-render` is accepted: `rhylthyme render --help`.

```bash
rhylthyme render dinner.json -o dinner.png --style web --palette vivid --color-by task
rhylthyme render blot.json -o figure.pdf --style publication --legend right
```

## `rhylthyme plan`

An older stagger heuristic. It reads the pre-0.2 program format and leaves
programs written with `stepId` and `task` unchanged; use `analyze` to find
contention and edit the triggers.

**Options:**
- `--verbose, -v`: Show detailed planning information

## `rhylthyme environments`

Lists available environment catalogs.

**Options:**
- `--format, -f`: Output format (table, json, yaml)

## `rhylthyme validate-environments`

Validates environment catalog files.

**Options:**
- `--environments-dir PATH`: Directory containing environment files
- `--verbose, -v`: Show detailed validation information

## `rhylthyme environment-info`

Shows information about a specific environment type.

## `rhylthyme eval-prompts`

Scores agent-authored programs against the expert gold set. See
[Evaluating prompts](evaluating-prompts.md) for the full flag list.
