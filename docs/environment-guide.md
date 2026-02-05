# Environment Guide

Environments in Rhylthyme are **completely optional**. They model real-world resource constraints, helping validate that programs don't exceed resource limits.

## When to Use Environments

**Use environments when** you need resource validation, overutilization detection, or want to model physical constraints (kitchen equipment, lab space, etc.).

**Skip environments** for simple programs, during development, or when you manage resources differently.

## Environment File Format

```json
{
  "environmentId": "kitchen-001",
  "name": "Home Kitchen",
  "type": "kitchen",
  "resources": [
    {
      "resourceId": "stove-burner-1",
      "name": "Stove Burner 1",
      "type": "stove-burner",
      "capacity": 1
    },
    {
      "resourceId": "prep-station-1",
      "name": "Prep Station 1",
      "type": "prep-station",
      "capacity": 1
    }
  ]
}
```

## Environment Types

### Kitchen

Resource types: `stove-burner`, `prep-station`, `cleanup-station`

### Laboratory

Resource types: `bench-space`, `equipment`, `safety-station`

### Airport

Resource types: `runway`, `gate`, `taxiway`

### Bakery

Resource types: `mixer`, `oven`, `work-bench`

### Custom

Any resource types allowed with `"type": "custom"`.

## Using Environments

```bash
# Run without environment (default)
rhylthyme run program.json

# Run with environment for resource validation
rhylthyme run program.json -e environments/kitchen.json

# List available environments
rhylthyme environments

# Validate environment files
rhylthyme validate-environments

# Get environment type info
rhylthyme environment-info kitchen
```

## Programs with Resources

Steps can declare resource requirements that are validated against the environment:

```json
{
  "stepId": "cook-pasta",
  "name": "Cook Pasta",
  "task": "cooking",
  "duration": {"type": "fixed", "seconds": 600},
  "startTrigger": {"type": "afterStep", "stepId": "boil-water"},
  "resources": [
    {
      "resourceId": "stove-burner-1",
      "type": "stove-burner",
      "quantity": 1
    }
  ]
}
```

## Resource Validation

When you run a program with an environment, Rhylthyme checks:

1. All required resources exist in the environment
2. Program doesn't exceed resource capacity
3. No overlapping resource usage beyond limits
4. Resource types match between program and environment

## Configuration

```bash
# Set default environment directory
export RHYLTHYME_ENVIRONMENTS_DIR=/path/to/environments

# Use specific directory for a command
rhylthyme --environments-dir /path/to/environments environments
```

## Further Reading

- [Environment Schema Reference](api/environment-schema.md) - Complete schema documentation
- [Examples](examples.md) - Programs with environment usage
- [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) - Working examples
