# Examples

Rhylthyme includes built-in example programs that demonstrate different features and environment types. You can open any example directly from the web app sidebar under **Examples**, or use the links below.

## Built-in Examples

### Breakfast Schedule

A kitchen program coordinating scrambled eggs, bacon, and toast in parallel.

**[Open in web app](https://www.rhylthyme.com/api/example/breakfast_schedule)**

- **Environment**: Kitchen
- **Concepts demonstrated**: Parallel tracks, variable durations, delayed starts (`programStartOffset`), resource constraints
- 3 tracks, resource constraints on stove burners and prep stations

### Academy Awards Ceremony

An event program modeling the flow of an awards ceremony.

**[Open in web app](https://www.rhylthyme.com/api/example/academy_awards)**

- **Environment**: Event
- **Concepts demonstrated**: Sequential ceremony segments, manual triggers, indefinite durations

### Lab Experiment

A laboratory protocol with preparation, analysis, and cleanup phases.

**[Open in web app](https://www.rhylthyme.com/api/example/lab_experiment)**

- **Environment**: Laboratory
- **Concepts demonstrated**: Variable durations for analysis steps, sequential dependencies

### Airport Gate Turnaround

An airport operations program coordinating aircraft unloading, servicing, and boarding.

**[Open in web app](https://www.rhylthyme.com/api/example/airport_turnaround)**

- **Environment**: Airport
- **Concepts demonstrated**: Parallel service tracks, tight resource constraints, buffered triggers

### Bakery Production Run

A bakery program managing multiple dough batches through mixing, proofing, and baking.

**[Open in web app](https://www.rhylthyme.com/api/example/bakery_production)**

- **Environment**: Bakery
- **Concepts demonstrated**: Resource constraints on ovens and mixers, buffers between steps

![Example programs loaded in the web app](../assets/screenshots/examples-list.png)
<!-- TODO: Capture screenshot of the Examples section in the sidebar -->

## JSON Structure

Every example follows the same structure. Here's a minimal program with two sequential steps:

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

And here's a multi-track program with resource constraints:

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
          "task": "cooking",
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

## Manual Triggers

Steps can require user interaction. A step with a `manual` start trigger waits for you to click **Start Step** before it begins:

```json
{
  "stepId": "manual-step",
  "name": "Quality Check",
  "task": "inspection",
  "duration": {"type": "fixed", "seconds": 30},
  "startTrigger": {"type": "manual"}
}
```

See the [Manual Controls guide](../web-app/manual-controls.md) for details on how manual triggers, variable durations, and indefinite durations work during execution.

## Buffered Triggers

Use `afterStepWithBuffer` to add a delay between steps:

```json
{
  "stepId": "rest-dough",
  "name": "Rest Dough",
  "task": "resting",
  "duration": {"type": "fixed", "seconds": 3600},
  "startTrigger": {
    "type": "afterStepWithBuffer",
    "stepId": "knead",
    "bufferSeconds": 60
  }
}
```

## More Examples

- Browse the [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples) repository for additional programs across all environment types
- Use the **AI Chat** in the web app to generate custom programs from natural language descriptions
- Import recipes from Spoonacular or TheMealDB using the **Prompts** in the sidebar
