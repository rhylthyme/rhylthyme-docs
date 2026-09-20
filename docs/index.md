# Welcome to Rhylthyme

Rhylthyme is a framework for defining, visualizing, and executing real-time schedules with resource management.

## Get Started

Open **[www.rhylthyme.com](https://www.rhylthyme.com)** -- no installation needed. Load an example, create a schedule with AI chat, or upload your own program JSON.

An iOS app is also available; its guide will be published here when ready.

## Use It from Claude or ChatGPT

Rhylthyme runs a hosted [MCP server](web-app/mcp.md), so an assistant can build
a schedule in conversation and hand you a live timeline. In Claude Code,
install the plugin (the server plus a skill for authoring schedules):

```
/plugin marketplace add rhylthyme/rhylthyme-mcp
/plugin install rhylthyme@rhylthyme
```

In Claude, ChatGPT, Cursor or any other MCP client, add
`https://mcp.rhylthyme.com/mcp` as a connector. No account or API key is
needed. Details, including what to do when an assistant has no connector, are
on the [MCP Server](web-app/mcp.md) page.

## What is Rhylthyme?

Rhylthyme lets you model complex workflows as **programs** composed of parallel **tracks** and sequential **steps**, with timing dependencies and resource constraints. Programs are defined in JSON and can be visualized as interactive timelines, run with real-time execution controls, or generated from natural language using the AI chat.

### Key Features

- **Interactive Visualization**: DAG, timeline, resource, itinerary, and editor views
- **Real-time Execution**: Start, pause, and control schedules with speed adjustment
- **AI Chat**: Describe what you need and get a complete schedule generated automatically
- **Import Recipes & Protocols**: Pull in programs from Spoonacular, TheMealDB, or protocols.io
- **Manual Controls**: Steps that wait for user interaction -- manual start, variable duration, indefinite tasks
- **Resource Management**: Define constraints (e.g., 2 stove burners, 1 oven) and see utilization over time
- **Save & Share**: Sign in to save programs, share links, and browse public schedules
- **MCP Integration**: A hosted MCP server and a Claude Code plugin, so Claude, ChatGPT and other assistants can author, check and publish schedules

## Learn More

- **[Core Concepts](getting-started/concepts.md)** -- Programs, tracks, steps, durations, triggers, and resources
- **[Quick Start](getting-started/quick-start.md)** -- Walk through the Breakfast Schedule example
- **[Examples](getting-started/examples.md)** -- Built-in examples across kitchen, lab, airport, and bakery environments
- **[Glossary](getting-started/glossary.md)** -- Comprehensive reference of all Rhylthyme terminology
- **[Web App Guide](web-app/index.md)** -- Full documentation for the web app

## For Developers

Rhylthyme also has a CLI for running schedules in the terminal and a Python library for validation and optimization. See the [Development](development/installation.md) section for installation, CLI commands, schema references, and architecture details.

## License

Rhylthyme is open source software licensed under Apache-2.0.
