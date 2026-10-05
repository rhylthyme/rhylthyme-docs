# Lab Instruments

A Rhylthyme program can drive lab instruments: a step names a **tool** and
what to send it, and the runner (`rhylthyme run --workcell`) sends it at the
right moment, ends the step on the instrument's reply or its own timer, and
records every call and reply. Instruments run **simulated** unless you ask
for a live run.

Two families of instruments are supported, each through its own package:

| Install | Instruments | Guide |
|---|---|---|
| `pip install "rhylthyme[labmcp]"` | [LabMCP](https://github.com/K-Dense-AI/lab-instrument-mcps) servers: balances, stirrers, syringe pumps, sensors, spectrometers, Opentrons, and SiLA 2, SCPI and Modbus devices | [rhylthyme-labmcp guide](https://github.com/rhylthyme/rhylthyme-labmcp/blob/main/docs/guide.md) |
| `pip install "rhylthyme[galago]"` | [galago-tools](https://github.com/sciencecorp/galago-tools) gRPC tools: shakers, incubators, plate readers, liquid handlers, robot arms | [rhylthyme-galago](https://github.com/rhylthyme/rhylthyme-galago) |

## Workcells

Programs name tools by role (`"tool": "balance"`). A local **workcell** file
says what each tool is and where it is; it never leaves the lab machine, and
Rhylthyme scrubs its addresses from everything it publishes. One workcell can
mix both families:

```json
{
  "id": "bench-1",
  "tools": [
    { "name": "balance", "driver": "labmcp", "server": "mettler-toledo",
      "address": "/dev/ttyUSB0", "limits": { "max_series_duration_s": 300 } },
    { "name": "shaker", "type": "bioshake", "host": "localhost", "port": 50710 }
  ]
}
```

`"driver": "labmcp"` tools are LabMCP servers; tools without a `driver` are
galago-tools tools.

## Instrument steps

The full reference is the program schema's
[`instrument`](schema.md#instrument-steps).

```json
{ "stepId": "tare", "name": "Tare the balance",
  "instrument": { "tool": "balance", "command": "tare" },
  "startTrigger": { "type": "programStart" } }
```

With `command`, the step sends one call when it starts and ends when the
instrument replies. A step can also send **phase actions**, each
`{command, params, tool?}`:

- `start`: in order when the step starts (and again on retry);
- `until`: one call whose reply ends the step, instead of `command`;
- `end`: in order when the step ends, by timer, by the operator or on a reply;
- `onAbort`: if the step fails or the run is aborted, instead of the default
  safe stops.

```json
{ "stepId": "heat-stir", "name": "Heat to 40 °C and stir for 2 minutes",
  "duration": { "type": "fixed", "seconds": 120 },
  "instrument": { "tool": "stirrer",
    "start": [ { "command": "set_temperature", "params": { "temperature_c": 40 } },
               { "command": "start_heating" }, { "command": "start_stirring" } ],
    "end":   [ { "command": "stop_heating" } ] } }
```

An action may name another tool; the step holds every tool it names.

## Checking and planning

```bash
rhylthyme validate program.json --workcell lab.json
rhylthyme plan program.json planned.json --workcell lab.json
```

`validate` checks every call against the instrument's own definition (galago
commands; LabMCP's catalogue of every server's tools, input schemas and
limits), the workcell's limits and command policies. Without a workcell, a
step that names its `toolType` (`bioshake`, `labmcp-ika`) is checked the same
way, also by the hosted [MCP server](../web-app/mcp.md). A step that ends on a
reply and has no duration is planned with an estimate from its params,
flagged in `metadata.durationEstimate` and drawn with `≈` on timelines.

## Running safely

- **Limits** in the workcell are enforced by the instrument's server: it
  refuses any request beyond them, with nothing sent.
- **When a step fails**, its `onAbort` actions are sent, or else each touched
  instrument's default stops (for LabMCP, its safety tools: stop, terminate,
  outputs off). Then the operator retries, marks it done or aborts.
- **Aborting** a run, or quitting it part-way, stops every instrument it used.
- **Pausing** the schedule pauses instruments that can hold their work.
- **Live runs** (`--live`) show a pre-flight first, with each instrument's
  identity, mode and limits and every hazardous action, refuse to start
  unless every instrument is ready, and need you to type `live`.

Every call, reply and stop is in the [run record](runs-schema.md#instrument-calls).

## From rhylthyme.com

`rhylthyme bridge program.json --workcell lab.json` runs a program and shows
it live on your Bridges page, where you can pause, resume, retry or skip a
failed step and abort. `rhylthyme bridge --workcell lab.json` waits for runs
started from the page. Addresses never leave the lab machine.
