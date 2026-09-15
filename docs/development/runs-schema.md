# Runs Schema Reference

A **run record** is what a runtime writes when a program has been executed: the timings the program *planned* for every step, frozen at the moment the run started, beside the timings that *actually* happened. Records are separate documents (`runs_schema_0.1.0-alpha.json` in `rhylthyme-spec`, `get_runs_schema_path()`), never stored inside the program, so history can accumulate without rewriting the plan.

The CLI runner writes one record per `rhylthyme run` to `~/.rhylthyme/runs/<programId>/<runId>.json` (see [CLI Commands](cli.md#runs)).

The web player (`<rhylthyme-timeline>`) writes the same document. It emits a `rt-run-record` event — `detail: {record, outcome}`, and `element.runRecord` returns the last one — once per run: on completion (`completed`), on `stop()` (`aborted`) and when the element is removed or its program replaced mid-run (`abandoned`). A signed-in visitor's record is `POST`ed to `/api/mcp/programs/<program UUID>/runs` and stored in `program_runs` with owner-only RLS; an anonymous visitor's record stays in `localStorage['rhylthyme_runs']` (newest 20) until they sign in. See [Account](../web-app/account.md#runs) for the user-facing view and [MCP Server](../web-app/mcp.md#list_runs) for `list_runs` / `load_run`.

## Conventions

- **Seconds from start.** Every time inside `steps` (`planned.start`, `actual.end`, `triggerFiredAt`, ...) is a number of seconds from `startedAt`, not a timestamp. At `runtime.speed` 1 these are wall-clock seconds; at other speeds they are program-clock seconds (what the plan is expressed in).
- **`planned` is frozen at run start.** It is computed once, from the program as loaded, by the same timing resolver the validator uses (`calculate_step_start_time` after replicate expansion). Editing the program afterwards does not change existing records; `programVersion` says which program the plan came from.
- **Every step appears**, whether or not it ran. A step that never started has no `actual`; a step still running when the run ended has `actual.start` but no `actual.end` and no `endedBy`.
- **Replicates are expanded.** A replicated step appears once per instance with the authored `stepId` and a 1-based `instance`; the runtime id is `<stepId>-r<instance>`. Non-replicated steps have `instance: 1`.

## Root fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | string | No | `0.1.0-alpha` |
| `runId` | string | Yes | `<UTC start, ISO 8601 to the second>-<4 hex>`, e.g. `2026-09-11T16:02:11Z-8f3a` |
| `programId` | string | Yes | `programId` of the program that was run |
| `programVersion` | string | Yes | `sha256:<hex>` of the program's canonical JSON (see below) |
| `runtime` | object | Yes | `{kind, version, clockMode, speed}` — see [Runtime](#runtime) |
| `environmentId` | string or null | No | Environment id or file the run used |
| `startedAt` | date-time | Yes | UTC instant the program clock started; the origin for every step time |
| `endedAt` | date-time | No | UTC instant the record was written |
| `outcome` | enum | Yes | `completed` (every step ended), `aborted` (at least one step aborted), `abandoned` (the run ended before every step had ended: `q`, Ctrl-C, crash) |
| `context` | object | No | Copy of `program.metadata` plus `environmentType`, `sourceUrl`, `actors`, [`userTags`](#usertags) (answers to the program's declared variance factors) and [`offsetsUse`](#predicted-offsets) |
| `steps` | array | Yes | One [step record](#step-records) per expanded step, in program order |

### Runtime

| Field | Values | Meaning |
|-------|--------|---------|
| `kind` | `cli`, `web` | Which runtime wrote the record |
| `version` | string | Runtime package version |
| `clockMode` | `wall`, `simulated` | `wall`: actuals measured against the wall clock (scaled by `speed`); `simulated`: the runtime's own clock, which may drift |
| `speed` | number > 0 | Time-scale factor. Only runs at speed 1 measure the executor rather than the timer; if the speed was changed during a run the highest value is recorded |

### programVersion

`programVersion` identifies the exact program JSON that was run. It is `sha256:` followed by the hex SHA-256 of the canonical serialisation:

- object keys sorted by Unicode code point,
- no whitespace (`,` and `:` separators only),
- UTF-8, non-ASCII characters left unescaped,
- integral numbers written without a fractional part (`1.0` → `1`).

Python: `rhylthyme_cli_runner.history.program_version(program)`. JavaScript: `rhylthyme-timeline/tools/hash-program.js`. Both reproduce `rhylthyme-timeline/test/fixtures/hash-parity.json` over the example corpus. The hash is taken over the program as authored (before replicate expansion or environment overrides).

### userTags

`context.userTags` holds the executor's answers to the program's declared
[`metadata.varianceFactors`](schema.md#program-metadata-metadatavariancefactors)
— the facts about *this* run that plausibly explain how long it took:

```json
"context": {
  "serves": "8",
  "environmentType": "kitchen",
  "actors": 2,
  "userTags": { "turkeyKg": 6.4, "oven": "gas" }
}
```

Keys are the declared factor keys; values are strings, numbers, booleans or
null. Every answer is optional, so a key the executor skipped is simply absent
— `userTags` is `{}` for a program that declares no factors and for a run whose
executor skipped them all. Nothing else goes in: an answer for a key the
program does not declare is dropped, so `userTags` stays a closed vocabulary
that calibration and prediction can condition on.

The CLI runner asks before the interactive UI starts; `--factor KEY=VALUE`,
`RHYLTHYME_FACTORS` and `--no-factor-prompt` cover headless runs. `serves`,
`actors` and `environmentId` are available for conditioning on every run,
whether or not any factor was declared.

## Step records

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stepId` | string | Yes | Authored step id, without any replicate suffix |
| `instance` | integer ≥ 1 | No | Replicate index; `1` for plain steps |
| `planned` | object | Yes | `{start, end, durationType, seconds?, minSeconds?, maxSeconds?, defaultSeconds?}` — frozen at run start. `end` is `start + seconds` for fixed steps and `start + defaultSeconds` for variable and indefinite ones |
| `actual` | object | No | `{start, end?}` — absent if the step never started |
| `endedBy` | enum | When `actual.end` is present | `executor` (a person ended it: manual trigger, `t`/`c` keys), `timer` (its planned duration expired), `trigger` (another step's event ended it; reserved), `abort` |
| `triggerFiredAt` | number | No | When the step's start trigger was first satisfied. `actual.start − triggerFiredAt` is time spent waiting for resources or actors. The CLI runner observes triggers once per update tick, so this can lag the true instant by up to one tick |
| `waitedOn` | array of string | No | Runtime ids (replicate suffix included) of the `afterStep` / `afterStepWithBuffer` predecessors that gated the start |
| `pausedSeconds` | number ≥ 0 | No | Wall-clock seconds the program clock was paused (`p`) while this step was running. Calibration discards steps with pauses |
| `notes` | string | No | Free text entered by the executor; stripped before any public contribution |
| `predictedAnchorSeconds` | number ≥ 0 | No | On a step with a **negative** `offsetSeconds`: the predicted duration used to project its anchor's end instead of the anchor's authored `defaultSeconds` — see [Predicted offsets](#predicted-offsets) |

`endedBy` is the field that makes history useful: for variable and indefinite steps only `executor` endings say how long the work really took, whereas `timer` endings only confirm that the timer worked.

## Example

```json
{
  "schemaVersion": "0.1.0-alpha",
  "runId": "2026-09-11T16:02:11Z-8f3a",
  "programId": "thanksgiving-one-oven",
  "programVersion": "sha256:5e0f…",
  "runtime": { "kind": "cli", "version": "0.1.0a0", "clockMode": "wall", "speed": 1 },
  "environmentId": null,
  "startedAt": "2026-09-11T16:02:11.000Z",
  "endedAt": "2026-09-11T20:14:40.412Z",
  "outcome": "completed",
  "context": { "serves": "8", "environmentType": "kitchen", "actors": 2, "userTags": {} },
  "steps": [
    {
      "stepId": "turkey-prep", "instance": 1,
      "planned": { "start": 0, "end": 1200, "durationType": "fixed", "seconds": 1200 },
      "actual": { "start": 0.0, "end": 1200.1 },
      "endedBy": "timer", "triggerFiredAt": 0.0, "pausedSeconds": 0
    },
    {
      "stepId": "turkey-roast", "instance": 1,
      "planned": { "start": 1200, "end": 11100, "durationType": "indefinite", "defaultSeconds": 9900 },
      "actual": { "start": 1200.2, "end": 12610.7 },
      "endedBy": "executor", "triggerFiredAt": 1200.2,
      "waitedOn": ["turkey-prep"], "pausedSeconds": 0
    }
  ]
}
```

## Usable runs

Most of what a run record contains is not a measurement of how long the work
takes, and pooling it with what is would poison every statistic computed from
it. One filter decides, implemented once in Python
(`rhylthyme_cli_runner.history.usable`) and once in JavaScript
(`rhylthyme-server/mcp-api/history.js`), with a parity fixture
(`rhylthyme-cli-runner/tests/fixtures/history/usable-cases.json`) asserted by
both test suites.

A **run** is usable when

- `outcome == "completed"` — a run that was abandoned or aborted stopped for a
  reason that is not about how long the work takes,
- `runtime.clockMode == "wall"` — a simulated clock may have drifted,
- `runtime.speed == 1` — a scaled run measures the timer, not the executor.

Within a usable run a **step** is usable when

- it started and ended (`actual.start` and `actual.end` are both present),
- `pausedSeconds == 0` — a pause while the step was running makes its observed
  length meaningless,
- `endedBy == "executor"` — a person decided it was done.

The last condition is why **`fixed` steps are never measured**: a fixed step
ends when its timer expires, so its observed duration only confirms the timer.
Tools that want fixed steps anyway — for lag analysis, the one thing history
can say about a fixed duration — ask for them explicitly
(`usable_steps(record, include_fixed=True)` /
`usableSteps(record, {includeFixed: true})`), which keeps timer- and
executor-ended fixed steps and still rejects paused and unfinished ones.

Both implementations return a reason per rejected run and step, from a shared
value-free vocabulary: `outcome-not-completed`, `clock-not-wall`, `speed-not-1`,
`no-actual`, `not-ended`, `paused`, `fixed-duration`, `ended-by-timer`,
`ended-by-trigger`, `ended-by-abort`, `ended-by-none`.

```python
from rhylthyme_cli_runner.history import is_usable_run, usable_steps

usable, reason = is_usable_run(record)          # (True, None) when usable
for step, reason in usable_steps(record):       # reason is None when measured
    ...
```

## Reporting

`rhylthyme runs report` answers the question Badosa's method depends on: *is
this history inferential?* — is the spread of a step's observed durations small
enough, relative to the durations themselves, that a forecast can beat the
author's guess?

```
rhylthyme runs report PROGRAM [--runs-dir DIR] [--since DATE]
                      [--min-runs K] [--cv-threshold X]
                      [--format table|md|json] [--out FILE]
rhylthyme runs report --all [...]
```

`PROGRAM` is a programId or a path to a program file; a file also supplies each
step's `task`, which is what the roll-up by step type groups on. Only usable
runs and usable steps are counted, and replicate instances are pooled under
their authored `stepId`.

Per step the report gives `n`, the planned duration, the observed median, P10,
P90, IQR and mean, the **coefficient of variation** (sample standard deviation
over the mean) and the mean signed deviation from the planned value — noise and
bias separately — plus a verdict:

| Verdict | Rule | Meaning |
|---------|------|---------|
| `predictable` | n ≥ k and CV ≤ the threshold | The same step under the same conditions takes a similar time; history beats the guess |
| `executor-controlled` | n ≥ k and CV > the threshold | The person, not the process, decides how long this takes. Don't predict it |
| `insufficient` | n < k | Not enough measured runs for a verdict yet |
| `lag` | the step is `fixed` | No verdict: a fixed step's observed duration only confirms its timer |

`k` defaults to 5 (`--min-runs`) and the CV threshold to 0.25
(`--cv-threshold`), because both are guesses that the observation window is
meant to inform.

A `fixed` step gets a **lag** instead of a verdict: how much longer than its
planned duration it really took, measured at the moment its successor was
released — `successor.triggerFiredAt − (actual.start + planned duration)`,
falling back to the step's own `actual.end` when nothing waited on it alone.
The anchor is the step's *actual* start, so the lag is the step's own overrun
rather than the accumulated drift of everything upstream; the JSON output also
carries `endDriftSeconds`, the same figure anchored on the planned start, for
callers that want the drift. A fixed step that always overruns is usually a step
that should have been `variable`.

Below the per-step table come roll-ups by task and by duration kind (steps,
measurements, median CV, and the verdict counts), and one program-level line:
the fraction of steps with a verdict that came back `predictable`. `--format
json` emits the whole structure, including per-step counts of why measurements
were dropped, for the committed observation-window report.

## Calibration

Where the report answers *should we predict this step?*,
[`rhylthyme calibrate`](cli.md#calibrate) answers *what number should the plan
say?* — it turns the same measurements into a duration **proposal**.

**Calibration never writes.** `propose_calibration` is a pure function of a
program and its records; the author's acceptance is a separate step that returns
a new program. Nothing in the pipeline silently rewrites a plan from history.

The rules, over the usable measurements of the usable runs, per authored
`stepId` (replicate instances pooled):

| Duration kind | Proposed |
|---------------|----------|
| `variable` | `defaultSeconds` ← median; `minSeconds`/`maxSeconds` ← P10/P90, **widened** |
| `indefinite` | `defaultSeconds` ← median only (a range only on request) |
| `fixed` | nothing — a lag, and possibly a `consider variable` note |

- **The median, not the mean.** A run that was abandoned halfway and restarted,
  or a step someone forgot to close, moves a mean and not a median.
- **Never narrow.** The proposed range is P10/P90 extended until it contains the
  author's `minSeconds`, `maxSeconds` and `optimalSeconds`, and the new default.
  The lower bound is rounded down and the upper bound up, so rounding cannot
  narrow it either. An author who wrote a deliberately generous range keeps it;
  history can only widen.
- **`k` measurements or nothing.** Below `k` (default 5, `--min-runs`) the step
  is skipped with the reason `insufficient-runs` — the statistics are still
  reported, but no value is proposed.
- **No predictability gate.** A step the report calls `executor-controlled` is
  still proposed: its median beats a number the author invented. The verdict
  travels in the evidence so a UI can warn rather than silently accept.
- **Fixed steps get a note, never a value.** When a fixed step's
  [lag](#reporting) exceeds 10 % of its planned duration (floored at 60 s) it is
  flagged `consider variable`, carrying the lag. Changing `fixed` to `variable`
  is a modelling decision, so only the author makes it.
- **Steps only in history** (renamed or deleted since the runs) are reported with
  the reason `not-in-program` and never proposed.

Per step the proposal carries the evidence a decision needs: `n`, the median,
the P10/P90 pair, the IQR, the author's current values, the proposed values, the
signed delta, and the report's verdict. The proposal as a whole carries the
**effect if accepted** — the planned makespan and critical path before and
after, plus the start/end shift of every step that moves.

Accepted values are written with a
[`calibratedFrom`](schema.md#duration-provenance-calibratedfrom) block beside
them, recording `runs`, `asOf` and the `programVersion` the measurements were
taken against.

```python
from rhylthyme_cli_runner.history import (
    list_runs, propose_calibration, apply_calibration,
)

records = list_runs("./runs", "thanksgiving-one-oven")
proposal = propose_calibration(program, records, k=5)      # reads only
proposal.to_dict()                                         # JSON-serialisable
calibrated = apply_calibration(program, proposal, "all")   # a new program
```

## Prediction

`analyze_schedule` can report what a program's own history says each step
will take, beside what the program claims. The lookup reads only these
fields of a record, which is worth knowing when deciding what a runtime
must capture:

| field | used for |
|---|---|
| `outcome`, `runtime.clockMode`, `runtime.speed` | the usable-run filter — an unusable run is invisible to prediction |
| `programId` | records of another program are ignored |
| `programVersion` | the identical-context match, when the caller says which version it is planning |
| `environmentId` | the identical-context match |
| `context.userTags` | the identical-context match (every declared factor key must agree), and the model's predictor columns |
| `context.serves`, `context.actors` | implicit predictor columns, so a program that declares no variance factors can still be conditioned on scale |
| `context.userId` | whose run it is, so one person's own history can be preferred over everyone's |
| `steps[].stepId` | the authored id predictions are keyed by — replicate instances pool onto it |
| `steps[].planned.durationType` | `fixed` steps are never predicted |
| `steps[].actual.start`, `steps[].actual.end` | the measurement itself |
| `steps[].endedBy`, `steps[].pausedSeconds` | the step half of the usable filter |

`notes`, `triggerFiredAt` and `waitedOn` are not read by prediction:
`triggerFiredAt` and `waitedOn` serve the replay and lag analysis, and
`notes` are never machine-read at all.

**`context.userId` is an extension, not a schema field.** The run record
is a closed object (`additionalProperties: false`), so the owner of a run
lives in `context`, which is deliberately open. A record with
`context.userId` still validates. The lookup also accepts a `userId` or
`user_id` beside the record, which is the shape the web API returns from
the `program_runs` table, so rows do not have to be rewritten to be
predicted from.

**Factor values are compared by meaning, not by spelling.** Numbers
compare numerically (`6.4` matches `"6.4"`), everything else compares
case-insensitively after trimming, and a factor left unanswered matches
only another unanswered one. A factor that is missing from any
measurement in a sample is dropped from the model rather than imputed:
an imputed zero would be a measurement the history does not contain.

See [the MCP `analyze_schedule` prediction
inputs](../web-app/mcp.md) for `history`, `predictionContext`,
`useDurations` and the shape of the `predicted` object, and
[Architecture](architecture.md#execution-history-and-duration-prediction)
for the lookup order and where the code lives.

## Validating a record

```python
from rhylthyme_cli_runner.history import validate_run
errors = validate_run(record)   # [] when valid
```

or directly with `jsonschema` and `rhylthyme_spec.get_runs_schema_path()`.

## Predicted offsets

A run that used a predicted duration says so, in two places. Both are
optional and absent from a run that used the plan.

| field | meaning |
|---|---|
| `context.offsetsUse` | `"planned"` or `"predicted"`, copied from the program's [`metadata.offsetsUse`](schema.md#predicted-offsets-metadataoffsetsuse) when the run started |
| `steps[].predictedAnchorSeconds` | On a step whose start trigger carries a **negative** `offsetSeconds`: the predicted duration, in seconds, that was used to project its anchor step's end instead of the anchor's authored `defaultSeconds` |

`predictedAnchorSeconds` sits on the **gated** step, not on the anchor,
because it is a property of that trigger's resolution: the same anchor can
gate two steps, and it is the trigger that either used the prediction or did
not. Its absence in a run whose `context.offsetsUse` is `"predicted"` means
the prediction did not qualify — no prediction existed for the anchor, or its
interval was no narrower than the authored `defaultSeconds` — so the author's
number was used after all.

The `planned` block is **not** affected. It is frozen from the authored
durations at run start, whatever the offsets were resolved against, so a
planned-vs-actual comparison of a predicted run is still a comparison against
what the program said. That is what makes `runs evaluate` possible: the record
contains both numbers.

```json
{
  "context": { "serves": "8", "userTags": { "turkeyKg": 7 }, "offsetsUse": "predicted" },
  "steps": [
    {
      "stepId": "potatoes-peel",
      "planned": { "start": 8400, "end": 9300, "durationType": "fixed", "seconds": 900 },
      "predictedAnchorSeconds": 7500,
      "actual": { "start": 5700, "end": 6600 },
      "endedBy": "timer",
      "triggerFiredAt": 5700
    }
  ]
}
```

Here the roast's authored `defaultSeconds` was 9900 and the prediction was
7500, so the peel fired 2700 s before the *predicted* end (at 5700) rather
than 2700 s before the *planned* end (at 8400).

## Held-out evaluation

`rhylthyme runs evaluate` answers the question the whole feature turns on:
**is a prediction from history closer to what happens than the number the
author typed?** The method, from a corpus of records of one program:

1. **Filter.** Keep only usable runs (see [Usable runs](#usable-runs)); an
   unusable run measures the timer or the pause, not the executor.
2. **Split chronologically.** Order by `startedAt` and hold out the latest
   20 % (at least one run, never all of them). The split is not random: a
   prediction is a forecast, and training on runs that happened after the run
   being predicted would flatter it.
3. **Predict each held-out run in its own context** — its `context.userTags`,
   its `environmentId`, its `programVersion`, and `context.userId` as its
   owner — from the training runs only. This exercises the
   identical-then-model lookup exactly as it runs at plan time.
4. **Score both estimators on the same observations.** For every measured
   step of a held-out run that has *both* a prediction and a planned value,
   accumulate `|predicted − actual|` and `|planned − actual|`. A measurement
   with no prediction contributes to neither mean — it is counted in the
   `basis` histogram under `none` instead — so the comparison can never be
   flattered by a predictor that quietly declines the hard cases.
5. **Report** the mean absolute error of each, per step and rolled up by step
   type and duration kind, with `improvement = 1 − MAE(predicted) /
   MAE(planned)`.
6. **Cross-reference the verdicts.** The inferentiality verdicts are computed
   on the *training* runs and shown beside each row, but are deliberately not
   fed to the predictor: the point of the table is the contrast between the
   step types the report called `predictable` and those it called
   `executor-controlled`. The acceptance claim — *predicted beats planned on
   every step type with a predictable step* — is read off the predictable rows
   only.

`fixed` steps are never evaluated. Their observed duration only confirms their
own timer, so there is nothing to forecast; what history can say about a fixed
duration is the lag in [Reporting](#reporting).

Committed results: [the synthetic corpus](reports/duration-evaluation-synthetic.md)
(a known generating law, which checks that the measurement itself is sound)
and [the catalog runs](reports/duration-evaluation-catalog.md) (gated on the
observation window).

## Related Documentation

- [CLI Commands](cli.md) — `rhylthyme run --runs-dir`, `rhylthyme runs list`, `rhylthyme runs show`, `rhylthyme runs report`, `rhylthyme runs evaluate`, `rhylthyme calibrate`
- [Program Schema: `metadata.varianceFactors`](schema.md#program-metadata-metadatavariancefactors) — declaring the factors that answer `userTags`
- [Program Schema Reference](schema.md)
- [Core Concepts: Runs](../getting-started/concepts.md#runs)
