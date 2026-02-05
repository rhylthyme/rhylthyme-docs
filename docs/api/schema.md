# Program Schema Reference

Programs are defined in JSON and describe workflows with tracks, steps, timing dependencies, and optional resource requirements.

## Root Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `programId` | string | Yes | Unique identifier for the program |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the program |
| `version` | string | No | Program version |
| `author` | string | No | Program author |
| `created` | string (date-time) | No | Creation timestamp |
| `tracks` | array of Track | Yes | List of tracks (min 1) |
| `environment` | string | No | Environment ID for resource validation |
| `resourceConstraints` | array | No | Resource constraint definitions |
| `metadata` | object | No | Additional metadata |

## Track Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `trackId` | string | Yes | Unique identifier for the track |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the track |
| `steps` | array of Step | Yes | List of steps (min 1) |

## Step Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stepId` | string | Yes | Unique identifier for the step |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description of the step |
| `task` | string | Yes | Task type or description |
| `duration` | Duration | Yes | Duration specification |
| `startTrigger` | StartTrigger | Yes | When this step starts |
| `resources` | array | No | Resource requirements |
| `notes` | string | No | Additional notes |
| `metadata` | object | No | Additional metadata |

## Duration Types

### Fixed Duration

```json
{
  "type": "fixed",
  "seconds": 600
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"fixed"` | Yes | Duration type |
| `seconds` | number (>= 0) | Yes | Duration in seconds |

### Variable Duration

```json
{
  "type": "variable",
  "minSeconds": 300,
  "maxSeconds": 900,
  "defaultSeconds": 600,
  "optimalSeconds": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | `"variable"` | Yes | Duration type |
| `minSeconds` | number (>= 0) | Yes | Minimum duration in seconds |
| `maxSeconds` | number (>= 0) | Yes | Maximum duration in seconds |
| `defaultSeconds` | number | No | Default duration in seconds |
| `optimalSeconds` | number | No | Optimal duration in seconds |

## Start Trigger Types

### `programStart`

Step starts when the program begins.

```json
{"type": "programStart"}
```

### `programStartOffset`

Step starts after an offset from program start.

```json
{"type": "programStartOffset", "offsetSeconds": 60}
```

### `afterStep`

Step starts immediately after another step ends.

```json
{"type": "afterStep", "stepId": "boil-water"}
```

### `afterStepWithBuffer`

Step starts after another step ends plus a buffer time.

```json
{"type": "afterStepWithBuffer", "stepId": "boil-water", "bufferSeconds": 30}
```

### `manual`

Step must be triggered manually by the user.

```json
{"type": "manual"}
```

### `onAbort`

Step triggers when another step is aborted.

```json
{"type": "onAbort", "stepId": "risky-step"}
```

## Resource Requirement Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resourceId` | string | Yes | ID of the required resource |
| `type` | string | Yes | Type of the required resource |
| `quantity` | number (>= 1) | Yes | Quantity required |
| `description` | string | No | Description |

## Resource Constraint Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task` | string | Yes | Task type this constraint applies to |
| `maxConcurrent` | number | Yes | Maximum concurrent instances |
| `description` | string | No | Description |

## Complete Example

```json
{
  "programId": "pasta-dinner",
  "name": "Pasta Dinner",
  "description": "A simple pasta dinner program",
  "version": "1.0.0",
  "tracks": [
    {
      "trackId": "cooking",
      "name": "Cooking Track",
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
          "duration": {
            "type": "variable",
            "minSeconds": 480,
            "maxSeconds": 720,
            "defaultSeconds": 600
          },
          "startTrigger": {"type": "afterStep", "stepId": "boil-water"}
        },
        {
          "stepId": "make-sauce",
          "name": "Make Sauce",
          "task": "cooking",
          "duration": {"type": "fixed", "seconds": 900},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "plate",
          "name": "Plate and Serve",
          "task": "preparation",
          "duration": {"type": "fixed", "seconds": 120},
          "startTrigger": {"type": "manual"}
        }
      ]
    }
  ],
  "resourceConstraints": [
    {"task": "cooking", "maxConcurrent": 4, "description": "Stove burners"},
    {"task": "boiling", "maxConcurrent": 2, "description": "Pots"}
  ]
}
```

## Validation Rules

- All `programId`, `trackId`, and `stepId` values must be unique within their scope
- Step references in triggers must refer to existing steps
- Duration values must be non-negative
- Resource quantities must be positive
- Programs must have at least one track; tracks must have at least one step

## Related Documentation

- [CLI Commands Reference](cli.md)
- [Environment Schema Reference](environment-schema.md)
- [Examples](../examples.md)
