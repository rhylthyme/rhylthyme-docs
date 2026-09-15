# Program Schema Reference

Programs are defined in JSON and describe workflows with tracks, steps, timing dependencies, and optional resource requirements.

## Root Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `programId` | string | Yes | Unique identifier for the program |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the program |
| `version` | string | No | Program version |
| `author` | string | No | Program author |
| `created` | string (date-time) | No | Creation timestamp |
| `tracks` | array of Track | Yes | List of tracks (min 1) |
| `environment` | string | No | Environment ID for resource validation |
| `resourceConstraints` | array | No | Resource constraint definitions |
| `metadata` | object | No | Additional metadata |

## Track Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trackId` | string | Yes | Unique identifier for the track |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the track |
| `steps` | array of Step | Yes | List of steps (min 1) |

## Step Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stepId` | string | Yes | Unique identifier for the step |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the step |
| `task` | string | Yes | Task type or description |
| `duration` | Duration | Yes | Duration specification |
| `startTrigger` | StartTrigger | Yes | When this step starts |
| `resources` | array | No | Resource requirements |
| `notes` | string | No | Additional notes |
| `metadata` | object | No | Additional metadata |

## Duration Types

### Fixed Duration

```json
{
  "type": "fixed",
  "seconds": 600
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"fixed"` | Yes | Duration type |
| `seconds` | number (>= 0) | Yes | Duration in seconds |

### Variable Duration

A step with a flexible time range. Auto-completes at `defaultSeconds` unless manually completed earlier (after `minSeconds`). Adding a `triggerName` enables a "Mark Complete" button in the UI.

```json
{
  "type": "variable",
  "minSeconds": 300,
  "maxSeconds": 900,
  "defaultSeconds": 600,
  "optimalSeconds": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"variable"` | Yes | Duration type |
| `minSeconds` | number (>= 0) | Yes | Minimum duration in seconds |
| `maxSeconds` | number (>= 0) | Yes | Maximum duration in seconds |
| `defaultSeconds` | number | No | Default duration in seconds |
| `optimalSeconds` | number | No | Optimal duration in seconds |
| `triggerName` | string | No | When set, shows a manual "Mark Complete" button. The step auto-completes at `defaultSeconds` if not completed manually. |

**Variable with manual completion trigger:**

```json
{
  "type": "variable",
  "minSeconds": 45,
  "maxSeconds": 180,
  "defaultSeconds": 120,
  "triggerName": "monitoring-done"
}
```

### Indefinite Duration

A step that runs until the user manually marks it complete. There is no automatic end time. Use `defaultSeconds` to set the initial display width on the timeline.

```json
{
  "type": "indefinite",
  "defaultSeconds": 120,
  "triggerName": "watching-done"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"indefinite"` | Yes | Duration type |
| `defaultSeconds` | number | Yes | Display duration on timeline and placeholder for planning |
| `triggerName` | string | No | Name for the completion trigger |

!!! note
    Indefinite steps block program completion -- the program cannot finish until all indefinite steps are manually marked complete.

## Start Trigger Types

### `programStart`

Step starts when the program begins.

```json
{"type": "programStart"}
```

### `programStartOffset`

Step starts after an offset from program start.

```json
{"type": "programStartOffset", "offsetSeconds": 60}
```

### `afterStep`

Step starts immediately after another step ends.

```json
{"type": "afterStep", "stepId": "boil-water"}
```

### `afterStepWithBuffer`

Step starts after another step ends plus a buffer time.

```json
{"type": "afterStepWithBuffer", "stepId": "boil-water", "bufferSeconds": 30}
```

### `manual`

Step waits for the user to click a "Start Step" button. Until started, the step slides forward on the timeline. Same-track predecessors must complete before the start button appears.

```json
{"type": "manual"}
```

### `onAbort`

Step triggers when another step is aborted.

```json
{"type": "onAbort", "stepId": "risky-step"}
```

## Schema 0.3.0-alpha: per-instance triggers (`instances`)

Schema `0.3.0-alpha` adds one optional field, `instances`, to the two
step-referencing triggers (`afterStep` and `afterStepWithBuffer`, alone or
inside a compound trigger). It only means something when `stepId` names a
**replicated** step (`"replicates": {"count": n, ...}`) or a step that is
itself instantiated per instance through `"each"`.

| `instances` | Meaning | OWL-Time reading |
|-------------|---------|------------------|
| `"all"` (default) | The step starts when **every** instance of `stepId` has ended. This is a barrier, and it is exactly the join a plain reference gets today. | `time:intervalAfter` the latest of the instances' `time:hasEnd` |
| `"each"` | The step is itself replicated once per instance of `stepId`; instance *i* starts when instance *i* of `stepId` ends (plus `offsetSeconds` / `bufferSeconds` as usual; `event: "start"` anchors on that instance's start). | `time:intervalMetBy` (or `time:intervalAfter` with an offset) per instance pair |
| `"any"` | The step starts when the **first** instance ends. | `time:intervalAfter` the earliest `time:hasEnd` |

```json
{
  "stepId": "bake", "name": "Bake tray", "task": "oven",
  "duration": {"type": "fixed", "seconds": 720},
  "replicates": {"count": 3, "mode": "serial"},
  "startTrigger": {"type": "afterStep", "stepId": "mix"}
},
{
  "stepId": "cool", "name": "Cool on rack", "task": "rack",
  "duration": {"type": "fixed", "seconds": 900},
  "startTrigger": {"type": "afterStep", "stepId": "bake", "instances": "each"}
},
{
  "stepId": "box", "name": "Box cookies", "task": "prep",
  "duration": {"type": "fixed", "seconds": 300},
  "startTrigger": {"type": "afterStep", "stepId": "cool", "instances": "all"}
}
```

Each tray starts cooling the moment it leaves the oven; boxing waits for all
three. The full program is `rhylthyme-examples/programs/cookies_three_trays.json`.

### Rules

- `"each"` is **transitive**: a step chained `"each"` off an `"each"` step
  inherits the same instance count and the same *i* → *i* pairing. The count
  is never redeclared; a step with an `"each"` trigger must not carry its own
  `replicates`.
- Inside a `compound` trigger a step may pair with two different replicated
  steps using `"each"`, provided both have the same count; instance *i* then
  waits for instance *i* of both.
- `"all"` and `"any"` collapse the chain back to a single step, which may be
  referenced downstream without `instances`.
- `instances` on a step that is not replicated is an authoring error
  (`E_INSTANCES_ON_SINGLE`, see the validator codes below).

### How it is executed

`instances` is resolved entirely by replicate expansion, before validation,
timing, planning, running and rendering. The expanded program contains only
`0.2.0` constructs:

- instances of a replicated step `X` are `X-r1 … X-rn`; parallel and stagger
  instances live in sub-tracks `<trackId>--X-r<i>`, serial instances stay in
  their track;
- an `"each"` successor `S` becomes `S-r1 … S-rn`, each placed in instance
  *i*'s sub-track (for a serial `X` those sub-tracks are created on demand),
  with `afterStep X-r<i>` and the original offset/buffer/event;
- `"all"` becomes `{"logic": "all", "triggers": [afterStep X-r1, …]}`,
  `"any"` the same with `"logic": "any"`;
- every expanded instance carries `instanceOf` (the authored `stepId`) and
  `instanceIndex` (1-based); every sub-track carries `parentTrackId`, so
  runtimes and renderers can group instances without parsing ids.

### Compatibility

`instances` defaults to `"all"`, which is the implicit join `0.2.0` programs
already get, so programs declaring `0.1.0`, `0.2.0` or `0.2.0-alpha`
validate unchanged and resolve to identical times. Declare
`"schemaVersion": "0.3.0-alpha"` when you use `instances`.

### Validator codes

Both validators (the Python `rhylthyme` package and the JS validator behind
`validate_program` on the MCP server) check `instances` and step-level
`replicates` **before** replicate expansion and report the same codes, each
with a fix hint. Every code has one negative example in
`rhylthyme-examples/invalid/<CODE>.json`. Errors make a program invalid;
warnings and notes do not.

| Code | Severity | Condition | Fix hint |
|------|----------|-----------|----------|
| `E_INSTANCES_ON_SINGLE` | error | `instances` is set on a reference to a step that is neither replicated nor `"each"`-derived. | remove `instances`, or add `replicates` to `<stepId>` |
| `E_EACH_WITH_REPLICATES` | error | A step has both an `instances: "each"` trigger and its own `replicates`. The count is inherited, never redeclared. | drop `replicates` on `<stepId>`; it inherits `<n>` instances from `<upstream>` |
| `E_EACH_COUNT_MISMATCH` | error | A compound trigger pairs `"each"` references to two replicated steps with different counts. | both upstream steps must have `count: <n>` |
| `E_INFLIGHT_GT_COUNT` | error | `replicates.maxInFlight` is greater than `replicates.count`, so the limit can never bind. | set `maxInFlight` <= `<count>` or omit it |
| `E_INFLIGHT_NO_CHAIN` | error | `maxInFlight` is set on a `"serial"` replicate with no `instances: "each"` descendants. Serial instances already cannot overlap, so nothing is ever held back. | `maxInFlight` has no effect here; remove it or chain a per-instance step |
| `W_UNBARRIERED_CHAIN` | warning | An `"each"` chain has no `"all"` barrier (explicit, or the implicit join of a plain reference) while the program has *later* steps, that is, steps outside the chain and not upstream of it, that reference nothing in it. | add a step with `instances:"all"` if later work should wait for every instance |
| `I_IMPLICIT_BARRIER` | info (JS only) | A `0.3.0-alpha` program references a replicated or `"each"`-derived step without `instances`, relying on the default `"all"` join. | add `instances: "all"` to make the barrier explicit, or `"each"` to run per instance |

A compound trigger that mixes join logics (for example `instances: "all"`
inside a `"logic": "any"` compound) cannot be expressed in the expanded
`0.2.0` constructs and is reported as `expansion_failed` with the offending
step named.

In Python the findings are `Finding` objects (`code`, `message`, `where`,
`fix`, `severity`), returned by `validate_program_structured` (root
package) and `validate_program_file_structured` (cli-runner) under
`findings`; the legacy string lists render each new finding as
`[CODE] message (fix: …)` and leave the pre-existing checks' strings
unchanged. The JS validator returns them in `errors`, `warnings` and `info`.

### Rendering

The timeline renderer draws an `"all"` barrier as one fan-in arrowhead with
a short solid bar across it, and an `"any"` fan-in with a dashed bar,
instead of one arrowhead per instance. The glyph is an SVG group
`<g class="rt-barrier" data-barrier="all|any" data-step="<stepId>">`.

An in-flight gate (below) is drawn as a dotted arrow from the leaf instance
that frees the slot to the instance it holds back, labelled `<task> <= <k>`,
in an SVG group
`<g class="rt-inflight" data-inflight-of="<stepId>" data-limit="<k>"
data-from="<leaf instance>" data-step="<gated instance>">`. It is never
drawn as an ordinary dependency arrow, and the legend gains an
"in-flight limit" key only when at least one gate is on the chart.

## Schema 0.3.0-alpha: bounded work in progress (`maxInFlight`)

`0.3.0-alpha` also adds one optional field, `maxInFlight`, to step-level
`replicates`:

```json
"replicates": {"count": 3, "mode": "serial", "maxInFlight": 2}
```

An instance is **in flight** from its own start until it has ended in
*every* `instances: "each"` descendant of the replicated step, that is,
until it has arrived at all the barriers hanging off the chain. `maxInFlight:
k` says at most *k* instances may be in flight at once: instance *i + k*
cannot start before instance *i* leaves flight.

In OWL-Time terms it bounds the number of `time:ProperInterval`s, each
spanning from an instance's `time:hasBeginning` to the latest
`time:hasEnd` among its paired descendants, that may `time:intervalOverlaps`
any given instant.

- `maxInFlight` must be an integer `>= 1` and `<= count`
  (`E_INFLIGHT_GT_COUNT`); omitting it means unbounded, which is the
  pre-`0.3.0` behaviour.
- With `mode: "parallel"`, `maxInFlight < count` turns the fan-out into a
  **rolling window**: instances 1..*k* start together and instance *k+1*
  starts when the first leaves flight.
- With `mode: "stagger"`, the stagger delay becomes a *minimum* gap; the
  gate may push a start later, never earlier.
- With `mode: "serial"`, instances already cannot overlap, so the limit only
  bites through the `"each"` descendants. A serial replicate with no such
  descendants is an authoring error (`E_INFLIGHT_NO_CHAIN`).

### `maxInFlight` is not `maxConcurrent`

`resourceConstraints[].maxConcurrent` bounds occupancy of **one task at one
instant**: how many `rack` steps may overlap. `maxInFlight` bounds a **chain
of tasks across time**: how many instances sit between a replicated step and
its rejoin point. Both may bind at once, and the planners must respect both.

The difference is visible in `cookies_three_trays.json`. Three trays, one
oven, a rack that holds two:

- with `rack maxConcurrent: 2` alone, the third bake runs as soon as the oven
  is free and `cool-r3` then waits for a rack slot, leaving a hot tray with
  nowhere to go;
- with `maxInFlight: 2` on `bake`, the third bake is held until the first
  tray leaves the rack, so nothing comes out of the oven with nowhere to go.

Hold the upstream step; do not strand the downstream one. That is the whole
reason `maxInFlight` is a separate construct.

### How it is executed

Replicate expansion rewrites the limit into ordinary `0.2.0` constructs, as
it does `instances`. For every instance *i > k* it merges into `X-r<i>`'s
trigger one `afterStep L-r<i-k>` per leaf chain, `L` being the last `"each"`
descendant of that chain (the replicated step itself when it has no `"each"`
descendants, which is the rolling-window case):

```json
{"logic": "all", "triggers": [
  {"type": "afterStep", "stepId": "bake-r2"},
  {"type": "afterStep", "stepId": "cool-r1",
   "_synthetic": "inFlight", "inFlightOf": "bake", "inFlightLimit": 2}
]}
```

The step's own trigger keeps its meaning: an `all` compound absorbs the
gates, anything else (including an `any` compound) is nested inside the new
`all`. The `_synthetic` / `inFlightOf` / `inFlightLimit` tags survive into
the expanded program so the renderer and the analyzer can tell a capacity
hold from an authored dependency; the timing resolvers read only
`type`, `stepId` and the offsets, so the tags are inert for them, and no
second expansion pass can match a tagged trigger.

## Resource Requirement Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resourceId` | string | Yes | ID of the required resource |
| `type` | string | Yes | Type of the required resource |
| `quantity` | number (>= 1) | Yes | Quantity required |
| `description` | string | No | Description |

## Resource Constraint Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task` | string | Yes | Task type this constraint applies to |
| `maxConcurrent` | number | Yes | Maximum concurrent instances |
| `description` | string | No | Description |

## Complete Example

This example demonstrates all duration types (fixed, variable, indefinite) and trigger types (programStart, afterStep, afterStepWithBuffer, manual).

```json
{
  "programId": "pasta-dinner",
  "name": "Pasta Dinner",
  "description": "A pasta dinner showing all duration and trigger types",
  "version": "1.0.0",
  "tracks": [
    {
      "trackId": "cooking",
      "name": "Cooking",
      "steps": [
        {
          "stepId": "boil-water",
          "name": "Boil Water",
          "task": "boiling",
          "duration": {"type": "fixed", "seconds": 300},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "cook-pasta",
          "name": "Cook Pasta",
          "task": "cooking",
          "duration": {
            "type": "variable",
            "minSeconds": 480,
            "maxSeconds": 720,
            "defaultSeconds": 600,
            "triggerName": "pasta-done"
          },
          "startTrigger": {"type": "afterStep", "stepId": "boil-water"}
        },
        {
          "stepId": "plate",
          "name": "Plate and Serve",
          "task": "preparation",
          "duration": {"type": "fixed", "seconds": 120},
          "startTrigger": {"type": "manual"}
        }
      ]
    },
    {
      "trackId": "sauce",
      "name": "Sauce",
      "steps": [
        {
          "stepId": "make-sauce",
          "name": "Make Sauce",
          "task": "cooking",
          "duration": {"type": "fixed", "seconds": 900},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "simmer",
          "name": "Simmer and Reduce",
          "task": "cooking",
          "duration": {
            "type": "indefinite",
            "defaultSeconds": 300,
            "triggerName": "sauce-ready"
          },
          "startTrigger": {"type": "afterStepWithBuffer", "stepId": "make-sauce", "bufferSeconds": 30}
        }
      ]
    }
  ],
  "resourceConstraints": [
    {"task": "cooking", "maxConcurrent": 4, "description": "Stove burners"},
    {"task": "boiling", "maxConcurrent": 2, "description": "Pots"}
  ]
}
```

## Program metadata: `metadata.varianceFactors`

`metadata` is an open object, but a few keys are documented in the schema
because the tools read them. `varianceFactors` (schema 0.3.0-alpha) is the
author's declaration of *what makes this program's steps take longer or
shorter*: turkey weight, oven type, sample count. Both runtimes ask for them
once at run start (skippable) and store the answers in the run record's
`context.userTags`, where [calibration and prediction](runs-schema.md) can
condition on them. They are the predictor variables in Badosa's sense — the job
parameters a history-based predictor regresses actual duration on.

```json
"metadata": {
  "serves": "8",
  "varianceFactors": [
    { "key": "turkeyKg", "label": "Turkey weight (kg)", "type": "number", "unit": "kg" },
    { "key": "oven", "label": "Oven type", "type": "enum", "values": ["gas", "electric", "convection"] }
  ]
}
```

(That is the declaration on the Thanksgiving example,
`rhylthyme://examples/thanksgiving_one_oven`.)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Identifier the answer is stored under in `context.userTags`; must start with a letter |
| `label` | string | No | Prompt shown to the executor, e.g. `Turkey weight (kg)`; defaults to `key` |
| `type` | enum | Yes | `number`, `integer`, `enum` or `string` |
| `values` | array of string | When `type` is `enum` | The allowed answers; an `enum` factor without them is unanswerable and ignored |
| `unit` | string | No | Unit shown beside a numeric prompt, e.g. `kg` |

`number` and `integer` factors are numeric predictors, `enum` factors are
one-hot encoded, and `string` factors are recorded but not modelled.

Declaring a factor does not make it predictive. Whether any of them explains
the observed variance is settled empirically by `rhylthyme runs report` (see
[Reporting](runs-schema.md#reporting)), never asserted by the author.

**Answering them.** `rhylthyme run` asks once, on the plain terminal, before the
interactive UI starts; Enter skips a factor. For headless runs, answer ahead of
time with `--factor turkeyKg=6.4 --factor oven=gas` or
`RHYLTHYME_FACTORS="turkeyKg=6.4,oven=gas"`, and use `--no-factor-prompt` to
skip the questions entirely. A `--factor` flag overrides the environment; an
answer that does not match the declared type is re-asked at the prompt, and
reported and dropped when it came from a flag or the environment.

## Duration provenance: `calibratedFrom`

Every duration in a program starts as the author's guess. When the author
accepts a proposal from [`rhylthyme calibrate`](cli.md#calibrate) — computed
from that program's [recorded runs](runs-schema.md) — the accepted duration
gains an optional `calibratedFrom` block (schema 0.3.0-alpha) *inside the
duration object*, so the distinction between a measured number and a guess is
visible in the JSON itself and in the editor:

```json
"duration": {
  "type": "variable",
  "minSeconds": 900,
  "defaultSeconds": 1190,
  "maxSeconds": 1500,
  "calibratedFrom": {
    "runs": 20,
    "asOf": "2026-09-14T12:00:00Z",
    "programVersion": "sha256:935c4ca9d910785332979c8807f6bb5ef247baf4bdb990a2f607b43b4b1293ec"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `runs` | integer ≥ 1 | Yes | Number of usable measurements the value was computed from |
| `asOf` | string | Yes | When the proposal was accepted, ISO 8601 |
| `programVersion` | string | No | Canonical hash (`sha256:…`) of the program the runs were measured against — the run records' [`programVersion`](runs-schema.md#programversion) |

`programVersion` is the plan the *measurements* were taken against, not
necessarily the plan that now carries them: a program calibrated and then edited
keeps the provenance of the history it was calibrated from, which is what makes
a stale calibration recognisable.

The block is valid on all three duration variants, and calibration is the only
thing that writes it — the runtimes and the planners ignore it. Durations are
open objects in 0.2.0-alpha as well, so a calibrated program still validates
against the older schema; only 0.3.0-alpha documents the shape.

!!! note
    `calibrate` itself never writes: it returns a proposal, and only the
    author's acceptance produces a `calibratedFrom`. Proposed ranges are
    widened, never narrowed — see
    [Calibration](runs-schema.md#calibration) for the rules.

## Validation Rules

- All `programId`, `trackId`, and `stepId` values must be unique within their scope
- Step references in triggers must refer to existing steps
- Duration values must be non-negative
- Resource quantities must be positive
- Programs must have at least one track; tracks must have at least one step

## Related Documentation

- [CLI Commands Reference](cli.md)
- [Environment Schema Reference](environment-schema.md)

## Predicted offsets: `metadata.offsetsUse`

!!! warning "Experimental"
    This is the only place where recorded history changes what a runtime
    *does*, rather than what it reports, and it is behind this flag until the
    held-out evaluation shows prediction beats the guess for the step types in
    question. The default is `"planned"`, and a program that omits the key
    behaves exactly as it always has.

```json
"metadata": {
  "offsetsUse": "predicted"
}
```

| Value | Meaning |
|-------|---------|
| `"planned"` (default) | A negative offset is projected from the author's own number |
| `"predicted"` | A negative offset on an **indefinite** anchor may be projected from run history instead |

### The problem it solves

"Peel the potatoes 45 minutes before the roast is done" is a negative offset:

```json
{
  "stepId": "potatoes-peel",
  "duration": { "type": "fixed", "seconds": 900 },
  "startTrigger": {
    "type": "afterStep",
    "stepId": "turkey-roast",
    "offsetSeconds": -2700
  }
}
```

The trigger has to fire **before** the roast ends, so it cannot wait for the
roast to end. Both runtimes resolve it against a *projection* of the anchor's
end — the anchor's actual start plus the duration it is expected to take,
which for an `indefinite` step is `defaultSeconds`. If the roast starts at
20:00 and its `defaultSeconds` is 2h45m, the peel fires at 22:00. When the
roast then runs 25 minutes over, the potatoes were peeled 25 minutes too
early, every time, for every cook who uses the program. That is the cost the
PRD opens with.

### What `"predicted"` changes

With the flag set, the projection of an indefinite anchor comes from
[prediction](runs-schema.md#prediction) instead — but only when all of the
following hold:

1. the anchor's duration is `indefinite` (a `fixed` duration is not a guess,
   and a `variable` step has bounds the executor works within);
2. a prediction exists for it: `basis` is something other than `"none"` and
   carries a number;
3. the prediction is **sharper than the guess** — its 80 % interval is
   strictly narrower than the anchor's `defaultSeconds`. A wide interval is
   history saying it does not know, and the author's number is then no worse.

If any condition fails, the authored `defaultSeconds` is used unchanged. And
if the anchor ends *before* the projected instant, the trigger fires
immediately at the anchor's end: a projection is never allowed to hold work
back once the thing it was projecting has happened.

Nothing else is affected. Every other trigger type, the plan the editor and
`analyze_schedule` draw, and the `planned` block frozen into a run record are
all computed from the authored durations — history never rewrites the plan.

### Using it

- **CLI:** `rhylthyme run` reads recorded runs at start-up and freezes the
  predictions for the whole run. See
  [`run --history`](cli.md#predicted-offsets-run---history) for `--history`,
  `--no-history` and `--predict-context`.
- **Web player:** set `element.predictions` (or the `data-predictions`
  attribute) to what `analyze_schedule` returned:
  `{stepId: {seconds, low, high, basis}}`. Without the flag the property
  changes nothing.
- **Evidence:** the run record records which numbers were used, in
  `context.offsetsUse` and in `predictedAnchorSeconds` on each gated step, so
  a later reader can tell a predicted run from a planned one.

### For the authoring guide

The paragraph below is the summary intended for the MCP `AUTHORING_GUIDE`
resource (`rhylthyme://guide/authoring`):

> **`metadata.offsetsUse` (experimental).** Set it to `"predicted"` to let a
> negative `offsetSeconds` be resolved against a *predicted* end of the step
> it is anchored on instead of that step's authored `defaultSeconds`. It only
> affects negative offsets on `indefinite` anchors, and only when the program
> has enough recorded runs for a prediction whose interval is narrower than
> the authored `defaultSeconds`; otherwise the authored number is used
> unchanged. Nothing else in the program changes — every other trigger, and
> the plan `analyze_schedule` reports, still come from the durations as
> written. Leave it out (or set `"planned"`) and behaviour is exactly as
> before. It is worth setting on a program whose key step is genuinely
> open-ended (a roast, an incubation) and whose duration depends on something
> the program declares in `metadata.varianceFactors`; it is pointless on a
> program of fixed durations.
