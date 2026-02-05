# Environment Schema Reference

Environments define resource constraints and capabilities. They are **completely optional**.

## Root Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `environmentId` | string | Yes | Unique identifier |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description |
| `type` | string | Yes | Environment type: `kitchen`, `laboratory`, `airport`, `bakery`, `custom` |
| `version` | string | No | Version |
| `author` | string | No | Author |
| `created` | string (date-time) | No | Creation timestamp |
| `tags` | array of string | No | Tags for categorization |
| `resources` | array of Resource | Yes | List of resources |
| `metadata` | object | No | Additional metadata |

## Resource Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resourceId` | string | Yes | Unique identifier |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Description |
| `type` | string | Yes | Resource type |
| `capacity` | number (>= 1) | Yes | Maximum capacity |
| `location` | string | No | Location info |
| `status` | string | No | `available` (default), `maintenance`, or `out-of-service` |
| `metadata` | object | No | Additional metadata |

## Resource Types by Environment

### Kitchen

| Type | Description |
|------|-------------|
| `stove-burner` | Cooking burners |
| `prep-station` | Food preparation areas |
| `cleanup-station` | Cleaning and dishwashing |

### Laboratory

| Type | Description |
|------|-------------|
| `bench-space` | Work bench areas |
| `equipment` | Lab equipment (centrifuges, etc.) |
| `safety-station` | Fume hoods, eyewash stations |

### Airport

| Type | Description |
|------|-------------|
| `runway` | Aircraft runways |
| `gate` | Passenger boarding gates |
| `taxiway` | Ground movement paths |

### Bakery

| Type | Description |
|------|-------------|
| `mixer` | Dough mixing equipment |
| `oven` | Baking ovens |
| `work-bench` | Work surfaces |

## Example

```json
{
  "environmentId": "home-kitchen",
  "name": "Home Kitchen",
  "type": "kitchen",
  "description": "A typical home kitchen",
  "resources": [
    {
      "resourceId": "stove-burner-1",
      "name": "Stove Burner 1",
      "type": "stove-burner",
      "capacity": 1
    },
    {
      "resourceId": "stove-burner-2",
      "name": "Stove Burner 2",
      "type": "stove-burner",
      "capacity": 1
    },
    {
      "resourceId": "prep-station-1",
      "name": "Prep Station",
      "type": "prep-station",
      "capacity": 1
    },
    {
      "resourceId": "cleanup-station-1",
      "name": "Cleanup Station",
      "type": "cleanup-station",
      "capacity": 1
    }
  ]
}
```

## Validation Rules

- All `environmentId` and `resourceId` values must be unique
- Resource capacity must be positive
- Resource types should match environment type conventions
- Resource status must be `available`, `maintenance`, or `out-of-service`

## Related Documentation

- [Environment Guide](../environment-guide.md)
- [Program Schema Reference](schema.md)
- [CLI Commands Reference](cli.md)
