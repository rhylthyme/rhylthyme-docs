# MCP Server

The Rhylthyme MCP (Model Context Protocol) server lets AI assistants like Claude create and visualize Rhylthyme schedules directly. MCP is an open standard that enables AI models to call external tools — in this case, Rhylthyme's visualization and recipe import capabilities.

## Remote Server (Zero Install)

The fastest way to connect Rhylthyme to Claude is through the hosted remote server at `mcp.rhylthyme.com`. No installation required.

### Claude Desktop

1. Open **Claude Desktop**
2. Go to **Settings** > **Connectors** > **Add custom connector**
3. Enter the URL: `https://mcp.rhylthyme.com/mcp`
4. Click **Add**

That's it. Claude can now create schedule visualizations and import recipes.

### Claude Code

Add a `.mcp.json` file to your project root:

```json
{
  "mcpServers": {
    "rhylthyme": {
      "type": "http",
      "url": "https://mcp.rhylthyme.com/mcp"
    }
  }
}
```

Claude Code will automatically connect to the Rhylthyme MCP server when working in that project.

### Claude.ai

Remote MCP servers also work with [claude.ai](https://claude.ai) integrations that support custom connectors. The same URL applies: `https://mcp.rhylthyme.com/mcp`

## Local Server (pip install)

If you prefer to run the MCP server locally (e.g., for development or offline use):

```bash
pip install rhylthyme-web[mcp]
```

Then add to your Claude Desktop config (`~/.config/Claude/claude_desktop_config.json` on Linux, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "rhylthyme": {
      "command": "rhylthyme-mcp"
    }
  }
}
```

The local server opens visualizations directly in your browser and saves them to `~/.rhylthyme/visualizations/`.

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

The Rhylthyme MCP server works with any MCP-compatible client:

- [Claude Desktop](https://claude.ai/download)
- [Claude Code](https://claude.ai/code) (via `.mcp.json`)
- [Claude.ai](https://claude.ai) (via integrations)
- Any client supporting MCP Streamable HTTP transport
