# CLI Commands Reference

## Command Overview

```bash
rhylthyme [OPTIONS] COMMAND [ARGS]...
```

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--environments-dir PATH` | Directory containing environment catalogs | Current directory |
| `--verbose` | Enable verbose output | False |
| `--help` | Show help message | - |

---

## `validate`

Validates one or more program files against the schema.

```bash
rhylthyme validate [OPTIONS] PROGRAM_FILES...
```

**Arguments:**

- `PROGRAM_FILES`: One or more program files to validate

**Options:**

| Option | Description |
|--------|-------------|
| `--schema PATH` | Path to a specific schema file |
| `-e, --environment PATH` | Environment file for resource validation |
| `--verbose, -v` | Verbose validation output |
| `--json, -j` | Output results in JSON format |
| `--strict, -s` | Enable strict validation mode |

**Examples:**

```bash
# Validate a single file
rhylthyme validate program.json

# Validate multiple files
rhylthyme validate programs/*.json

# Validate with verbose JSON output
rhylthyme validate program.json --verbose --json

# Validate with environment resource checking
rhylthyme validate program.json -e environments/kitchen.json

# Strict mode validation
rhylthyme validate program.json --strict
```

---

## `run`

Runs a program with an interactive terminal UI.

```bash
rhylthyme run [OPTIONS] PROGRAM
```

**Arguments:**

- `PROGRAM`: Path to the program file to run

**Options:**

| Option | Description |
|--------|-------------|
| `--schema PATH` | Path to a specific schema file |
| `-e, --environment PATH` | Environment file for resource validation |
| `--time-scale FLOAT` | Time scaling factor |
| `--validate / --no-validate` | Enable/disable pre-run validation |
| `--auto-start` | Automatically start program execution |
| `--runs-dir PATH` | Where to write the run record (default: `$RHYLTHYME_RUNS_DIR` or `~/.rhylthyme/runs`) |
| `--no-record` | Do not write a run record |

**Interactive Controls:**

| Key | Action |
|-----|--------|
| `s` | Start the program (when it is waiting for a manual start) |
| `p` | Pause / resume the program clock (status shows `PAUSED`) |
| `↑` / `↓` (`k` / `j`) | Select a row |
| `g` / `Enter` | Expand or collapse the selected instance group |
| `t` | Trigger the selected step: start a manual step, or end a running variable/indefinite step |
| `c` | Force-complete the selected running step |
| `a` | Abort the selected running step |
| `T` | Trigger menu |
| `+` / `-` | Adjust time scale |
| `o` | Change sort order |
| `q` | Quit the program |

**Replicated steps in the step list:** a step with `replicates` expands into
instances (`bake-r1`, `bake-r2`, `bake-r3`), and the step list shows them as a
single collapsed group row rather than three rows with the same name:

```
  Step ID          Name                 Track      Status   Progress    Remaining
  mix              Mix dough            cookies    DONE     N/A         N/A
  bake ×3        ▸ Bake tray ×3         cookies    RUNNING  [####>    ] 1 done / 1 running / 1 pending
  box              Box cookies          cookies    PENDING  N/A         N/A
  cool ×3        ▸ Cool on rack ×3      cookies    RUNNING  [##>      ] 0 done / 1 running / 2 pending
```

Press `g` (or `Enter`) on a group row to expand it; each instance then appears
indented under it, labelled `[1 of 3]`, `[2 of 3]`, `[3 of 3]`, and can be
selected, triggered, completed or aborted on its own. Press `g` again to
collapse. Instances of an `instances: "each"` chain live in sub-tracks named
after the instance (`cookies--bake-r1`); the Track column shows the parent
track (`cookies`) so the rows line up. A program with no replicated steps looks
exactly as it did before.

**Per-instance triggers:** manual and indefinite steps inside an
`instances: "each"` chain are ended one instance at a time — the executor ends
tray 2's cooling, not "cooling". The trigger list (`t`, or the `T` menu) names
the instance:

```
Available Triggers:
    End: Cool on rack [1 of 3], End: Cool on rack [2 of 3]
```

Ending one instance late really does hold up the work gated behind it: with
`replicates.maxInFlight` the synthetic in-flight trigger fires on the *actual*
end of the leaf step, so a tray that cools slowly delays the next bake, and one
that comes off the rack early lets the next bake start sooner (bounded by
whatever else that step waits on).

**Run records:** every run writes a record of planned vs actual timings when it ends — on completion, on `q`, and on Ctrl-C (outcome `abandoned`). Records go to `~/.rhylthyme/runs/<programId>/<runId>.json` unless `--runs-dir` or `RHYLTHYME_RUNS_DIR` says otherwise; `--no-record` disables this. While paused (`p`) the clock stops and the paused time is attributed to the steps that were running as `pausedSeconds`. See [`runs`](#runs) below and the [Runs Schema Reference](runs-schema.md).

**Examples:**

```bash
# Run a program
rhylthyme run program.json

# Run with environment
rhylthyme run program.json -e environments/kitchen.json

# Run with time scaling and auto-start
rhylthyme run program.json --time-scale 10 --auto-start

# Run without pre-validation
rhylthyme run program.json --no-validate

# Keep run records in a project folder instead of ~/.rhylthyme/runs
rhylthyme run program.json --runs-dir ./runs

# Run without writing a record
rhylthyme run program.json --no-record
```

---

## `runs`

Inspects recorded runs (execution history). Each `rhylthyme run` leaves a record of what was planned and what actually happened; these commands read them.

```bash
rhylthyme runs list [PROGRAM] [--runs-dir DIR] [--json]
rhylthyme runs PROGRAM                 # shorthand for `runs list PROGRAM`
rhylthyme runs show RUN [--runs-dir DIR] [--json]
rhylthyme runs show RUN --svg OUT.svg [--program FILE] [--width PX]
```

**Arguments:**

- `PROGRAM`: a `programId` or the path to a program file. Omit it to list runs of every program.
- `RUN`: a `runId` (or a unique prefix of one) or the path to a record file.

**Options:**

| Option | Description |
|--------|-------------|
| `--runs-dir DIR` | Directory holding run records (default: `$RHYLTHYME_RUNS_DIR` or `~/.rhylthyme/runs`) |
| `--json` | Machine-readable output |
| `--svg OUT` | `runs show` only: also draw the run as a planned-vs-actual timeline and write the SVG to `OUT` |
| `--program FILE` | The program the run executed, for `--svg`. Omit it and the program is located by `programId`, preferring a file whose hash equals the record's `programVersion` |
| `--width PX` | Width of the `--svg` drawing (default 820) |

`runs list` prints runs newest first with the run id, start time, outcome, and the actual makespan against the planned one with a signed deviation:

```
Run                        Started                   Outcome    Actual   Planned  Deviation
-------------------------  ------------------------  ---------  -------  -------  ---------
2026-09-12T10:00:00Z-cccc  2026-09-12T10:00:00.000Z  abandoned  0:07:00  0:06:00  +0:01:00
2026-09-11T10:00:00Z-bbbb  2026-09-11T10:00:00.000Z  completed  0:06:00  0:06:00  0:00:00
```

`runs show` prints the record header and one row per step with planned start/end, actual start/end, the signed deviation of the end (`+` late, `-` early), what ended the step (`executor`, `timer`, `abort`) and any paused time:

```
Step    Type        Planned start  Planned end  Actual start  Actual end  Deviation  Ended by  Paused
------  ----------  -------------  -----------  ------------  ----------  ---------  --------  -------
prep    fixed       0:00:00        0:01:00      0:00:00       0:01:02     +0:00:02   timer     0:00:00
cook    indefinite  0:01:00        0:06:00      0:01:02       0:07:00     +0:01:00   executor  0:00:12
```

### Drawing a run: `--svg`

`runs show RUN --svg overlay.svg` writes the same comparison as a Gantt chart: one bar per step at the time it *actually* ran, with a thin ghost bar underneath it at the time the plan predicted. A bar is outlined green when its end landed within 30 seconds of the plan, blue when it finished early and red when it finished late, so a slip and everything downstream of it are visible at a glance. See [Planned vs actual](../web-app/visualization.md#planned-vs-actual-a-recorded-run) for how to read the drawing.

```bash
# The program is found automatically when its programId matches the record
rhylthyme runs show 2026-09-12T10:00:00Z-cccc --svg thanksgiving.svg

# ...or name it, which is also how to draw a run of a program that has since been edited
rhylthyme runs show 2026-09-12T10:00:00Z-cccc \
  --program programs/thanksgiving_one_oven.json --svg thanksgiving.svg --width 1200
```

The drawing is produced by the JavaScript timeline renderer
(`renderTimelineSvg(program, {run: record})`), the same code the web
visualizer uses, so the CLI and the web app draw a run identically. That
means **Node.js must be on `PATH`**; without it (or without the renderer)
the command explains what is missing and exits non-zero rather than
drawing something different. Set `RHYLTHYME_NODE` to point at a specific
`node`, and `RHYLTHYME_TIMELINE_JS` to point at
`rhylthyme-timeline/src/index.js` or a byte-identical mirror of it
(`rhylthyme-server/static/js/timeline-render.js`). PNG output is not
built in: convert the SVG with `rsvg-convert` or a browser.

**Storage:** `<runs-dir>/<programId>/<runId>.json`, one file per run (colons in the run id are replaced by underscores in the file name). The record format is documented in the [Runs Schema Reference](runs-schema.md).

---

## `plan`

Optimizes a program schedule to reduce resource conflicts.

```bash
rhylthyme plan [OPTIONS] INPUT OUTPUT
```

**Arguments:**

- `INPUT`: Path to the input program file
- `OUTPUT`: Path to save the optimized program file

**Options:**

| Option | Description |
|--------|-------------|
| `-e, --environment PATH` | Environment file for resource constraints |
| `--verbose, -v` | Verbose output |

**Examples:**

```bash
# Optimize a program
rhylthyme plan input.json optimized.json

# Optimize with environment constraints
rhylthyme plan input.json optimized.json -e environments/kitchen.json --verbose
```

---

## `environments`

Lists all available environment catalogs.

```bash
rhylthyme environments [OPTIONS]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--format FORMAT` | Output format (json, yaml, table) | table |

**Examples:**

```bash
rhylthyme environments
rhylthyme environments --format json
rhylthyme environments --format yaml
```

---

## `validate-environments`

Validates all environment catalog files.

```bash
rhylthyme validate-environments [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose` | Verbose validation output |

---

## `environment-info`

Shows information about a specific environment type.

```bash
rhylthyme environment-info TYPE
```

**Arguments:**

- `TYPE`: Environment type (kitchen, laboratory, airport, bakery)

---

## `eval-prompts`

Scores agent-authored programs against the expert gold set in
`rhylthyme-examples/gold/` and prints a per-component table. It has two
modes: `--score-only` compares programs already on disk and makes no model
calls; `--model <id>` runs the prompt live, calling the model once per gold
program (plus a bounded fix loop) and scoring what comes back.

```bash
# offline
rhylthyme eval-prompts --score-only --gold <dir> --predicted <dir> [OPTIONS]

# live
rhylthyme eval-prompts --gold <dir> --model <id> [--patterns baseline] [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--gold PATH` | Gold set directory, e.g. `rhylthyme-examples/gold` (required) |
| `--score-only` | Score predicted programs already on disk; no model calls |
| `--predicted PATH` | Directory of predicted programs, one per gold slug: `<slug>.json` or `<slug>/program.json` (with `--score-only`) |
| `--model ID` | Model id for a live run, e.g. `claude-haiku-4-5-20251001` (required unless `--score-only`); pin it, and re-baseline when it changes |
| `--patterns NAMES` | Comma-separated prompt patterns to run (default `baseline`); `baseline` is the frozen single-message `plan_schedule` prompt, `four-turn` the four messages it sends today (read-back → model check → extraction → relationships). Each pattern writes into its own subdirectory of `--out` when more than one is given |
| `--list-patterns` | Print the registered pattern names and exit |
| `--only SLUGS` | Comma-separated gold slugs to run; applied before `--limit` |
| `--limit N` | Run only the first N gold programs (slug order) |
| `--concurrency N` | Gold programs to run in parallel (default `1`) |
| `--from-cache` | Never call the model: replay cached responses and fail with a `cache miss` error naming the slug and key |
| `--cache-dir PATH` | Where raw responses are cached (default `<out>/cache`) |
| `--max-fix-iterations N` | How many times Python-validator findings are sent back as the next user turn (default `2`; `0` disables the fix loop) |
| `--max-tokens N` | `max_tokens` per model call (default `16000`) |
| `--write-baseline PATH` | Also write `{model, pattern, date, git_note, results}` there (the shape of `rhylthyme-cli-runner/eval/baseline.json`) |
| `--out PATH` | Where `results.json` and `results.md` are written (default `./eval-results`) |
| `--format table\|json` | What to print to stdout (default `table`) |
| `--skip-js` | Do not run the JavaScript validator even if `node` is available |
| `--threshold FLOAT` | Minimum source-span overlap for two steps to match (default `0.5`) |
| `--verbose, -v` | Per-program breakdown after the table |

**Live-mode output files** (under `--out`), besides `results.json` and
`results.md`:

- `responses/<slug>.json` — the full transcript of every call for that
  program: system prompt, messages, reply, tokens, stop reason, cache key.
- `predicted/<slug>.json` — the program the model produced, written even
  when it fails validation so it can be inspected.
- `cache/<sha256>.json` — one file per call, keyed by model, pattern,
  system prompt and message list. Committed for the baseline run, so
  `--from-cache` reproduces the published numbers with no API calls and no
  API key.

**Cost.** Live runs spend real money and print their own token totals plus
an estimated cost (an unpriced model reports `unknown`). Keep exploratory
runs bounded with `--only` or `--limit`, and re-score from the cache rather
than re-running.

**Output files:**

- `results.json` — `meta`, `summary` (mean of every headline metric), and
  one entry per program with the counts behind each metric, the step
  matching, validator errors, makespans and critical paths.
- `results.md` — the same table as Markdown with a bold mean row, plus a
  list of end-to-end failures and why they failed.

A gold program missing from `--predicted` is scored zero and listed, so a
failed run lowers the mean instead of shrinking the sample.

**Metrics** (one row per program, means in the last row):

| Column | Component | Rule | Metric |
|---|---|---|---|
| `steps P/R/F1` | steps | gold and predicted steps match when their source spans overlap by ≥ 0.5 of the shorter span (`metadata.sourceSpan` located in `source.txt`), else when their normalised names or ids are equal; one-to-one, best overlap first | precision / recall / F1 |
| `dur acc` | durations | over matched steps: same kind, and fixed values within 20 % or variable intervals overlapping (indefinite: kind only) | accuracy |
| `res P/R` | resources | `resourceConstraints[].task` names after normalisation | precision / recall |
| `actors` | actors | program `actors` count equal (default 1) | accuracy (1 or 0) |
| `rel P/R/F1` | relationships | each trigger (compound triggers flattened) matches when its owning step and anchor step are matched steps, the type and event are equal, and the offset (including buffer) is within 10 % | precision / recall / F1 |
| `tracks RI` | structure | Rand index between the gold and predicted step-to-track partitions over matched steps | RI |
| `e2e` | end-to-end | passes the Python validator (schema + logic) and, when `node` and `schedule.js` are found, the JS validator; makespan within 10 % of gold; the Python-resolved critical chain shares ≥ 50 % of gold's | pass (1 or 0) |
| `unsupp` | unsupported | predicted steps with no gold match and no locatable span, as a share of predicted steps; excluded from the precision denominators (PRD open question 4) | rate |

Name normalisation lower-cases, strips punctuation and a short stopword
list ("the", "a", "and", "until", ...). Span quotes from predicted programs
are located exactly first, then case- and whitespace-insensitively.

**Example:**

```bash
# Score the gold set against itself (every column should read 1.00)
mkdir -p /tmp/pred && for d in rhylthyme-examples/gold/*/; do
  cp "$d/program.json" "/tmp/pred/$(basename "$d").json"; done
rhylthyme eval-prompts --score-only --gold rhylthyme-examples/gold --predicted /tmp/pred --out /tmp/eval
```

**Example (live):**

```bash
# Six gold programs through today's plan_schedule prompt, then replay the
# same run from the committed cache without calling the API.
rhylthyme eval-prompts --gold rhylthyme-examples/gold \
  --model claude-haiku-4-5-20251001 --patterns baseline \
  --concurrency 3 --cache-dir rhylthyme-cli-runner/eval/cache \
  --write-baseline rhylthyme-cli-runner/eval/baseline.json --out /tmp/eval-live

rhylthyme eval-prompts --gold rhylthyme-examples/gold \
  --model claude-haiku-4-5-20251001 --from-cache \
  --cache-dir rhylthyme-cli-runner/eval/cache --out /tmp/eval-replay
```

The published baseline numbers live in one place,
`rhylthyme-cli-runner/README.md` ("Evaluating prompts"), beside the model
pin and the date.

The Python API behind the command is `rhylthyme_cli_runner.eval`:
`load_gold_set(dir)`, `score_program(gold, predicted) -> ComponentScores`,
`score_set(gold_set, {slug: program}) -> SetResult`, `write_results(result, out_dir)`,
and for live runs `harness.run_harness(gold_set, HarnessConfig(...), client)`
with a client from `eval.llm` (`AnthropicClient`, or `FakeClient` in tests).
A prompt pattern is a `patterns.Pattern`: a `name`, `render(gold) -> list[Turn]`
and `parse(turn_outputs) -> program`. `four-turn`
(`eval/patterns/four_turn.py`) keeps byte-identical Python copies of the
templates in `rhylthyme-server/mcp-api/prompts.js`, checked by a parity
test that extracts the JS exports with `node`; run
`python -m rhylthyme_cli_runner.eval.patterns.four_turn` to check them by
hand. It records the 2/1/0 scores for turns 1 and 2 in `extras`.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RHYLTHYME_ENVIRONMENTS_DIR` | Default directory for environment catalogs | Current directory |
| `RHYLTHYME_RUNS_DIR` | Directory for run records written by `run` and read by `runs` | `~/.rhylthyme/runs` |
| `RHYLTHYME_PROGRAMS_DIR` | Directory searched for the program a run executed, when `runs show --svg` is used without `--program` | (source-checkout example directories) |
| `RHYLTHYME_TIMELINE_JS` | Path to the JavaScript timeline renderer used by `runs show --svg` | (located in a source checkout, then `@rhylthyme/timeline`) |
| `RHYLTHYME_NODE` | Node.js executable used by `runs show --svg` | `node` on `PATH` |

## Related Documentation

- [Installation](installation.md)
- [Program Schema Reference](schema.md)
- [Environment Schema Reference](environment-schema.md)
- [Runs Schema Reference](runs-schema.md)

---

## `calibrate`

Propose durations for a program from its recorded runs, with the evidence, and
write the ones the author accepts.

```
rhylthyme calibrate PROGRAM [--runs-dir DIR] [--runs N] [--since DATE]
                    [--min-runs K] [--low-pct P] [--high-pct P]
                    [--indefinite-range]
                    [--format table|md|json] [--out FILE]
                    [--accept stepId,…|all] [--write PATH | --in-place]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--runs-dir DIR` | Directory holding run records (default: `$RHYLTHYME_RUNS_DIR` or `~/.rhylthyme/runs`) |
| `--runs N` | Use only the newest N runs |
| `--since DATE` | Only runs started on or after `YYYY-MM-DD` (or an ISO date-time) |
| `--min-runs K` | `k`: measurements a step needs before it gets a proposal (default 5) |
| `--low-pct P` / `--high-pct P` | Percentiles proposed as `minSeconds`/`maxSeconds` before widening (default 10 and 90) |
| `--indefinite-range` | Also propose a range for `indefinite` steps, which otherwise get only `defaultSeconds` |
| `--format table\|md\|json` | Output format (default `table`) |
| `--out FILE` | Write the *proposal* to `FILE` instead of stdout |
| `--accept stepId,…` | Accept these steps (comma-separated, repeatable), or `all` |
| `--write PATH` | Write the calibrated *program* to `PATH`; refuses to overwrite `PROGRAM` |
| `--in-place` | Write the calibrated program back over `PROGRAM` |

`PROGRAM` is a path to the program file; its `programId` selects the runs.

**What is proposed.** For every non-`fixed` step with at least `k` usable
measurements (see [Usable runs](runs-schema.md#usable-runs)):

- `defaultSeconds` ← the observed **median**;
- `minSeconds`/`maxSeconds` ← the observed **P10/P90**, *widened* so the
  author's range is never narrowed on either side, and so the range still
  contains the new default;
- an `indefinite` step gets only `defaultSeconds` unless you pass
  `--indefinite-range`.

`fixed` steps are never changed. A fixed step whose **lag** — how much longer
than its planned duration it really took — exceeds 10 % of the duration (floored
at 60 s) is flagged `consider variable` with that lag, because a fixed step that
always overruns is a step the author modelled wrongly. A step with fewer than
`k` measurements is listed as skipped with the reason.

There is no predictability gate: a step that `runs report` calls
`executor-controlled` is still proposed, because its median beats an invented
number, but the verdict is shown in the `Note` column so you can decline it.

**Example:**

```bash
rhylthyme calibrate thanksgiving_one_oven.json --runs-dir ./runs
```

```
Calibration proposal: thanksgiving-one-oven

Runs: 20 usable of 20; k=5, range from P10/P90 widened to the author's
Proposed: 2 step(s); as of 2026-09-14T12:00:00Z

Per step

Step           Type        n   Current                  Proposed                 Median   IQR      Delta     Note
-------------  ----------  --  -----------------------  -----------------------  -------  -------  --------  ---------------------
turkey-roast   indefinite  20  2:45:00                  2:47:15                  2:47:15  1:44:39  +0:02:15  executor-controlled
potatoes-boil  variable    20  0:15:00–0:20:00–0:25:00  0:15:00–0:19:50–0:25:00  0:19:50  0:01:56  -0:00:10  predictable

Effect if accepted: makespan 3:55:00 -> 3:57:15 (+0:02:15); critical path unchanged

Nothing has been written. Accept with --accept turkey-roast,potatoes-boil --write FILE (or --accept all --in-place).
```

(`Current` and `Proposed` read `min–default–max` for a range.)

**Acceptance.** Nothing is written without `--accept`, and `--accept` must say
where the result goes — `--write PATH` or `--in-place`. Accepted durations gain
a `calibratedFrom` block recording how many runs the number came from, when it
was accepted, and the hash of the program the runs were measured against (see
[`calibratedFrom`](schema.md#duration-provenance-calibratedfrom)):

```bash
# Accept everything, into a new file
rhylthyme calibrate program.json --runs-dir ./runs --accept all --write calibrated.json

# Accept one step, in place
rhylthyme calibrate program.json --runs-dir ./runs --accept potatoes-boil --in-place
```

Accepting a step that has no proposed value (a `fixed` step, or one below `k`)
is an error, not a silent no-op.

The Python API behind the command is
`rhylthyme_cli_runner.history.calibrate`:

```python
from rhylthyme_cli_runner.history import (
    propose_calibration, apply_calibration, list_runs,
)

records = list_runs("./runs", "thanksgiving-one-oven")
proposal = propose_calibration(program, records, k=5)   # reads only
payload = proposal.to_dict()                            # JSON-serialisable
calibrated = apply_calibration(program, proposal, "all")  # a new program
```

`propose_calibration` never writes and never mutates; `apply_calibration`
returns a new program and leaves its input untouched. The MCP tool
`calibrate_program` and the web editor's calibrate panel are wrappers over these
two functions.

---

## `runs evaluate`

Hold out the most recent runs of a program, predict them from the earlier
ones, and compare the prediction against the author's planned duration. This
is the measurement that decides whether history is worth using at all.

```
rhylthyme runs evaluate PROGRAM [--runs-dir DIR] [--since DATE]
                        [--holdout 0.2] [--min-runs K]
                        [--verdict-min-runs K] [--cv-threshold X]
                        [--format table|md|json] [--out FILE]
rhylthyme runs evaluate --all ...
```

**Arguments:**

- `PROGRAM`: a `programId` or the path to a program file. A file also supplies
  each step's `task`, which is what the roll-up by step type groups on.

**Options:**

| Option | Description |
|--------|-------------|
| `--all` | Evaluate every program that has runs, instead of one |
| `--runs-dir DIR` | Directory holding run records (default: `$RHYLTHYME_RUNS_DIR` or `~/.rhylthyme/runs`) |
| `--since DATE` | Only runs started on or after `YYYY-MM-DD` |
| `--holdout FLOAT` | Share of the latest runs held out of training (default `0.2`) |
| `--min-runs K` | Usable runs a program needs before it is evaluated at all (default 5) |
| `--verdict-min-runs K` | Measured runs a step needs before `runs report` gives it a verdict (default 5) |
| `--cv-threshold X` | Coefficient of variation at or below which a step counts as predictable (default 0.25) |
| `--format` | `table` (default), `md`, or `json` |
| `--out FILE` | Write to a file instead of stdout |

**How the split works.** Runs are ordered oldest first by `startedAt`, and the
latest `--holdout` share (at least one run, never all of them) is held out;
everything earlier is the training set. The split is chronological on purpose:
a prediction is a forecast, so training on runs that happened *after* the run
being predicted would flatter it. Each held-out run is then predicted **in its
own context** — its `userTags`, its `environmentId`, its `programVersion` and
its owner — so the identical-then-model lookup is exercised exactly as it is
at run time.

**What the columns mean.**

| Column | Meaning |
|--------|---------|
| `n` | Held-out measurements that had *both* a prediction and a planned value; the two MAE columns are over the same sample |
| `Planned` | The author's number (`defaultSeconds`, or the fixed duration) |
| `MAE predicted` | Mean absolute error of the history-based prediction |
| `MAE planned` | Mean absolute error of the author's number |
| `Improvement` | `1 − MAE(predicted) / MAE(planned)`: positive means the forecast won |
| `Basis` | Which lookup branch answered — `i` identical context, `m` model, `n` none |
| `Verdict` | From `runs report` on the *training* runs; a `*` on the step id marks `predictable` |

Only `variable` and `indefinite` steps appear. A `fixed` step's observed
duration only confirms its own timer, so there is nothing to forecast.

The `Claim` line is the acceptance criterion: *predicted beats planned in mean
absolute error for every step type with a predictable step*. It is read off
the predictable rows only, and reports `untested` rather than `holds` when no
predictable step has a held-out measurement.

```bash
# One program, as a Markdown table for a report
rhylthyme runs evaluate programs/thanksgiving_one_oven.json \
  --runs-dir ./runs --format md --out evaluation.md

# Every program, machine-readable
rhylthyme runs evaluate --all --runs-dir ./runs --format json
```

A program with fewer than `--min-runs` usable runs is not evaluated and says
so (`Not evaluated: fewer usable runs than --min-runs`) rather than reporting
a mean absolute error over one observation.

The Python API behind the command is
`rhylthyme_cli_runner.history.evaluate`:

```python
from rhylthyme_cli_runner.history import evaluate_program, list_runs

records = list_runs("./runs", "thanksgiving-one-oven")
result = evaluate_program(records, program, holdout=0.2)
result.claim          # {'stepTypes': [...], 'holds': True, 'failures': []}
result.to_dict()      # JSON-serialisable, every float rounded to 3 decimals
```

The JSON output is stable — key order is sorted and every number is rounded —
so a report can be committed and diffed. Two committed examples:
[the synthetic corpus](reports/duration-evaluation-synthetic.md) and
[the catalog runs](reports/duration-evaluation-catalog.md).

---

## Predicted offsets: `run --history`

A negative offset ("peel the potatoes 45 minutes before the roast is done")
has to be resolved against a *projection* of the anchor step's end, because
nothing can see a future end. Normally the projection is the author's own
number. A program that sets
[`metadata.offsetsUse`](schema.md#predicted-offsets-metadataoffsetsuse) to
`"predicted"` asks the runner to project an **indefinite** anchor from run
history instead.

```
rhylthyme run PROGRAM [--history FILE] [--no-history]
                      [--predict-context KEY=VALUE]...
```

| Option | Description |
|--------|-------------|
| `--history FILE` | Read run records from this file instead of the runs directory. Accepts a single record, a bare list of records, or an object with a `runs` array |
| `--no-history` | Do not read history: the run falls back to the planned durations and says so |
| `--predict-context KEY=VALUE` | Context to predict for (repeatable). Defaults to this run's `--factor` answers, which are also what the record stores in `context.userTags` |

With the flag set, the runner reads history once, before the clock starts,
and freezes the predictions for the whole run:

```
Predicted durations from 20 recorded run(s): 2 of 13 steps have a prediction
(used only for negative offsets on indefinite steps).
```

Nothing else changes: every other trigger, and the plan frozen into the run
record, still come from the authored durations. The record says which numbers
were used — `context.offsetsUse`, and `predictedAnchorSeconds` on each gated
step (see the [Runs Schema Reference](runs-schema.md#predicted-offsets)).

A program without `metadata.offsetsUse` never reads history at all, so these
flags do nothing for it.

```bash
# Predict from the runs directory, for a 7 kg turkey
rhylthyme run programs/thanksgiving_one_oven.json --factor turkeyKg=7

# Predict from a specific corpus, for a context other than the factor answers
rhylthyme run programs/thanksgiving_one_oven.json \
  --history ./corpus.json --predict-context turkeyKg=7 --predict-context oven=gas

# Ignore history even though the program asks for it
rhylthyme run programs/thanksgiving_one_oven.json --no-history
```
