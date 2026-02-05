# Quick Start Guide

## Install

```bash
# Requires Python >= 3.12
python3.12 -m venv .venv && source .venv/bin/activate

git clone https://github.com/rhylthyme/rhylthyme-spec.git
git clone https://github.com/rhylthyme/rhylthyme-cli-runner.git

pip install -e ./rhylthyme-spec
pip install -e ./rhylthyme-cli-runner
```

## Your First Program

Create a file `pasta.json`:

```json
{
  "programId": "pasta-dinner",
  "name": "Pasta Dinner",
  "tracks": [
    {
      "trackId": "cooking",
      "name": "Cooking",
      "steps": [
        {
          "stepId": "boil-water",
          "name": "Boil Water",
          "task": "boiling",
          "duration": {"type": "fixed", "seconds": 300},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "cook-pasta",
          "name": "Cook Pasta",
          "task": "cooking",
          "duration": {"type": "fixed", "seconds": 600},
          "startTrigger": {"type": "afterStep", "stepId": "boil-water"}
        },
        {
          "stepId": "make-sauce",
          "name": "Make Sauce",
          "task": "cooking",
          "duration": {"type": "fixed", "seconds": 900},
          "startTrigger": {"type": "programStart"}
        }
      ]
    }
  ]
}
```

## Validate and Run

```bash
# Validate the program
rhylthyme validate pasta.json

# Run interactively
rhylthyme run pasta.json
```

## Interactive Controls

| Key | Action |
|-----|--------|
| Space | Start/pause program |
| S | Step through execution |
| T | Trigger manual steps |
| Q | Quit |
| +/- | Adjust time scale |
| O | Change sort order |

## CLI Commands

| Command | Description |
|---------|-------------|
| `rhylthyme validate FILES...` | Validate program files against the schema |
| `rhylthyme run PROGRAM` | Run a program with interactive UI |
| `rhylthyme plan INPUT OUTPUT` | Optimize a program schedule |
| `rhylthyme environments` | List available environment catalogs |
| `rhylthyme validate-environments` | Validate environment catalog files |
| `rhylthyme environment-info TYPE` | Show info about an environment type |

## Common Options

```bash
# Validate with verbose output, JSON format, strict mode
rhylthyme validate program.json --verbose --json --strict

# Validate against a specific schema version
rhylthyme validate program.json --schema path/to/schema.json

# Run with environment for resource validation
rhylthyme run program.json -e environments/kitchen.json

# Run with time scaling and auto-start
rhylthyme run program.json --time-scale 10 --auto-start

# Optimize a program
rhylthyme plan input.json optimized.json -e environments/kitchen.json
```

## Using Environments (Optional)

Environments model real-world resource constraints. They are completely optional.

```bash
# Clone examples with environments
git clone https://github.com/rhylthyme/rhylthyme-examples.git
cd rhylthyme-examples

# List available environments
rhylthyme environments

# Run with resource validation
rhylthyme run programs/pasta_dinner.json -e environments/kitchen.json
```

## Web Visualization

```bash
# Install the web package
pip install -e ./rhylthyme-web

# Run the web server
rhylthyme-web

# Open http://127.0.0.1:5000 in your browser
```

The web UI provides DAG visualization and an AI chat interface that can import recipes from TheMealDB and lab protocols from protocols.io.

## Next Steps

- [Environment Guide](environment-guide.md) - Working with resource constraints
- [Examples](examples.md) - Real-world examples
- [CLI Reference](api/cli.md) - Full command documentation
- [Program Schema](api/schema.md) - Complete schema reference
