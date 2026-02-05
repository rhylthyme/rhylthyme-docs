# Architecture

Rhylthyme is a modular system with clear separation of concerns across five packages.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Rhylthyme Ecosystem                          │
├─────────────┬─────────────┬──────────────┬────────────┬────────────┤
│ rhylthyme-  │ rhylthyme-  │ rhylthyme-   │ rhylthyme- │ rhylthyme- │
│ spec        │ cli-runner  │ web          │ importers  │ examples   │
│             │             │              │            │            │
│ Schemas     │ CLI         │ Flask App    │ TheMealDB  │ Programs   │
│ Validation  │ Execution   │ DAG Viz      │ protocols  │ Environ-   │
│ Types       │ Interactive │ MCP Server   │ .io        │ ments      │
│             │ UI          │ AI Chat      │            │            │
└─────────────┴─────────────┴──────────────┴────────────┴────────────┘
```

## Packages

### rhylthyme-spec

Schema definitions and validation logic.

- `schemas/` - JSON schema files for programs and environments
- `validation.py` - Schema and semantic validation
- `types.py` - Python type definitions

### rhylthyme-cli-runner

Command-line interface and interactive program execution.

- `cli.py` - Click-based CLI with commands: validate, run, plan, environments
- `program_runner.py` - Real-time program execution engine with terminal UI
- `program_planner.py` - Schedule optimization
- `validate_program.py` - Program validation
- `environment_loader.py` - Environment catalog loading
- `environment_schemas.py` - Environment type definitions

### rhylthyme-web

Web visualization, MCP server, and AI chat.

- `app.py` - Flask application with embedded HTML/JS (single-file app)
- `web/web_visualizer.py` - D3.js DAG visualization generator
- `mcp/server.py` - MCP server for AI tool integration
- `rhylthyme/` - Core library for program manipulation

### rhylthyme-importers

Plugins for importing programs from external sources.

- `base.py` - BaseImporter class and ImporterRegistry
- `themealdb.py` - Import recipes from TheMealDB API
- `protocolsio.py` - Import lab protocols from protocols.io API

### rhylthyme-examples

Working examples of programs and environment catalogs.

- `programs/` - Example program JSON files
- `environments/` - Environment catalog JSON files

## Data Flow

### CLI Execution

```
User Input → CLI Parsing → Program Loading → Validation → Execution → Interactive UI
                                  ↑
                          Environment Loading (optional)
```

### Web Flow

```
Browser → Flask App → AI Chat (Anthropic API) → Tool Calls → Importers → DAG Visualization
```

### Import Flow

```
External API (TheMealDB/protocols.io) → Importer Plugin → Rhylthyme Program JSON → Visualization
```

## Key Design Decisions

1. **Schema-First**: JSON schemas define all data structures; validation is automatic
2. **Optional Environments**: Programs run without environments; add them for resource validation
3. **Modular Packages**: Each concern is a separate installable package
4. **Single-File Web App**: `app.py` contains HTML, CSS, JS, and all endpoints for easy deployment
5. **Plugin Architecture**: Importers use a registry pattern for extensibility

## Related Documentation

- [Contributing Guide](contributing.md)
- [CLI Reference](../api/cli.md)
- [Program Schema](../api/schema.md)
