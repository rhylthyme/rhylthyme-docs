# Welcome to Rhylthyme

Rhylthyme is a framework for defining, visualizing, and executing real-time schedules with resource management.

## Get Started

Open **[www.rhylthyme.com](https://www.rhylthyme.com)** -- no installation needed. Load an example, create a schedule with AI chat, or upload your own program JSON.

Rhylthyme is also available as an [iOS app](ios-app/index.md).

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
- **MCP Integration**: Use Rhylthyme as a tool in Claude Desktop or Claude Code

## Learn More

- **[Core Concepts](getting-started/concepts.md)** -- Programs, tracks, steps, durations, triggers, and resources
- **[Quick Start](getting-started/quick-start.md)** -- Walk through the Breakfast Schedule example
- **[Examples](getting-started/examples.md)** -- Built-in examples across kitchen, lab, airport, and bakery environments
- **[Web App Guide](web-app/index.md)** -- Full documentation for the web app
- **[iOS App Guide](ios-app/index.md)** -- Full documentation for the iOS app

## For Developers

Rhylthyme also has a CLI for running schedules in the terminal and a Python library for validation and optimization. See the [Development](development/installation.md) section for installation, CLI commands, schema references, and architecture details.

## License

Rhylthyme is open source software licensed under Apache-2.0.
