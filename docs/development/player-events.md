# Player events

The `<rhylthyme-timeline>` player (from
[`@rhylthyme/timeline`](https://github.com/rhylthyme/rhylthyme-timeline))
tells the page around it what is happening through DOM events. This page
lists every event, what it carries, when it fires and when it does not,
and the rules that decide the awkward cases. It describes
`@rhylthyme/timeline` 2.0.0-beta.7 and later.

All events are `CustomEvent`s that bubble and cross the shadow boundary,
so you can listen on the element or on any ancestor. Every time in an
event is in **program-clock seconds**: seconds since the program's start
as the player counts them, not wall-clock time and not milliseconds.

<!-- snippet: events-listen -->
```js
const el = document.querySelector('rhylthyme-timeline');
el.addEventListener('rt-step-began', (e) => console.log(e.detail.stepId, 'began at', e.detail.time, 'by', e.detail.by));
el.addEventListener('rt-step-ended', (e) => console.log(e.detail.stepId, 'ended at', e.detail.time, 'by', e.detail.by));
```

In TypeScript, `RhylthymeTimelineEventMap` (from
`@rhylthyme/timeline/element`) types each event's `detail`, and
`addEventListener` on the element is typed with it.

## Which events to use

| You want to | Listen to |
|---|---|
| Follow a run step by step: tick off an ELN step, send a notification, show what is running | `rt-step-began` and `rt-step-ended` |
| Keep a durable record of what happened | `rt-run-record` |
| Know the run is over | `rt-complete` (finished), `rt-stop` (stopped), or `rt-step-ended` with `by: 'dropped'` (dropped) |
| Redraw your own playhead or "now" marker | `rt-tick`, and `rt-seek` to resync after a seek |
| React to the person pressing *Start* on a gated step | `rt-step-start` (or `rt-step-began` with `by: 'person'`) |

`rt-step-began` and `rt-step-ended` are the events most hosts want. They
fire for **every** step, exactly once per run each. The older
`rt-step-start` and `rt-step-complete` fire only for some steps (see
[Older step events](#older-step-events)).

## The events

In the order a typical run produces them:

| Event | `detail` | Fires when |
|---|---|---|
| `rt-load` | `{ program }` | A program was set through the `program` property, or fetched from `src`, and planned. |
| `rt-factors` | `{ factors, skipped, source }` | Answers to the program's variance factors were given. `source` is `'prompt'` (the person filled in the form), `'property'` (`el.factors = …`) or `'attribute'` (`data-factors`). `skipped` lists the declared factor keys left unanswered. |
| `rt-start` | `{ time }` | Playback started or resumed: `start()`, `toggle()` or the *Start*/*Resume* button. |
| `rt-step-began` | `{ stepId, time, by }` | A step began. Once per step per run, for every step, replicate instances included. |
| `rt-tick` | `{ time }` | The clock advanced while running, about five times a second. |
| `rt-step-start` | `{ stepId, time }` | A person started a step that waits for them. See [Older step events](#older-step-events). |
| `rt-step-complete` | `{ stepId, time, automatic }` | The player finished a step that waits for a person, or a variable step reached its maximum. See [Older step events](#older-step-events). |
| `rt-step-ended` | `{ stepId, time, by }` | A step ended. Once per step per run, for every step that began. |
| `rt-seek` | `{ from, to }` | `seek()` changed the time, after the step events the seek caused. |
| `rt-pause` | `{ time }` | Playback paused: `pause()`, `toggle()` or the *Pause* button. |
| `rt-complete` | `{ time }` | Every step is done. `time` is the clock tick at which the player first saw every step done (at or just after the last `rt-step-ended`'s `time`); the event itself comes 3 program-seconds after that, when the player stops with status `completed`. Use the last `rt-step-ended` for the exact finish. |
| `rt-stop` | `{}` | `stop()` or the *Stop* button: the run is over and the player rewinds. |
| `rt-run-record` | `{ record, outcome }` | Once per run, with the run record (rhylthyme-spec's runs schema). `outcome` is `'completed'` (right after `rt-complete`), `'aborted'` (on `stop()`, before `rt-stop`) or `'abandoned'` (the run was dropped). |

`stepId` is the id the player runs, so a replicate instance is
`<stepId>-r<n>` (for example `bake-r2`); `el.timings` and `el.stepStates`
use the same ids.

## `by`: what caused a step to begin or end

`rt-step-began`:

| `by` | Cause |
|---|---|
| `plan` | The step's own trigger: program start, an offset, the steps it waits for. |
| `person` | `startStep(id)` or its *Start* button: a manual gate or a negative-offset hand-off. |

`rt-step-ended`, and the run record's `endedBy` for the same step:

| `by` | Run record `endedBy` | Cause |
|---|---|---|
| `timer` | `timer` | A fixed duration ran out, or a variable step reached `maxSeconds`. |
| `person` | `executor` | `completeStep(id)` or its *Done* button. |
| `trigger` | `trigger` | A negative-offset hand-off capped the step ("peel the potatoes 45 min before the roast is out" ends the roast 45 min after the peeling starts). |
| `abort` | `abort` | `stop()` while the step was running. |
| `dropped` | *(none: the step stays open)* | The run was dropped while the step was running. See [Dropped runs](#1-dropped-runs). |

## Ordering

- Step events carry the second of the transition itself, not the tick
  that noticed it. One tick can find several transitions (a slow tick, a
  phone waking up, a fast playback speed); they are delivered in time
  order.
- At the same second, a step's end comes before the begins it makes way
  for, and a zero-length step ends right after its own begin.
- For a gated step, `rt-step-start` comes just before the matching
  `rt-step-began`. On a stopped player, `startStep()` first starts a run, so
  the order is `rt-start`, `rt-step-start`, `rt-step-began`.
- `start()` delivers the steps that begin at second 0 immediately, not on
  the first tick.
- When a handler calls back into the element (`completeStep()`,
  `pause()`, `seek()`, `stop()`), the events that call causes are queued
  behind the batch being delivered, so the order never goes backwards.

## Delivery guarantees

- **Once per run.** Each step fires `rt-step-began` at most once and
  `rt-step-ended` at most once per run, and never an end without a begin.
- **Begins and ends pair.** Every step that began gets exactly one end
  before the run is over: by `timer`, `person` or `trigger` during the
  run, by `abort` on `stop()`, or by `dropped` when the run is dropped. A
  counter of begins minus ends returns to zero.
- **A new run starts clean.** `stop()` ends the run; the next `start()`
  fires every step again from the top.
- **Events agree with the run record.** Every begin and end in the
  events is in the record's `steps[].actual`, with the same times, and
  `by` matches `endedBy` as in the table above. The one exception is
  `dropped`: the record leaves those steps open.

Three situations need a rule of their own.

### 1. Dropped runs

**Rule.** A run is *dropped* when the program is replaced (setting
`program`, or a new `src` once it has loaded) or when the element is
removed from the page for good, while a run is under way. Each step still
running gets one `rt-step-ended` with `by: 'dropped'`, in program order.
Its `time` is the moment of the drop, or the step's own begin if that is
later (after a backward seek): an end is never earlier than its begin.
Then the run record arrives with outcome `'abandoned'`. In the record,
those steps stay open: they have a start and no end.

After the drop, the run is inert: `start()`, `pause()`, `seek()` and
`toggle()` do nothing, and `startStep()` and `completeStep()` return
`false`. Setting a program, or `stop()` (which then fires only
`rt-stop`), moves on, and the next `start()` is a fresh run.

An idle player (never started, stopped or completed) has nothing to
drop: removing it or replacing its program fires nothing.

**Moving is not dropping.** The player waits one microtask after it is
removed. If it is back in the page by then, it was moved: the run goes on
and nothing fires. That covers `appendChild` to another parent, and
`remove()` followed by a re-insert in the same synchronous code. An
`await` between the two (even `await null`), a `setTimeout`, or a
framework that re-inserts in a later render counts as removal for good.
To move a player across an `await`, re-insert it before awaiting, or keep
it in the page and hide it with CSS. Because of the microtask, the
`'abandoned'` run record of a removed player arrives just after
`remove()`, not during it.

**Why.** Without an end, a page that counts what is in progress would
show those steps running forever.

**What it means for your page.**

- `dropped` is not `abort`. Nobody pressed *Stop*: the person may still
  be doing the step; the page just stopped watching. Do not record
  `dropped` as cancelled, and do not use its `time` as a finish time.
- A framework re-render that passes a **new program object** replaces the
  program, even if its content is the same, so the old run ends with
  `dropped`. Keep the object reference stable to keep the run. If you
  only want real stops, skip these events:
  `if (e.detail.by === 'dropped') return;`.
- For the authoritative history, use the run record: it says
  `abandoned`, with those steps open.

### 2. Seeking

**Rule.** `seek(seconds)` (only while paused) never fires a step twice in
a run. A forward seek fires the transitions it passes over. A backward
seek fires no step events, and seeking forward again fires only what has
not fired yet. Every seek that changes the time fires one `rt-seek` with
`{ from, to }`, after the step events it caused. A seek to the current
time, a seek while running, or a seek on a dropped run fires nothing. If
a handler calls `seek()` while an earlier seek's events are being
delivered, the `rt-seek` events still arrive in the order the seeks were
made, and each one's `from` is the previous one's `to`.

**Why.** Step events describe what happened in the run, and moving the
playhead back does not undo it. Re-firing would turn every scrub into
duplicate entries.

**What it means for your page.**

- Record-keeping pages (an ELN, a notifier, an audit log) never see
  duplicates and can ignore `rt-seek`.
- Pages that mirror the playhead (a demo, a training view, a "now"
  highlight) should resync on `rt-seek` by reading `el.stepStates` and
  `el.currentTime`. After a backward seek, steps that ended show as
  pending or active again on screen without any step event saying so.

### 3. `stop()` from inside a handler

**Rule.** Transitions found together (one tick, one seek, one `start()`)
are delivered as one ordered batch. If a handler calls `stop()` in the
middle of it, the rest of the batch is delivered first, then the `abort`
ends of the steps still running, then the run record and `rt-stop`.
Nothing fires after `rt-stop`.

**Why.** The batch describes transitions that already happened before the
stop, and the run record contains them. Cutting the batch short would
make the events disagree with the record.

**What it means for your page.** A handler that stops the run (for
example on the first `rt-step-ended` it sees) still receives the rest of
that batch before the `abort` ends, and `el.status` reads `running` while
they arrive. If your handlers should ignore them, set your own flag when
you call `stop()`.

## Older step events

`rt-step-start` and `rt-step-complete` predate `rt-step-began` and
`rt-step-ended`. They are kept unchanged, but they fire only for some
steps:

| Event | Fires for | Does not fire for |
|---|---|---|
| `rt-step-start` | `startStep(id)` and the *Start* button: manual gates and negative-offset hand-offs | steps that begin on their own trigger |
| `rt-step-complete` | `completeStep(id)` and *Done*; a variable step reaching `maxSeconds` (`automatic: true`); a step capped by a hand-off | fixed-duration steps that simply run out; aborted and dropped steps |

Use them only to react to those specific actions. To follow a whole run,
use `rt-step-began` and `rt-step-ended`.

## Example: an ELN that ticks off its own steps

<!-- snippet: eln-example -->
```js
// stepIds already copied into the ELN, e.g. with itinerary(program)
const eln = new Map();   // stepId -> the ELN's own step id

el.addEventListener('rt-step-began', (e) => {
  markInProgress(eln.get(e.detail.stepId), e.detail.time);
});

el.addEventListener('rt-step-ended', (e) => {
  const { stepId, time, by } = e.detail;
  if (by === 'dropped') return;               // the page stopped watching; the step may go on
  if (by === 'abort') return markCancelled(eln.get(stepId), time);
  markFinished(eln.get(stepId), time);         // timer, person or trigger
});

el.addEventListener('rt-run-record', (e) => saveAttachment('run.json', e.detail.record));
```

## See also

- [Embed Rhylthyme in your app](embedding.md): the player, charts,
  timings and the hosted service.
- [Potion Night](../demo/potion-night/index.html): a toy app whose tower
  scene and spell log listen only to `rt-step-began` and `rt-step-ended`.
- The package README's
  [element section](https://github.com/rhylthyme/rhylthyme-timeline#1-the-rhylthyme-timeline-element-20-beta):
  attributes, methods and translation.
- [Glossary](../getting-started/glossary.md): run, run record, step
  transition, dropped run.
