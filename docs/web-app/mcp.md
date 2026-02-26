# MCP Server

The Rhylthyme MCP (Model Context Protocol) server lets AI assistants like Claude create and visualize Rhylthyme schedules directly. MCP is an open standard that enables AI models to call external tools — in this case, Rhylthyme's visualization and recipe import capabilities.

## Setup Requirements

**Local installation is required** for full MCP functionality. The remote endpoint at `mcp.rhylthyme.com` is a status/information endpoint only.

## Local Server Installation

### Installation

```bash
pip install "rhylthyme[mcp]"
```

### Claude Desktop Setup

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rhylthyme": {
      "command": "rhylthyme-mcp"
    }
  }
}
```

Restart Claude Desktop after saving the config.

### Claude Code Setup

For Claude Code (CLI tool), add a `.mcp.json` file to your project root:

```json
{
  "mcpServers": {
    "rhylthyme": {
      "command": "rhylthyme-mcp"
    }
  }
}
```

### Testing the Connection

After setup, test the connection by asking Claude:
- "What Rhylthyme tools are available?"
- "Create a simple breakfast schedule"

The server runs locally and opens visualizations directly in your browser.

## Remote Status Endpoint

The endpoint `https://mcp.rhylthyme.com` provides status information and setup instructions but does **not** provide functional MCP tools. It will direct you to install the local server for actual functionality.

**For web-based scheduling without MCP setup, visit [www.rhylthyme.com](https://www.rhylthyme.com)**

## Available Tools

### `visualize_schedule`

Creates an interactive timeline visualization from a Rhylthyme program JSON.

Claude builds the program JSON from your natural language description, then calls this tool to render it. You describe what you want ("Plan a Thanksgiving dinner for 8 people"), and Claude handles the JSON structure.

**What it does:**

- Validates the program structure
- Sends it to rhylthyme.com for D3.js rendering
- Returns a summary of tracks, steps, and timing

### `import_from_source`

Imports recipes or lab protocols from external databases.

**Supported sources:**

| Source | Content | Actions |
|--------|---------|---------|
| Spoonacular | Recipes with nutrition and equipment | search, import, random |
| TheMealDB | Recipe database | search, import, random |
| protocols.io | Laboratory protocols | search, import |

**Workflow:** Claude searches for recipes, imports the best matches, then composes them into a unified multi-track schedule. For multi-dish meals, all dishes are combined into a single visualization with coordinated timing.

## Example Usage

Try these prompts in Claude Desktop or claude.ai after connecting:

- "Create a schedule for making chicken tikka masala with naan bread"
- "Plan a Thanksgiving dinner with turkey, mashed potatoes, green beans, and pumpkin pie"
- "Import a random recipe from Spoonacular and visualize it"
- "Schedule an RNA extraction protocol"

Claude will confirm resource constraints (e.g., "You have 1 oven, 4 stovetop burners — correct?") before generating the visualization.

## Compatibility

The local Rhylthyme MCP server works with MCP-compatible clients that support command-based servers:

- [Claude Desktop](https://claude.ai/download) ✅
- [Claude Code](https://claude.ai/code) ✅ (via `.mcp.json`)
- Any client supporting MCP stdio transport ✅

**Note:** HTTP-based MCP clients may not work with the command-based local server. For web-based access, use [www.rhylthyme.com](https://www.rhylthyme.com) directly.
