# CLI Commands Reference

## Command Overview

```bash
rhylthyme [OPTIONS] COMMAND [ARGS]...
```

### Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `--environments-dir PATH` | Directory containing environment catalogs | Current directory |
| `--verbose` | Enable verbose output | False |
| `--help` | Show help message | - |

---

## `validate`

Validates one or more program files against the schema.

```bash
rhylthyme validate [OPTIONS] PROGRAM_FILES...
```

**Arguments:**

- `PROGRAM_FILES`: One or more program files to validate

**Options:**

| Option | Description |
|--------|-------------|
| `--schema PATH` | Path to a specific schema file |
| `-e, --environment PATH` | Environment file for resource validation |
| `--verbose, -v` | Verbose validation output |
| `--json, -j` | Output results in JSON format |
| `--strict, -s` | Enable strict validation mode |

**Examples:**

```bash
# Validate a single file
rhylthyme validate program.json

# Validate multiple files
rhylthyme validate programs/*.json

# Validate with verbose JSON output
rhylthyme validate program.json --verbose --json

# Validate with environment resource checking
rhylthyme validate program.json -e environments/kitchen.json

# Strict mode validation
rhylthyme validate program.json --strict
```

---

## `run`

Runs a program with an interactive terminal UI.

```bash
rhylthyme run [OPTIONS] PROGRAM
```

**Arguments:**

- `PROGRAM`: Path to the program file to run

**Options:**

| Option | Description |
|--------|-------------|
| `--schema PATH` | Path to a specific schema file |
| `-e, --environment PATH` | Environment file for resource validation |
| `--time-scale FLOAT` | Time scaling factor |
| `--validate / --no-validate` | Enable/disable pre-run validation |
| `--auto-start` | Automatically start program execution |

**Interactive Controls:**

| Key | Action |
|-----|--------|
| Space | Start/pause program execution |
| S | Step through execution |
| T | Trigger manual steps |
| Q | Quit the program |
| +/- | Adjust time scale |
| O | Change sort order |

**Examples:**

```bash
# Run a program
rhylthyme run program.json

# Run with environment
rhylthyme run program.json -e environments/kitchen.json

# Run with time scaling and auto-start
rhylthyme run program.json --time-scale 10 --auto-start

# Run without pre-validation
rhylthyme run program.json --no-validate
```

---

## `plan`

Optimizes a program schedule to reduce resource conflicts.

```bash
rhylthyme plan [OPTIONS] INPUT OUTPUT
```

**Arguments:**

- `INPUT`: Path to the input program file
- `OUTPUT`: Path to save the optimized program file

**Options:**

| Option | Description |
|--------|-------------|
| `-e, --environment PATH` | Environment file for resource constraints |
| `--verbose, -v` | Verbose output |

**Examples:**

```bash
# Optimize a program
rhylthyme plan input.json optimized.json

# Optimize with environment constraints
rhylthyme plan input.json optimized.json -e environments/kitchen.json --verbose
```

---

## `environments`

Lists all available environment catalogs.

```bash
rhylthyme environments [OPTIONS]
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--format FORMAT` | Output format (json, yaml, table) | table |

**Examples:**

```bash
rhylthyme environments
rhylthyme environments --format json
rhylthyme environments --format yaml
```

---

## `validate-environments`

Validates all environment catalog files.

```bash
rhylthyme validate-environments [OPTIONS]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--verbose` | Verbose validation output |

---

## `environment-info`

Shows information about a specific environment type.

```bash
rhylthyme environment-info TYPE
```

**Arguments:**

- `TYPE`: Environment type (kitchen, laboratory, airport, bakery)

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RHYLTHYME_ENVIRONMENTS_DIR` | Default directory for environment catalogs | Current directory |

## Related Documentation

- [Installation](installation.md)
- [Program Schema Reference](schema.md)
- [Environment Schema Reference](environment-schema.md)
