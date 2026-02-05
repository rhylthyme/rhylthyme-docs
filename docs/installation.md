# Installation Guide

## Prerequisites

- **Python 3.12 or higher**
- pip (Python package installer)
- Git (for cloning repositories)

## Installation

The Rhylthyme packages are not yet on PyPI and must be installed from their Git repositories.

### 1. Create a Virtual Environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Core Packages

Install in order (rhylthyme-cli-runner depends on rhylthyme-spec):

```bash
# Clone and install
git clone https://github.com/rhylthyme/rhylthyme-spec.git
git clone https://github.com/rhylthyme/rhylthyme-cli-runner.git

pip install -e ./rhylthyme-spec
pip install -e ./rhylthyme-cli-runner
```

### 3. Verify Installation

```bash
rhylthyme --help
```

### 4. Optional Packages

```bash
# Example programs and environments
git clone https://github.com/rhylthyme/rhylthyme-examples.git

# Web visualization and MCP server
git clone https://github.com/rhylthyme/rhylthyme-web.git
pip install -e ./rhylthyme-web

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

rhylthyme-web/               # Web visualization
├── src/rhylthyme_web/
│   ├── app.py              # Flask web application
│   ├── web/                # DAG visualizer
│   ├── mcp/                # MCP server
│   └── rhylthyme/          # Core library
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

## Development Installation

```bash
pip install -e ./rhylthyme-spec[dev]
pip install -e ./rhylthyme-cli-runner[dev]
```
