# Manual Controls

Rhylthyme supports interactive manual controls during program execution, allowing steps to be started or completed by the user rather than running on fixed timers. This is essential for real-world workflows where certain tasks require human judgment about when to begin or end.

The **Manual Controls Demo** example (available in the sidebar) demonstrates all three types of manual interaction.

## Before you start: variance factors

Some programs ask a question before the first step rather than during one.
If the author declared `metadata.varianceFactors` — the facts about *this*
run that plausibly explain how long it takes — the player puts a short form
above the timeline the first time you press **Start**:

```json
"metadata": {
  "varianceFactors": [
    { "key": "turkeyKg", "label": "Turkey weight (kg)", "type": "number", "unit": "kg" },
    { "key": "oven", "label": "Oven type", "type": "enum",
      "values": ["gas", "electric", "convection"] }
  ]
}
```

**Key behaviors:**

- One field per declared factor: a box with its unit for `number` and
  `integer`, a picker for `enum`, a text box otherwise
- **Every field is optional.** Leave anything blank (or pick *— skip —* in a
  picker) and nothing is recorded for it; pressing **Start** with the whole
  form empty starts the run exactly as if it had never been asked
- Pressing **Start** validates what you did fill in. A weight that is not a
  number, or a value outside a picker's list, is refused in place with the
  reason beside the field, and the run does not begin until you fix or clear
  it
- The answers go into the [run record](../development/runs-schema.md)'s
  `context.userTags`, where calibration and prediction can condition on
  them — nothing else in the run changes because of them
- Your last answers for that program are remembered in the browser and
  prefilled next time, so a second cook of the same recipe is one click
- A program that declares no variance factors shows no form: **Start**
  starts, as always

The question is asked once per run, at the start, because that is when the
facts are known and when asking costs nothing. It is never asked mid-run.

!!! note "Signed out is fine"
    The form is part of the player, not the account. Answers are recorded in
    the run record wherever that record goes — your library when signed in,
    your browser otherwise.

## Manual Start Triggers

A **manual start** step waits for the user to explicitly start it. The step will not begin until the user clicks the "Start Step" button, even if the program timeline has progressed past its scheduled start time.

```json
{
  "stepId": "manual-prep",
  "name": "Manual Preparation",
  "task": "preparation",
  "duration": {
    "type": "fixed",
    "seconds": 60
  },
  "startTrigger": {
    "type": "manual",
    "triggerName": "start-preparation"
  }
}
```

**Key behaviors:**

- The step slides forward along the timeline until the user clicks **Start Step**
- Once started, the step runs for its full specified duration
- Same-track predecessor steps must complete before the Start button appears
- A dashed border on the timeline bar indicates a manual start step

!!! note "Same-Track Prerequisites"
    If a manual start step has a predecessor on the same track, the Start button only appears after the predecessor completes. This prevents starting a step before its dependencies are met.

## Variable Duration Steps

A **variable duration** step has a minimum time it must run, a maximum time it can run, and a default time it will run if not manually completed. The user can click "Mark Complete" to end the step early (after the minimum time) or let it auto-complete at the default time.

```json
{
  "stepId": "variable-monitor",
  "name": "Variable Duration Monitoring",
  "task": "monitoring",
  "duration": {
    "type": "variable",
    "minSeconds": 45,
    "maxSeconds": 180,
    "defaultSeconds": 120,
    "triggerName": "monitoring-complete"
  },
  "startTrigger": {
    "type": "afterStep",
    "stepId": "setup"
  }
}
```

**Key behaviors:**

- The step starts automatically based on its `startTrigger`
- A **Mark Complete** button appears in both the itinerary and the manual actions panel
- The step will auto-complete at `defaultSeconds` if not manually stopped
- The timeline bar shows a flex icon (hatched pattern) indicating variable duration
- `minSeconds` defines the earliest the step can be completed
- `maxSeconds` is the absolute maximum duration

| Field | Purpose |
|-------|---------|
| `minSeconds` | Minimum time the step must run before it can be completed |
| `maxSeconds` | Maximum time the step can run (hard limit) |
| `defaultSeconds` | Time the step runs if not manually completed |
| `triggerName` | Identifier for the completion trigger |

## Indefinite Duration Steps

An **indefinite duration** step runs until the user explicitly stops it. There is no automatic completion -- the user must click "Mark Complete" to end the step and allow execution to continue.

```json
{
  "stepId": "indefinite-watch",
  "name": "Indefinite Watching",
  "task": "watching",
  "duration": {
    "type": "indefinite",
    "defaultSeconds": 120,
    "triggerName": "stop-watching"
  },
  "startTrigger": {
    "type": "afterStep",
    "stepId": "variable-monitor"
  }
}
```

**Key behaviors:**

- The step starts automatically based on its `startTrigger`
- Execution does **not** pause while the step runs -- other tracks continue
- The timeline bar has reduced opacity (0.7) to visually indicate indefinite duration
- A **Mark Complete** button appears in both the itinerary and the manual actions panel
- `defaultSeconds` is used only for display sizing in the timeline -- it does not affect execution
- The step must be manually completed for dependent steps to begin

!!! warning "Blocking Dependent Steps"
    Steps that depend on an indefinite step (via `afterStep` trigger) will not start until the indefinite step is manually completed. Plan your track dependencies accordingly.

## Manual Actions Panel

During execution, an indigo **Manual Actions Required** panel appears at the top of the visualization whenever there are steps needing user interaction. This provides quick access to Start and Complete buttons without scrolling to the itinerary.

The panel shows:

- **Start** buttons (indigo) for manual-start steps that are ready to begin
- **Complete** buttons (green) for indefinite or variable-duration steps that are currently active

## Itinerary Badges

The itinerary view shows color-coded badges next to steps with manual controls:

| Badge | Meaning |
|-------|---------|
| **Manual Start** (green) | Step requires user to click Start |
| **Manual Complete** (green) | Step has a variable or indefinite duration with manual completion |
| **Indefinite** (amber) | Step has no automatic end time |

## Instance Groups

A step with `replicates` expands into one instance per repetition
(`bake-r1`, `bake-r2`, `bake-r3`). Showing three rows with the same name is
noise, so the itinerary collapses them into one **group header**:

```
▸ Bake tray ×3
▸ Cool on rack ×3
```

Click the header to expand the group. Each instance then appears as its own
itinerary entry, labelled with its position — `Bake tray [1 of 3]`,
`Bake tray [2 of 3]`, `Bake tray [3 of 3]` — with its own timing, badges and
manual-control buttons. Click the header again to collapse. Groups start
collapsed, and a "group" of one instance is just an ordinary step row.

The timeline and DAG views are unchanged: instances still get their own bars
and their own nodes, so you can see a per-instance chain fan out and rejoin.

## Completing Manual Steps Per Instance

When a step is chained per instance (`"instances": "each"`), each instance is
completed on its own. Expand the group and use that instance's **Complete**
button — you are ending *tray 2's* cooling, not "cooling". The Manual Actions
panel does the same thing without expanding anything: it lists one chip per
instance that needs attention, named `Cool on rack [2 of 3]`.

This matters when the replicated step has an in-flight limit
(`"replicates": { "count": 3, "maxInFlight": 2 }`, "the rack holds two trays").
The gate that holds the third bake fires on the *actual* end of the first
tray's cooling, not on its planned end:

- Complete `cool-r1` **late** and `bake-r3`, `cool-r3` and the boxing step all
  slide later by the same amount.
- Complete it **early** and they move up — but never earlier than the rest of
  the schedule allows, so `bake-r3` still waits for `bake-r2` to leave the oven.

## Combining Manual Features

Steps can combine manual start with variable or indefinite duration:

```json
{
  "stepId": "manual-execution",
  "name": "Manual Execution Step",
  "task": "execution",
  "duration": {
    "type": "variable",
    "minSeconds": 30,
    "maxSeconds": 120,
    "defaultSeconds": 75,
    "triggerName": "execution-done"
  },
  "startTrigger": {
    "type": "manual",
    "triggerName": "start-execution"
  }
}
```

This step requires the user to click Start, then runs with a variable duration that can be completed manually after 30 seconds or auto-completes at 75 seconds.

## Cross-Track Dependencies

Steps on different tracks can depend on manual steps. When a manual step is completed, its dependent steps on other tracks begin immediately. The grey S-curve connectors in the timeline view update their positions in real-time as steps are pushed or completed during execution.

## Try It Out

Load the **Manual Controls Demo** from the Examples sidebar to experiment with all three types of manual interaction. Set the speed to 10x for faster testing, then:

1. Click **Start** to begin execution
2. Complete the "Initial Setup" step using the **Mark Complete** button
3. Start the "Manual Preparation" step when its **Start Step** button appears
4. Complete the "Variable Duration Monitoring" step early
5. Complete the "Indefinite Watching" step when ready
6. Start and complete the "Manual Execution Step"
7. Watch "Final Cleanup" auto-complete

## When predicted offsets are on

Some steps are scheduled *backwards* from another step: "peel the potatoes 45
minutes before the roast is done" is an `afterStep` trigger with a **negative**
`offsetSeconds`. Its Start button has to appear before the roast is finished,
so the player cannot wait for the roast — it has to guess when the roast will
end, and it normally guesses with the number the author wrote
(`defaultSeconds`).

A program whose author set
[`metadata.offsetsUse`](../development/schema.md#predicted-offsets-metadataoffsetsuse)
to `"predicted"` guesses from **what actually happened on previous runs**
instead, when there is enough history to do better.

### What the cook sees

| | With `"planned"` (the default) | With `"predicted"` |
|---|---|---|
| When the peel step's **Start** button appears | 45 min before the roast's *authored* end | 45 min before the roast's *predicted* end |
| Where the bar sits on the timeline | At the planned instant | At the predicted instant — visibly earlier or later |
| What happens if the roast finishes first | The step becomes ready immediately | The step becomes ready immediately |
| Every other step | Unchanged | Unchanged |

In practice: if the program says the roast takes 2h45m but this kitchen's runs
say about 2h05m for a turkey this size, the potatoes come up for peeling forty
minutes earlier than the program alone would have asked for them — which is
the point, because the roast really will be out forty minutes earlier.

### It is conservative on purpose

The predicted end is used **only** when history is confident: the step must be
`indefinite`, a prediction must exist for it, and the prediction's 80 %
interval must be narrower than the authored `defaultSeconds`. A wide interval
is history saying it does not know, and the author's number is used unchanged.
Predictions also never move a step whose trigger is not a negative offset, and
never touch the plan itself — the ghost bars in the
[planned-vs-actual view](visualization.md) still show what the program said,
which is how the difference stays visible.

### Nothing is silently different

- The flag is per program and set by the author; the default is the old
  behaviour.
- A step gated this way keeps its ordinary controls: it is still the cook who
  presses **Start**, and a projection only decides when the button lights up.
- The run record says which numbers were used, so a run done on predictions
  can be told apart from one done on the plan (`context.offsetsUse` and
  `predictedAnchorSeconds`; see the
  [Runs Schema Reference](../development/runs-schema.md#predicted-offsets)).
- Whether this actually helps is a measured question, not a claim — see the
  [held-out evaluation](../development/reports/duration-evaluation-catalog.md).
