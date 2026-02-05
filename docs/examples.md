# Examples

## Basic Program

A minimal program with sequential steps:

```json
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
        },
        {
          "stepId": "farewell",
          "name": "Farewell",
          "task": "farewell",
          "duration": {"type": "fixed", "seconds": 3},
          "startTrigger": {"type": "afterStep", "stepId": "greet"}
        }
      ]
    }
  ]
}
```

```bash
rhylthyme run hello-world.json
```

## Kitchen: Pasta Dinner

A cooking program with parallel tracks:

```json
{
  "programId": "pasta-dinner",
  "name": "Pasta Dinner",
  "tracks": [
    {
      "trackId": "pasta",
      "name": "Pasta",
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
          "duration": {"type": "fixed", "seconds": 600},
          "startTrigger": {"type": "afterStep", "stepId": "boil-water"}
        }
      ]
    },
    {
      "trackId": "sauce",
      "name": "Sauce",
      "steps": [
        {
          "stepId": "prep-vegetables",
          "name": "Chop Vegetables",
          "task": "preparation",
          "duration": {"type": "fixed", "seconds": 600},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "cook-sauce",
          "name": "Cook Sauce",
          "task": "cooking",
          "duration": {"type": "fixed", "seconds": 900},
          "startTrigger": {"type": "afterStep", "stepId": "prep-vegetables"}
        }
      ]
    }
  ],
  "resourceConstraints": [
    {"task": "cooking", "maxConcurrent": 4, "description": "Stove burners"},
    {"task": "preparation", "maxConcurrent": 2, "description": "Prep stations"}
  ]
}
```

## Laboratory: Chemistry Experiment

```json
{
  "programId": "chemistry-experiment",
  "name": "Chemistry Experiment",
  "tracks": [
    {
      "trackId": "experiment",
      "name": "Experiment",
      "steps": [
        {
          "stepId": "prepare-samples",
          "name": "Prepare Samples",
          "task": "preparation",
          "duration": {"type": "fixed", "seconds": 1200},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "run-analysis",
          "name": "Run Analysis",
          "task": "measurement",
          "duration": {
            "type": "variable",
            "minSeconds": 1200,
            "maxSeconds": 2400,
            "defaultSeconds": 1800
          },
          "startTrigger": {"type": "afterStep", "stepId": "prepare-samples"}
        }
      ]
    }
  ]
}
```

## Manual Triggers

Steps that require user interaction:

```json
{
  "programId": "manual-demo",
  "name": "Manual Demo",
  "tracks": [
    {
      "trackId": "main",
      "name": "Main Track",
      "steps": [
        {
          "stepId": "auto-step",
          "name": "Automatic Step",
          "task": "setup",
          "duration": {"type": "fixed", "seconds": 10},
          "startTrigger": {"type": "programStart"}
        },
        {
          "stepId": "manual-step",
          "name": "Manual Step",
          "task": "inspection",
          "duration": {"type": "fixed", "seconds": 30},
          "startTrigger": {"type": "manual"}
        }
      ]
    }
  ]
}
```

Press **T** during program execution to trigger manual steps.

## Buffered Triggers

Steps with delays between them:

```json
{
  "stepId": "rest-dough",
  "name": "Rest Dough",
  "task": "resting",
  "duration": {"type": "fixed", "seconds": 3600},
  "startTrigger": {"type": "afterStepWithBuffer", "stepId": "knead", "bufferSeconds": 60}
}
```

## Running Examples

```bash
# Validate a program
rhylthyme validate program.json

# Run without environment
rhylthyme run program.json

# Run with environment for resource validation
rhylthyme run program.json -e environments/kitchen.json

# Optimize a program schedule
rhylthyme plan input.json optimized.json
```

## More Examples

See the [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) repository for complete working examples across kitchen, laboratory, airport, and bakery environments.
