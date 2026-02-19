# Manual Controls

Rhylthyme supports interactive manual controls during program execution, allowing steps to be started or completed by the user rather than running on fixed timers. This is essential for real-world workflows where certain tasks require human judgment about when to begin or end.

The **Manual Controls Demo** example (available in the sidebar) demonstrates all three types of manual interaction.

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
