# Welcome to Rhylthyme

A framework for defining, validating, and executing real-time program schedules with resource management.

## What is Rhylthyme?

Rhylthyme lets you model complex workflows as **programs** composed of **tracks** and **steps**, with timing dependencies and optional resource constraints. Programs are defined in JSON and can be run interactively in the terminal, visualized in a web UI, or imported from external sources like recipe databases and lab protocols.

### Key Features

- **Program Definition**: Define workflows using JSON with tracks, steps, and timing dependencies
- **Real-time Execution**: Interactive terminal UI for monitoring and controlling program execution
- **Web Visualization**: Browser-based DAG visualization and AI chat for program creation
- **Import Plugins**: Import programs from TheMealDB, protocols.io, and other sources
- **Resource Management**: Optional environment catalogs for resource validation
- **Validation**: Schema validation and semantic checks
- **Optimization**: Built-in schedule optimization to reduce resource contention

## Quick Start

```bash
# Requires Python >= 3.12

# Clone and install core packages
git clone https://github.com/rhylthyme/rhylthyme-spec.git
git clone https://github.com/rhylthyme/rhylthyme-cli-runner.git

pip install -e ./rhylthyme-spec
pip install -e ./rhylthyme-cli-runner

# Create a simple program
cat > hello.json << 'EOF'
{
  "programId": "hello-world",
  "name": "Hello World",
  "tracks": [
    {
      "trackId": "main",
      "name": "Main Track",
      "steps": [
        {
          "stepId": "greet",
          "name": "Greet",
          "task": "greeting",
          "duration": {"type": "fixed", "seconds": 5},
          "startTrigger": {"type": "programStart"}
        }
      ]
    }
  ]
}
EOF

# Run the program
rhylthyme run hello.json
```

## Packages

Rhylthyme is composed of several modular packages:

| Package | Description |
|---------|-------------|
| [rhylthyme-spec](https://github.com/rhylthyme/rhylthyme-spec) | JSON schema definitions and validation |
| [rhylthyme-cli-runner](https://github.com/rhylthyme/rhylthyme-cli-runner) | Command-line interface and interactive program execution |
| [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) | Example programs and environment catalogs |
| [rhylthyme-web](https://github.com/rhylthyme/rhylthyme-web) | Web visualization, MCP server, and AI chat interface |
| [rhylthyme-importers](https://github.com/rhylthyme/rhylthyme-importers) | Import plugins for TheMealDB, protocols.io, and more |

## Interactive Features

When you run a program with `rhylthyme run`, you get an interactive terminal UI with:

- **Real-time Monitoring**: Watch program execution as it happens
- **Manual Control**: Trigger steps manually when needed
- **Resource Tracking**: Monitor resource usage and constraints
- **Time Scaling**: Adjust execution speed for testing

## Environment Support

Environments are **completely optional** and model real-world resource constraints:

- **Kitchen**: Stove burners, prep stations, cleanup
- **Laboratory**: Bench space, equipment, safety protocols
- **Airport**: Runways, gates, taxiways
- **Bakery**: Mixers, ovens, work benches

## License

Rhylthyme is open source software licensed under Apache-2.0.
