# Installation

This page covers installing the Rhylthyme CLI tools for local development and program execution. The web app at [www.rhylthyme.com](https://www.rhylthyme.com) requires no installation.

## Prerequisites

- **Python 3.12 or higher**
- pip (Python package installer)
- Git (for cloning repositories)

## Install Core Packages

```bash
# Create a virtual environment
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Clone and install (rhylthyme-cli-runner depends on rhylthyme-spec)
git clone https://github.com/rhylthyme/rhylthyme-spec.git
git clone https://github.com/rhylthyme/rhylthyme-cli-runner.git

pip install -e ./rhylthyme-spec
pip install -e ./rhylthyme-cli-runner
```

## Verify Installation

```bash
rhylthyme --help
```

## Your First Program

Create a simple program and run it in the terminal:

```bash
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

## Common CLI Operations

```bash
# Validate a program
rhylthyme validate program.json

# Run a program interactively
rhylthyme run program.json

# Run with environment for resource validation
rhylthyme run program.json -e environments/kitchen.json

# Optimize a program schedule
rhylthyme plan input.json optimized.json

# Run at 10x speed with auto-start
rhylthyme run program.json --time-scale 10 --auto-start
```

See the [CLI Commands Reference](cli.md) for the full list of commands and options.

## Optional Packages

```bash
# Example programs and environments
git clone https://github.com/rhylthyme/rhylthyme-examples.git

# Import plugins (TheMealDB, protocols.io)
git clone https://github.com/rhylthyme/rhylthyme-importers.git
pip install -e ./rhylthyme-importers
```

## Package Overview

```
rhylthyme-spec/              # Schema definitions and validation
├── src/rhylthyme_spec/
│   └── schemas/             # JSON schemas
└── pyproject.toml

rhylthyme-cli-runner/        # Command-line interface
├── src/rhylthyme_cli_runner/
│   ├── cli.py              # Main CLI interface
│   ├── program_runner.py   # Program execution
│   ├── program_planner.py  # Schedule optimization
│   ├── validate_program.py # Program validation
│   ├── environment_loader.py  # Environment management
│   └── environment_schemas.py # Environment type schemas
└── pyproject.toml

rhylthyme-importers/         # Import plugins
├── src/rhylthyme_importers/
│   ├── themealdb.py        # TheMealDB importer
│   └── protocolsio.py      # protocols.io importer
└── pyproject.toml

rhylthyme-examples/          # Example programs and environments
├── programs/               # Example programs
└── environments/           # Environment catalogs
```

## Development Installation

```bash
pip install -e ./rhylthyme-spec[dev]
pip install -e ./rhylthyme-cli-runner[dev]
```

## Troubleshooting

### "Command not found: rhylthyme"

- Ensure the virtual environment is activated
- Verify installation: `pip list | grep rhylthyme`
- Reinstall: `pip install -e ./rhylthyme-cli-runner`

### Import errors for rhylthyme_spec

- Install the spec package first: `pip install -e ./rhylthyme-spec`

### Schema validation errors

- Ensure the schema package is up to date
- Use `rhylthyme validate program.json --verbose` for details
