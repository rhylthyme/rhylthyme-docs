# MCP Server

The Rhylthyme MCP (Model Context Protocol) server lets AI assistants like Claude create and visualize Rhylthyme schedules directly. MCP is an open standard that enables AI models to call external tools — in this case, Rhylthyme's visualization and recipe import capabilities.

## Setup Requirements

**Local installation is required** for full MCP functionality. The remote endpoint at `mcp.rhylthyme.com` is a status/information endpoint only.

## Local Server Installation

### Installation

```bash
pip install "rhylthyme[mcp]"
```

### Claude Desktop Setup

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rhylthyme": {
      "command": "rhylthyme-mcp"
    }
  }
}
```

Restart Claude Desktop after saving the config.

### Claude Code Setup

For Claude Code (CLI tool), add a `.mcp.json` file to your project root:

```json
{
  "mcpServers": {
    "rhylthyme": {
      "command": "rhylthyme-mcp"
    }
  }
}
```

### Testing the Connection

After setup, test the connection by asking Claude:
- "What Rhylthyme tools are available?"
- "Create a simple breakfast schedule"

The server runs locally and opens visualizations directly in your browser.

## Remote Status Endpoint

The endpoint `https://mcp.rhylthyme.com` provides status information and setup instructions but does **not** provide functional MCP tools. It will direct you to install the local server for actual functionality.

**For web-based scheduling without MCP setup, visit [www.rhylthyme.com](https://www.rhylthyme.com)**

## Available Tools

### `visualize_schedule`

Creates an interactive timeline visualization from a Rhylthyme program JSON.

Claude builds the program JSON from your natural language description, then calls this tool to render it. You describe what you want ("Plan a Thanksgiving dinner for 8 people"), and Claude handles the JSON structure.

**What it does:**

- Validates the program structure
- Sends it to rhylthyme.com for D3.js rendering
- Returns a summary of tracks, steps, and timing

### `analyze_schedule`

Resolves a program onto the clock without publishing anything: every
step's start and end, the makespan, the critical path, and — the part
that answers "why is it this long?" — which constraint gates each edge
of that path.

**What it reports:**

- `criticalPath` — the chain that sets the makespan.
- `bindingConstraints` — one entry per critical-path edge, with
  `kind` of `inFlight`, `maxConcurrent`, `offset` or `dependency`.
- `resourceConflicts` — every item tagged `kind: "maxConcurrent"`
  (more steps claim a task at one instant than its `maxConcurrent`)
  or `kind: "inFlight"` (more instances are between a replicated step
  and its barrier than `replicates.maxInFlight` allows).
- `inFlight` — the in-flight window of each instance of a capped
  replicated step: from the instance's start until the last of its
  per-instance (`instances: "each"`) descendants ends.
- Per-track slack, with instance sub-tracks as their own rows tagged
  `parentTrackId`; steps carry `instanceOf` / `instanceIndex`.
- Wall-clock times for every step when you pass `finishAt` or `startAt`.

**Analysing against your own history.** Once a program has been run, the
planned durations are checkable. Pass `history` (run records, as
`load_run` returns them) — or just `program_id` and `token`, and the tool
loads your own recorded runs of that program — and every step with enough
measurements gains a `predicted` object beside its planned duration:

```jsonc
"predicted": { "seconds": 1230.6, "low": 1134.9, "high": 1304.2,
               "basis": "model", "n": 20, "factors": [{"key": "turkeyKg", "coef": 86.9}] }
```

`basis` is `identical` (runs of the same program version, environment and
variance factors — their median and P10/P90), `model` (a per-step
regression on the factors whose correlation with the observed duration
clears a threshold) or `none` (no usable measurement, or the step is one
the executor decides rather than one the process determines). The result
also carries `predictedMakespan` and `predictedCriticalPath` beside the
planned ones.

`useDurations: "predicted"` goes further and replans: the makespan, the
wall-clock itinerary, the critical path and the conflicts are all
computed from the predicted durations instead of the authored ones. That
is the honest answer to "when do I start if we eat at six?" once the
history knows how long the roast really takes. The default stays
`"planned"`, so a program is analysed on what it says unless you ask
otherwise, and with no history the output is exactly what it always was.

**Example output** — three trays of cookies, one oven, a cooling rack
that holds two (`replicates: { count: 3, mode: "serial", maxInFlight: 2 }`):

```
**Makespan:** 1h 14m across 4 tracks, 8 steps.
**Critical path:** Mix dough → Bake tray (1 of 3) → Cool on rack (1 of 3) → Bake tray (3 of 3) → Cool on rack (3 of 3) → Box cookies
**Binding constraints:** `rack` (in-flight ≤ 2) gates `bake-r3`.
**Peak concurrency:** 2 steps at 27:00.
**Resource conflicts:** none.

**In-flight windows (1):**
- `bake` ×3 through `rack`: maxInFlight 2, peak 2 at 27:00 — #1 15:00–42:00, #2 27:00–54:00, #3 42:00–1:09:00
```

The third tray is held by the **rack**, not the oven: the oven is free at
39 minutes, but the first tray only leaves the rack at 42. Without the
in-flight cap the same kitchen reports a `maxConcurrent` conflict on the
rack instead — trays piling up with nowhere to go — and every binding
constraint reads `dependency`.

### `import_from_source`

Imports recipes or lab protocols from external databases.

**Supported sources:**

| Source | Content | Actions |
|--------|---------|---------|
| Spoonacular | Recipes with nutrition and equipment | search, import, random |
| TheMealDB | Recipe database | search, import, random |
| protocols.io | Laboratory protocols | search, import |

**Workflow:** Claude searches for recipes, imports the best matches, then composes them into a unified multi-track schedule. For multi-dish meals, all dishes are combined into a single visualization with coordinated timing.

### `import_text`

Turns a block of pasted text into a program. Use it when there is no URL
and no supported service — a recipe off a card, a method copied out of a
PDF, a run sheet in an email — and see
[Importing pasted text](#importing-pasted-text) below for what it costs
and what comes back.

### `list_runs`

Lists the recorded executions of one saved program, newest first. A **run
record** is written whenever somebody plays the live timeline (or runs
`rhylthyme run` in the terminal): the durations the program planned, frozen
at the moment the run started, beside the durations that actually happened.
See the [runs schema reference](../development/runs-schema.md).

| argument | required | what it does |
|---|---|---|
| `program_id` | yes | The program UUID, from `list_my_programs` or the program's URL |
| `token` | yes | The user's Rhylthyme access token from `login` |

Each line gives the start time, the outcome (`completed`, `aborted`,
`abandoned`), the actual makespan against the planned one with the
percentage deviation, whether the clock was paused or the run was played at
a speed other than 1, and the run id to pass to `load_run`.

### `load_run`

Opens one recorded execution by run id and returns a planned-versus-actual
table per step: duration kind, planned duration, actual duration with its
deviation, what ended the step (`executor` — a person marked it done —
`timer`, `trigger` or `abort`) and how long the clock was paused while it
was running.

| argument | required | what it does |
|---|---|---|
| `run_id` | yes | The run UUID from `list_runs` |
| `token` | yes | The user's Rhylthyme access token from `login` |

Only steps a person ended, unpaused, at speed 1, in a completed run measure
how long the work really takes; a `timer` ending only confirms that the
timer worked. Runs are **private to the person who ran them**, even for a
public program — both tools return the caller's own runs and nobody else's.

### `list_public_runs`

Lists the runs **other people have contributed** for one exact program
version, newest first, with the median actual total against the planned one.
Contribution is opt-in per run: a contributed record carries no account, no
program id and no step notes, only the timings and the answers the executor
gave to the program's declared variance factors. Because the rows belong to
nobody, this tool needs **no login**.

| argument | required | what it does |
|---|---|---|
| `program_hash` | either this | The canonical program hash, `sha256:` plus 64 hex characters — a run record's `programVersion`, or `programs.program_hash` |
| `program` | or this | The program JSON, hashed by the tool with the same canonical hash the runtimes record |
| `limit` | no | How many runs to return (1–200, default 50) |

Contributed runs are keyed by the **exact** program JSON, so a program that
has been edited since it was last run has no contributed history until
somebody runs the new version. What is and is not stored is set out in
[privacy](../privacy.md#execution-records-runs); the
contribution checkbox itself is described in
[your account](account.md#contributing-runs-to-the-public-catalog).

### `calibrate_program`

Proposes new durations for one of your saved programs from its recorded
runs, with the evidence, and **never saves anything**.

| argument | required | what it does |
|---|---|---|
| `program_id` | usually | The program UUID whose runs are the evidence; with no `program`, also the JSON to calibrate |
| `program` | or this | The program JSON to calibrate, when it differs from what is saved |
| `history` | no | Run records to use instead of the ones stored against `program_id` |
| `k` | no | Measurements a step needs before it gets a proposal (default 5) |
| `since` | no | Only runs started on or after this date — "the last month's cooks only" |
| `accept` | no | `"all"`, or the step ids to write. The result then also carries the calibrated program |
| `token` | yes | Your access token: the runs are private to whoever ran them |

For every step you ended by hand in enough runs, the median becomes the
proposed default and the 10th/90th percentiles the proposed range —
**widened**, never narrowed, so the range you wrote is always still
inside the one proposed. An `indefinite` step gets a default and no
invented range, because its end is your decision. A `fixed` step never
gets a number at all: history can only say how *late* its planned end
really was, so one that consistently overruns comes back with a
"consider variable" note and its lag. A step with fewer than `k`
measurements comes back as skipped *with* its statistics, so you can see
how close it is.

The result is a table — step, type, n, current, proposed, median, IQR,
delta, note — and one line saying what accepting everything would do to
the makespan and the critical path. Nothing is written: with `accept` you
get the calibrated program back as a value, each changed duration
carrying `calibratedFrom: {runs, asOf, programVersion}`, and keeping it
is a separate `save_program` call. The same thing behind a button is
[Calibrate from my runs](visualization.md#calibrate-from-runs) in the
player page.

### `preview_timeline`

Renders a program as a static Gantt-chart PNG, no prose. Pass a recorded
`run` as well (the `run` object from `load_run`) and the picture becomes
a comparison: each step's real bar over a thin ghost bar at its planned
position, outlined green where it finished early and amber where it ran
late. See [planned vs actual](visualization.md#planned-vs-actual-a-recorded-run).

## Resources and the `plan_schedule` prompt

Besides tools, the server publishes four kinds of MCP *resource* the
model can pull on demand:

- `rhylthyme://schema/program` — the full program JSON Schema
  (0.3.0-alpha).
- `rhylthyme://guide/authoring` — a one-page authoring cheat-sheet.
- `rhylthyme://guide/extraction` — the four turns of `plan_schedule`
  written out as prose, with the expected output shape for each, for
  hosts that cannot run a multi-message prompt.
- `rhylthyme://examples/<name>` — complete, valid programs to
  pattern-match, including `cookies_three_trays`, the three-trays
  program analysed above.

The authoring guide has a section **"Repeating work: per-instance
chains, barriers and in-flight limits"**. It documents `replicates`
(`count`, `mode`, `delay`), the `instances` value on step-referencing
triggers — `"each"` to run the next step once per instance, `"all"` for
the barrier that waits for every instance, `"any"` for the first — and
`replicates.maxInFlight`, the cap on how many instances may sit between
a replicated step and its barrier. It contrasts `maxInFlight` with
`maxConcurrent` ("hold upstream, don't strand downstream"), carries the
three-trays-of-cookies program as a validated snippet, and lists the
validator codes an author will see (`E_INSTANCES_ON_SINGLE`,
`E_EACH_WITH_REPLICATES`, `E_EACH_COUNT_MISMATCH`,
`E_INFLIGHT_GT_COUNT`, `E_INFLIGHT_NO_CHAIN`, `W_UNBARRIERED_CHAIN` and
the informational `I_IMPLICIT_BARRIER`).

### `plan_schedule`: four turns, not one

`plan_schedule(goal, finishAt?, constraints?, sourceText?)` returns
**four user messages**. The host sends them in order in one
conversation, so each turn sees the answers to the ones before it.
Agents get step lists right and cross-track dependencies wrong, so
extraction (turn 3) and relationship inference (turn 4) are deliberately
separate turns:

| turn | what it asks for | expected output |
|---|---|---|
| **T1 read-back** | What is being made, for how many, by when, under what limits — in one paragraph, before any JSON exists. Catches a truncated source or a misread goal early. | `{summary, servesOrScale, deadline?, constraints[]}` |
| **T2 model check** | The program model restated in the model's own words (tracks are sequential; one duration kind per step; triggers link steps; every `task` needs a `resourceConstraint`; `stepId`s are global), plus the resource constraints it expects to declare. | acknowledgement + `resourceConstraints[]` |
| **T3 extraction** | Every timed activity, in the order the text gives it, with its duration, the resource it occupies, and the exact words it came from. No tracks, no triggers yet. | flat step list with `sourceSpan` and `inferred` |
| **T4 relationships** | Assign each step to a track, give it a trigger from the trigger vocabulary, then improve the dependency question ("which activities depend on which…") and answer the improved one, so implied waits — cooling, resting, preheating, proofing — surface. Then the program, then validate → analyze → visualize. | full program JSON |

T2 names `replicates`, `instances: "each"`/`"all"` and `maxInFlight`, so
a goal like "12 samples, the rotor holds 6" or "three trays, one oven,
the rack holds two" reaches for one replicated step with an in-flight
cap instead of a hand-copied track per sample.

**`sourceText`** is the new optional argument: a recipe, a protocol, a
run sheet. It is embedded in T1 and T3 — the two turns that read the
source — and nowhere else. Without it, the steps are extracted from
`goal` alone and both turns say so rather than inventing a source.

**Provenance.** Every step keeps what turn 3 found, under `metadata`:

```json
"metadata": {
  "sourceSpan": { "quote": "Roast the turkey for 3 hours", "occurrence": 1 },
  "inferred": false
}
```

A `sourceSpan` is a quoted substring plus which occurrence of it is
meant, so it survives whitespace edits and stays unambiguous when a
phrase repeats. A step the source never stated — preheating, resting,
a sound-check — carries `"inferred": true` and no span.

**A short transcript** (kitchen endpoint, goal "three trays of cookies",
constraints "one oven, the cooling rack holds two"):

```text
→ T1  Turn 1 of 4 — read-back. … Resource limits: one oven, the cooling
      rack holds two. … Read all of it before you answer.
← 
      Three trays of cookies, baked one tray at a time in a single oven,
      with a cooling rack that holds two trays.
      {"summary": "…", "servesOrScale": "3 trays", "constraints":
       ["one oven", "cooling rack holds two"]}

→ T2  Turn 2 of 4 — model check. … restate the target data model …
←     Tracks are sequential; steps in one track never overlap … 
      {"acknowledgement": "…", "resourceConstraints":
       [{"task":"prep","maxConcurrent":1},{"task":"oven","maxConcurrent":1},
        {"task":"rack","maxConcurrent":2}], "actors": 1}

→ T3  Turn 3 of 4 — extraction. Imagine you have to carry out this recipe
      yourself, in a kitchen where you have: one oven, the cooling rack
      holds two …
←     {"steps": [{"stepId":"mix", …, "sourceSpan":{"quote":"Mix the
       dough","occurrence":1}, "inferred": false}, …
       {"stepId":"preheat", …, "sourceSpan": null, "inferred": true}]}

→ T4  Turn 4 of 4 — relationships … suggest a better version of the
      question "which activities depend on which …"
←     Improved question: "which steps are held not by the oven but by the
      rack …" → bake gets replicates.count 3 with maxInFlight 2, cool
      chains with instances "each", box waits with "all".
      {"schemaVersion": "0.3.0-alpha", …}
      → validate_program → analyze_schedule → visualize_schedule
```

Hosts that cannot run a multi-message prompt get the same four turns,
slots and output shapes from `rhylthyme://guide/extraction`.

The prompt structure follows Almuntashiri, Ibáñez & Chapman
(ProvenanceWeek '25), who measured prompt patterns for extracting
structured records from text: confirming the source and the target model
before extracting helps, and relationships are the weak component. The
evaluation harness in `rhylthyme-cli-runner` (`rhylthyme eval-prompts`)
scores both this structure and the previous single-message prompt
against an expert gold set. The measured numbers live in exactly one
place: [rhylthyme-cli-runner's README, "Evaluating prompts"](https://github.com/rhylthyme/rhylthyme-cli-runner#evaluating-prompts).

## Example Usage

Try these prompts in Claude Desktop or claude.ai after connecting:

- "Create a schedule for making chicken tikka masala with naan bread"
- "Plan a Thanksgiving dinner with turkey, mashed potatoes, green beans, and pumpkin pie"
- "Import a random recipe from Spoonacular and visualize it"
- "Schedule an RNA extraction protocol"
- "Three trays of cookies, one oven, the cooling rack holds two"

Claude will confirm resource constraints (e.g., "You have 1 oven, 4 stovetop burners — correct?") before generating the visualization.

## Compatibility

The local Rhylthyme MCP server works with MCP-compatible clients that support command-based servers:

- [Claude Desktop](https://claude.ai/download) ✅
- [Claude Code](https://claude.ai/code) ✅ (via `.mcp.json`)
- Any client supporting MCP stdio transport ✅

**Note:** HTTP-based MCP clients may not work with the command-based local server. For web-based access, use [www.rhylthyme.com](https://www.rhylthyme.com) directly.

## Importing pasted text

`import_from_source` needs a source with structure to read. When the user
simply *has the text*, `import_text` runs the four turns above on the
server and returns the program plus the source span every step came from.

```jsonc
{
  "text": "Saturday Brunch for Four\n\nEverything on the table at ten…",
  "environmentType": "kitchen",
  "deadline": "10:00",
  "hints": "one oven, two burners, one cook",
  "token": "<from the login tool>"
}
```

`text` and `environmentType` are required; `deadline` and `hints` fill the
same slots the `plan_schedule` arguments do — the deadline line in turn 1
and "everything must be ready at …" in turn 3, and the environment phrase
the scenario prompt uses ("in a kitchen where you have: one oven, two
burners, one cook").

**What comes back**

- The **program**: validated, multi-track, recording
  `metadata.source.type = "llm-text"` with the model, the turn scores and
  the chunk count, and `metadata.importSteps` carrying the span list.
- A **step → span table**: every step with the exact words it came from,
  or marked *inferred* when the text never stated it. The span format is
  the one described above — a quoted substring plus which occurrence of
  it is meant — and each span is checked against the source, so a
  paraphrase is flagged rather than silently trusted.
- The **turn scores** (`read-back 2/2, model check 2/2`) and, when the
  source was long enough to split, how many chunks turn 3 was run over.

**Chunking.** Turn 1's read-back is the check on whether the whole source
arrived. If the text is long (over roughly 6,000 tokens) or the read-back
never mentions the end of it, turn 3 is run once per section and the step
lists are merged — deduplicated by source span, in the order the sections
appear — before the single relationships turn.

**Cost and limits.** Four model calls at minimum, plus one per turn retry,
one per extra chunk, and up to two validator fix rounds. Sign-in is
required like every import, the daily cap is 20 per account under its own
`import_text` quota, and a per-call token ceiling aborts a run that is
looping. When a turn fails, the error names it — `T1`, `T2`, `T3` or
`T4` — so you can tell "the model never read the source" from "the
program would not validate".

## Enriching a Structural Import

`import_from_source` converts a recipe or protocol URL into a program, but the importers read structure rather than meaning, so what comes back is a single track of steps chained head-to-tail. Passing `enrich: true` alongside `action: "import"` runs **turn 4 of `plan_schedule`** — the relationships turn — over that step list on the server and returns a multi-track program instead.

```jsonc
{
  "source": "protocolsio",
  "action": "import",
  "query": "https://www.protocols.io/view/western-and-dot-blot-j569cq9h7",
  "token": "<from the login tool>",
  "enrich": true
}
```

Steps, durations and resources are kept exactly as imported, including the source words each step came from (`metadata.sourceSpan`). Track membership and every `startTrigger` are inferred, and a step the model adds that the source never stated is marked `metadata.inferred: true`. The program records `metadata.source.enriched: true` and the model that did it, and the result is validated with the same checks as `validate_program`, with a bounded fix loop.

Enrichment costs a model call, so it is login-gated like every import and capped at 20 per day per account under its own rate-limit quota. It can never lose the import: if the model is unavailable or the enriched program will not validate, the tool returns the plain one-track import with a one-line note saying why.

On one protocols.io protocol of 32 steps, enrichment turned the single imported track into three — the main western blot, a sequential detergent extraction and a set of dot blots — joined by a cross-track `afterStep` trigger, with the program still passing both validators.
