# This repository and rhylthyme-mcp

Two repositories do related things and are easy to confuse. This one is the
**command a person types**. [rhylthyme-mcp](https://github.com/rhylthyme/rhylthyme-mcp)
is the **server an AI assistant talks to**.

| | [rhylthyme-mcp](https://github.com/rhylthyme/rhylthyme-mcp) | [rhylthyme](https://github.com/rhylthyme/rhylthyme) |
|---|---|---|
| What it is | The MCP **server**: the tools an AI assistant calls | A command-line **program**: the `rhylthyme` command |
| Who uses it | Claude, ChatGPT, Cursor or any MCP client, on a person's behalf | A person at a terminal, a script, or CI |
| Where it runs | Hosted at `mcp.rhylthyme.com`; nothing to install | On your machine: `pip install rhylthyme` |
| Language | JavaScript (Node 20+) | Python 3.12+ |
| Input | A program the assistant builds in conversation | A program file on disk (JSON or YAML) |
| Validate a program | `validate_program` | `rhylthyme validate` (works offline) |
| Import a recipe or protocol | `import_from_source` | `rhylthyme import` |
| Timing, conflicts, deadlines | `analyze_schedule` | `rhylthyme analyze` (asks the server) |
| Publish a live timeline | `visualize_schedule` | `rhylthyme publish` (asks the server) |
| Run a schedule with timers | no: it hands back a link to the web timeline | `rhylthyme run`, an interactive terminal runner |
| Recorded runs, calibration | reads runs saved to an account | records runs locally; `rhylthyme runs`, `rhylthyme calibrate` |
| Catalog search, account library | yes | no |
| Also in the repository | the `rhylthyme-mcp` PyPI package (a stdio bridge to the hosted server), the Claude plugin marketplace | the Claude skill's source, the prompt-evaluation harness and its results, `rhylthyme mcp-test` |

How they fit together: this tool is one of the MCP server's clients.
`rhylthyme analyze`, `publish`, `generate` and `mcp-test` are MCP calls to
`mcp.rhylthyme.com`; `rhylthyme validate`, `run`, `runs` and `calibrate` never
touch the network. Each has its own validator for the same program schema
(Python here, JavaScript there), so a program is checked again when it is
published.

Use this repository if you have a program file and a terminal, want timers in
the terminal, or keep run records. Use rhylthyme-mcp to connect Claude, ChatGPT
or another assistant, or to read or self-host the server.

Two names to keep apart: `rhylthyme` on PyPI is this tool (command
`rhylthyme`); `rhylthyme-mcp` on PyPI is the server's stdio bridge (command
`rhylthyme-mcp`). This repository was called `rhylthyme-cli-runner` until 0.5;
that PyPI package now only installs `rhylthyme`. The program format itself is defined in
[rhylthyme-spec](https://github.com/rhylthyme/rhylthyme-spec), with examples in
[rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples).
