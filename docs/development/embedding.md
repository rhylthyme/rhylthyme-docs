# Embed Rhylthyme in your app

Everything on this page uses code that already ships: the
[`@rhylthyme/timeline`](https://github.com/rhylthyme/rhylthyme-timeline)
package (timing engine, SVG renderer and the `<rhylthyme-timeline>` player
element, zero dependencies) and the hosted MCP server at
`mcp.rhylthyme.com`. Pick the section that matches what you need:

| You want | Use | Runs |
|---|---|---|
| A playable timeline with timers, Start/Pause and Done buttons | [Live player](#1-live-player) | browser |
| A picture of the schedule | [Static chart](#2-static-chart) | browser or Node |
| Start and end times to drive your own UI | [Timings only](#3-timings-only) | browser or Node |
| Validation, analysis or a shareable link from your server | [Hosted service](#4-hosted-service-from-a-backend) | your backend |

The examples load the package from jsDelivr, pinned to `2.0.0-beta.5`.
In a bundled app, `npm install @rhylthyme/timeline@2.0.0-beta.5` instead.
Each HTML snippet runs as-is when saved to an empty `.html` file and opened
in a browser.

## 1. Live player

Two script tags (the engine first, then the element) and one tag:

```html
<!doctype html>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/@rhylthyme/timeline@2.0.0-beta.5/src/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@rhylthyme/timeline@2.0.0-beta.5/src/element.js"></script>

<rhylthyme-timeline
  src="https://raw.githubusercontent.com/rhylthyme/rhylthyme/main/examples/recipe/birthday-party.json"
  mode="player" speed="60" time-format="minutes"></rhylthyme-timeline>

<script>
  const el = document.querySelector('rhylthyme-timeline');
  el.addEventListener('rt-load', () => console.log('loaded', el.timings));
  el.addEventListener('rt-step-start', (e) => console.log('started', e.detail.stepId, 'at', e.detail.time));
  el.addEventListener('rt-step-complete', (e) => console.log('done', e.detail.stepId, 'at', e.detail.time));
  el.addEventListener('rt-complete', (e) => console.log('all done at', e.detail.time));
</script>
```

`src` is fetched with `fetch()`, so it must be same-origin or served with
CORS (raw.githubusercontent.com is). To pass a program you already hold,
set the property instead: `el.program = programObject`.

| Attribute | Values |
|---|---|
| `src` (or the `program` property) | a URL to fetch, or a program object |
| `mode` | `player` (default) or `static` (the chart alone, no controls or cursor) |
| `speed` | playback multiplier, default `1` |
| `time-format` | `minutes` (`mm:ss`), `seconds`, `hours` (`h:mm:ss`), `clock` (wall time) |
| `start-at` | ISO 8601 start time for `clock` |
| `theme` | `light`, `dark`, `cookbook`; or set the CSS variables `--rt-bg`, `--rt-fg`, `--rt-accent`, `--rt-border`, `--rt-panel`, `--rt-muted` |

Methods: `start()`, `pause()`, `stop()`, `toggle()`, `seek(seconds)` (while
paused), `startStep(id)`, `completeStep(id)`. Read-only properties:
`currentTime`, `status`, `timings`, `stepStates`.

Events bubble and cross the shadow boundary; times are seconds from the
start of the program, in `event.detail.time`:

| Event | When | `detail` |
|---|---|---|
| `rt-load` | the program is loaded and planned | `program` |
| `rt-start`, `rt-pause`, `rt-tick` | playback starts, pauses, advances | `time` |
| `rt-stop` | playback is stopped | |
| `rt-step-start` | a person starts a step that waits for them: a manual gate or a negative-offset hand-off (its *Start* button, or `startStep(id)`). Steps that start on their own do not fire it; read `stepStates` on `rt-tick` for those. | `stepId`, `time` |
| `rt-step-complete` | a step that waits for a person is finished (*Done*, or `completeStep(id)`), or a variable step reaches its maximum | `stepId`, `time`, `automatic` |
| `rt-complete` | every step is done | `time` |

### In React

The element is a standard Web Component, so React needs no wrapper
package. `element.js` reads the engine from `window.Rhylthyme`, which a
bundler does not set (it imports the engine as a module), so put it there
first in a small setup module:

```js
// rhylthyme-setup.js
import Rhylthyme from '@rhylthyme/timeline';
window.Rhylthyme = Rhylthyme;
```

Then a component that sets the program as a property and forwards two
events. It works in React 18 and 19:

```jsx
import { useEffect, useRef } from 'react';
import './rhylthyme-setup.js';           // must come before the element
import '@rhylthyme/timeline/element';   // registers <rhylthyme-timeline>

export function RhylthymeTimeline({ program, speed = 1, onStepComplete, onComplete }) {
  const ref = useRef(null);

  useEffect(() => { ref.current.program = program; }, [program]);

  useEffect(() => {
    const el = ref.current;
    const stepDone = (e) => onStepComplete?.(e.detail);
    const allDone = (e) => onComplete?.(e.detail);
    el.addEventListener('rt-step-complete', stepDone);
    el.addEventListener('rt-complete', allDone);
    return () => {
      el.removeEventListener('rt-step-complete', stepDone);
      el.removeEventListener('rt-complete', allDone);
    };
  }, [onStepComplete, onComplete]);

  return <rhylthyme-timeline ref={ref} mode="player" speed={speed} />;
}
```

Use it as `<RhylthymeTimeline program={program} onComplete={() => ...} />`.
Without a bundler, load the two script tags from section 1 in your HTML
and drop the three imports.

## 2. Static chart

In the browser, `renderTimeline(container, program, options)` draws the
same SVG the CLI's `rhylthyme render` writes:

```html
<!doctype html>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/@rhylthyme/timeline@2.0.0-beta.5/src/index.js"></script>

<div id="chart"></div>

<script>
  fetch('https://raw.githubusercontent.com/rhylthyme/rhylthyme/main/examples/recipe/birthday-party.json')
    .then((r) => r.json())
    .then((program) => {
      Rhylthyme.renderTimeline(document.getElementById('chart'), program, { style: 'web', palette: 'vivid' });
    });
</script>
```

In Node, `renderTimelineSvg(program, options)` returns the SVG as a string
(`npm install @rhylthyme/timeline@2.0.0-beta.5`):

```js
const fs = require('fs');
const { renderTimelineSvg } = require('@rhylthyme/timeline');

const program = JSON.parse(fs.readFileSync('birthday-party.json', 'utf8'));
fs.writeFileSync('birthday-party.svg', renderTimelineSvg(program, { style: 'publication' }));
```

The module is UMD: `require()` gives every function by name, and an ES
module import gives them on the default export
(`import Rhylthyme from '@rhylthyme/timeline'`). Options include `style`
(`classic`, `web`, `publication`), `palette`, `colorBy` (`track` or `task`),
`startAt` (wall-clock axis), `legend`, `title` and `width`; the full table
is in the [package README](https://github.com/rhylthyme/rhylthyme-timeline#3-the-static-svg-rendertimelinesvg-node-and-rendertimeline-browser).

## 3. Timings only

`computeStepTimings(program)` resolves every trigger and returns start and
end seconds per step, for drawing your own UI or scheduling notifications:

```html
<!doctype html>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/@rhylthyme/timeline@2.0.0-beta.5/src/index.js"></script>

<pre id="out"></pre>

<script>
  const program = {
    schemaVersion: '0.1.0',
    programId: 'tea',
    name: 'Tea and toast',
    tracks: [
      { trackId: 'tea', name: 'Tea', steps: [
        { stepId: 'boil', name: 'Boil water', startTrigger: { type: 'programStart' },
          duration: { type: 'fixed', seconds: 180 } },
        { stepId: 'steep', name: 'Steep', startTrigger: { type: 'afterStep', stepId: 'boil' },
          duration: { type: 'fixed', seconds: '4m' } },
      ] },
      { trackId: 'toast', name: 'Toast', steps: [
        { stepId: 'toast', name: 'Toast bread', startTrigger: { type: 'afterStep', stepId: 'boil', offsetSeconds: '-2m' },
          duration: { type: 'fixed', seconds: 150 } },
      ] },
    ],
  };

  const timings = Rhylthyme.computeStepTimings(program);
  // { boil:  { start: 0,   end: 180, duration: 180, trackId: 'tea',   resolved: true },
  //   steep: { start: 180, end: 420, ... },
  //   toast: { start: 60,  end: 210, ... } }
  document.getElementById('out').textContent = JSON.stringify(timings, null, 2);
</script>
```

Pass `{ actual: { stepId: { start, end } } }` as a second argument to
re-plan around what has really happened; the player does this on every
tick.

## 4. Hosted service from a backend

`mcp.rhylthyme.com/mcp` is an MCP server, and a single JSON-RPC `POST` calls
any tool with no session handshake and no account. Send
`Accept: application/json` to get a plain JSON reply. The endpoint does not
send CORS headers, so call it from your server, not from page JavaScript.

| Tool | Arguments | `result.structuredContent` |
|---|---|---|
| `validate_program` | `program` | `valid`, `errors`, `warnings`, `stats` |
| `analyze_schedule` | `program`, optional `finishAt` or `startAt` (ISO 8601) | `makespanSeconds`, `criticalPath`, `bindingConstraints`, `resourceConflicts`, `steps` (with wall-clock `startAt` when you pass a time), `wallClock` |
| `visualize_schedule` | `program` | `url` (a public live-timeline link), `shareId`, `imageUrl`, `makespanSeconds` |

`visualize_schedule` publishes: anyone with the link can open the timeline.

With curl:

```bash
curl -s https://mcp.rhylthyme.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "jsonrpc": "2.0", "id": 1, "method": "tools/call",
    "params": { "name": "validate_program", "arguments": { "program": {
      "schemaVersion": "0.1.0", "programId": "tea", "name": "Tea",
      "tracks": [{ "trackId": "tea", "name": "Tea", "steps": [
        { "stepId": "boil", "name": "Boil water", "startTrigger": { "type": "programStart" },
          "duration": { "type": "fixed", "seconds": 180 } } ] }] } } }
  }'
```

With `fetch` (Node 18 or newer, or any server runtime with `fetch`):

```js
async function rhylthyme(tool, args) {
  const res = await fetch('https://mcp.rhylthyme.com/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: tool, arguments: args } }),
  });
  const reply = await res.json();
  if (reply.error) throw new Error(reply.error.message);
  if (reply.result.isError) throw new Error(reply.result.content[0].text);
  return reply.result.structuredContent;
}

const program = {
  schemaVersion: '0.1.0', programId: 'tea', name: 'Tea',
  tracks: [{ trackId: 'tea', name: 'Tea', steps: [
    { stepId: 'boil', name: 'Boil water', startTrigger: { type: 'programStart' },
      duration: { type: 'fixed', seconds: 180 } },
  ] }],
};

const check = await rhylthyme('validate_program', { program });
console.log(check.valid, check.errors);

const plan = await rhylthyme('analyze_schedule', { program, finishAt: '2026-11-26T18:00:00-05:00' });
console.log(plan.makespanSeconds, plan.steps.map((s) => [s.name, s.startAt]));

// Publishes a public link:
// const { url } = await rhylthyme('visualize_schedule', { program });
```

Save it as `rhylthyme.mjs` and run `node rhylthyme.mjs`. Every tool,
including the catalog search and account tools, is listed in the
[MCP server reference](../web-app/mcp.md).
