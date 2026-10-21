---
template: home.html
hide:
  - toc
---

## Start here

<div class="grid cards rh-start" markdown>

-   :material-web:{ .lg } __Use the web app__

    ---

    Open [www.rhylthyme.com](https://www.rhylthyme.com). No installation.
    Load an example, describe a schedule to the AI chat, or upload your own
    program JSON.

    [:octicons-arrow-right-24: Web app guide](web-app/index.md)

-   :material-robot-happy-outline:{ .lg } __Use it from an assistant__

    ---

    A hosted MCP server lets Claude, ChatGPT, Cursor and other assistants
    build a schedule in conversation and hand you a live timeline.

    [:octicons-arrow-right-24: MCP server](web-app/mcp.md)

-   :material-lightbulb-on-outline:{ .lg } __Learn the model__

    ---

    Programs, tracks, steps, durations, triggers and resources: the handful
    of ideas every schedule is built from.

    [:octicons-arrow-right-24: Core concepts](getting-started/concepts.md)

-   :material-console:{ .lg } __Build on it__

    ---

    A CLI that runs schedules in the terminal, a Python library for
    validation and planning, JSON Schemas, and an embeddable player.

    [:octicons-arrow-right-24: Development](development/installation.md)

</div>

## Add it to your assistant

In Claude Code, install the plugin (the server plus a skill for authoring
schedules):

These are two commands. Send the first on its own:

```
/plugin marketplace add rhylthyme/rhylthyme-mcp
```

then, once it says the marketplace was added, the second:

```
/plugin install rhylthyme@rhylthyme
```

In Claude, ChatGPT, Cursor or any other MCP client, add
`https://mcp.rhylthyme.com/mcp` as a connector. No account or API key is
needed. Details, including what to do when an assistant has no connector, are
on the [MCP Server](web-app/mcp.md) page.

An iOS app is also available; its guide will be published here when ready.

## What is Rhylthyme?

Rhylthyme lets you model complex workflows as **programs** composed of
parallel **tracks** and sequential **steps**, with timing dependencies and
resource constraints. Programs can be visualized as interactive timelines, run
with real-time execution controls, or generated from natural language using the
AI chat.

<div class="grid cards rh-features" markdown>

-   :material-chart-timeline-variant: __Interactive visualization__

    DAG, timeline, resource, itinerary and editor views.

-   :material-play-circle-outline: __Real-time execution__

    Start, pause and control schedules, with speed adjustment.

-   :material-chat-processing-outline: __AI chat__

    Describe what you need and get a complete schedule.

-   :material-import: __Import recipes and protocols__

    Pull in programs from Spoonacular, TheMealDB or protocols.io.

-   :material-gesture-tap-button: __Manual controls__

    Steps that wait for you: manual start, variable duration, indefinite tasks.

-   :material-stove: __Resource management__

    Constraints such as 2 burners and 1 oven, and utilization over time.

-   :material-share-variant-outline: __Save and share__

    Sign in to save programs, share links and browse public schedules.

-   :material-connection: __MCP integration__

    A hosted MCP server and a Claude Code plugin for authoring, checking and
    publishing schedules.

</div>

## Learn more

- **[Quick Start](getting-started/quick-start.md)**: walk through the Breakfast Schedule example
- **[Examples](getting-started/examples.md)**: built-in examples across kitchen, lab, airport and bakery environments
- **[Glossary](getting-started/glossary.md)**: every Rhylthyme term in one place

## License

Rhylthyme is open source software licensed under Apache-2.0.
