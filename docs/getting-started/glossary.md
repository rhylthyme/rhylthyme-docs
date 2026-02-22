# Glossary

A comprehensive reference of Rhylthyme-specific terms and concepts. This glossary covers all terminology used in schemas, documentation, and the user interface.

## A

**Actor** (or **Human Resources**)
A person performing tasks in the program. The `actors` field specifies the count of available people. Acts as a default resource constraint for task types without explicit constraints.

**Actor Types**
Categorization of different types of workers with specific counts and qualifications. Allows tracking different roles in an environment.

**Acceptable Use**
Guidelines for appropriate use of the Rhylthyme service, as defined in the Terms of Service.

**Actions Bar**
Button group for Save, Share, and Download program actions in the web interface.

**AI-Generated Content**
Content created using the AI-powered chat interface that uses the Anthropic Claude API to generate, modify, or suggest program content.

## B

**Batch Size** (Legacy)
Deprecated field; use `replicates` instead. Number of times to replicate a track.

**Blocking Step**
A step that prevents other steps from starting until it completes (e.g., an indefinite step).

**Buffer** (or **Buffer Seconds**)
Time delay after a step completes before the next step starts. Creates visual gaps on timelines representing rest, cooling, or preparation time. Used with the `afterStepWithBuffer` trigger.

**Buffer Seconds** (`bufferSeconds`)
Time delay in seconds after a step completes before the next step starts.

## C

**Can Abort** (`canAbort`)
Boolean flag indicating whether a step can be aborted by the user.

**Code Block** (or **Code Execution**)
Inline Python or shell code that executes when a step starts. Allows automation of tasks within the workflow.

**Critical Path**
The longest chain of dependent steps that determines the minimum program duration.

**Current Time**
The elapsed time during program execution, used to determine which steps are active.

## D

**DAG View** (Directed Acyclic Graph)
Graph visualization showing step dependencies as nodes and edges. Color-coded by track.

**Default Seconds** (`defaultSeconds`)
The time a variable step will run if not manually completed, or the display duration for indefinite steps.

**Dependency**
Relationship between steps where one must complete before another can start. Created by `afterStep`, `afterStepWithBuffer`, and `onAbort` triggers.

**Dependency Chain**
Sequence of steps linked by dependencies, creating a critical path through the program.

**Download**
Export program as a JSON file to the user's computer (no sign-in required).

**Duplicate Step ID**
Validation error when two steps have the same `stepId` within a program.

**Duration**
Specifies how long a step takes to complete. Can be fixed, variable, or indefinite.

## E

**Effectual Start Time**
The actual time a step begins, accounting for dependencies, manual triggers, and sliding.

**Editor View**
Text editor for directly viewing and modifying program JSON source code.

**Environment**
An optional catalog of resources for a specific setting (kitchen, laboratory, airport, bakery, etc.). Provides predefined resource types for validation without manual definition.

**Environment Type**
The type of environment a program is designed for: `kitchen`, `laboratory`, `airport`, `bakery`, or custom types. Used for validation and UI display.

**Execution Panel**
Control area with Start, Pause, Stop buttons and speed selector.

**Execution Status**
The current state of a step: `PENDING`, `RUNNING`, `COMPLETED`, `WAITING_FOR_MANUAL`, or `ABORTED`.

## F

**Fixed Duration**
A step that runs for an exact number of seconds. Most common duration type. Example: `{"type": "fixed", "seconds": 300}`

**Flexible Timing** (or **Flex**)
Advanced feature allowing steps to expand/contract to fill time gaps or reach targets. Includes flex mode (`fill` or `max`) and min/max duration constraints.

**Fractional Resource** (or **Partial Resource Usage**)
A step can use a fraction of a resource (0.0 to 1.0) rather than consuming the whole resource. Allows multitasking.

## G

**Glossary**
This document - a comprehensive reference of Rhylthyme-specific terms and concepts.

## I

**Import Source**
External system providing structured data (TheMealDB API, protocols.io API, Spoonacular API).

**Importer** (or **Import Plugin**)
Adapter that converts external data (recipes, protocols) into Rhylthyme program JSON. Examples: TheMealDB importer, protocols.io importer.

**Importer Registry**
Auto-detection system that chooses the correct importer plugin based on input source.

**Indefinite Duration**
A step that runs until the user manually marks it complete. No automatic end time. Used for open-ended tasks. Example: `{"type": "indefinite", "defaultSeconds": 120}`

**Invalid Step Reference**
Validation error when a trigger references a non-existent step ID.

**Itinerary View**
Chronological list of all steps in execution order, regardless of track assignment. Similar to a recipe or protocol.

## M

**Manual Actions Panel**
The control area in the web app showing "Start" buttons for manual-start steps and "Complete" buttons for variable/indefinite steps.

**Manual Completion** (or **Mark Complete**)
User action to end a variable or indefinite duration step before its default time or automatic end.

**Manual Start** (or **Start Step**)
User action to begin a manually-triggered step.

**Manual Trigger**
A start trigger where the step waits for the user to click "Start Step" before beginning. Step slides forward on the timeline until manually started.

**Mark Complete**
User interface action to manually end a variable or indefinite duration step.

**Maximum Seconds** (`maxSeconds`)
The absolute maximum duration a variable step can run, or the upper bound for planning.

**maxConcurrent**
The maximum number of concurrent steps allowed for a task type. For example, a kitchen with 2 stove burners sets `maxConcurrent: 2` for the "stove-burner" task.

**Metadata**
Arbitrary custom key-value data attached to programs, tracks, or steps for application-specific purposes.

**Minimum Seconds** (`minSeconds`)
The earliest a variable duration step can be completed. The step must run at least this long before the "Mark Complete" button appears.

## N

**Non-Blocking Step**
A step that doesn't prevent dependent steps from progressing.

## O

**Offset Seconds** (`offsetSeconds`)
Time delay in seconds after a reference point (program start or another step completion). Can be negative (start before reference ends) or positive.

**onAbort Trigger**
The step starts when another step is aborted. Used for contingency/fallback steps.

**Optimal Seconds** (`optimalSeconds`)
The optimal duration used by the planner for schedule optimization in variable duration steps.

**Overutilization**
When the schedule requires more concurrent instances of a resource than the `maxConcurrent` constraint allows. Flagged in the Resources view.

## P

**Pause**
Temporarily stop program execution at the current time. Can be resumed without losing progress.

**Post-Buffer** (or **Cleanup Time**)
Time and resources required after a step completes. Represents cleanup, teardown, or transitional work.

**Pre-Buffer** (or **Setup Time**)
Time and resources required before a step starts. Represents equipment setup, room preparation, or other preparatory work.

**Program**
A complete schedule defined in JSON that describes everything that needs to happen, how long each task takes, and what depends on what. Programs have a name, description, optional environment type, and one or more tracks.

**Program Execution**
The process of running a program in real time, with step tracking, resource management, and optional speed adjustment.

**Program ID** (`programId`)
Unique identifier for the program (kebab-case, e.g., `breakfast-schedule`).

**Program Info Bar**
Top-of-page summary showing program metadata: total time, schema version, environment type, resource constraints, track count.

**programStart Trigger**
The step starts when the program begins. Typically used for the first step in a track.

**programStartOffset Trigger**
The step starts after a delay from program start. Example: `{"type": "programStartOffset", "offsetSeconds": 480}`

## R

**Replication Count**
The number of times to replicate a track or step.

**Replication Delay** (or **Stagger Delay**)
Time delay between the start of consecutive replicates in stagger mode.

**Replication Mode** (or **Execution Mode**)
How replicates are executed:
- **parallel**: All instances run at the same time
- **serial**: Instances run one after another, sequentially
- **stagger**: Instances start with a time delay between each

**Replicates**
Configuration to run a track or step multiple times with different execution modes. Example: `{"count": 4, "mode": "serial"}`

**Resource Constraint**
A limit on how many steps of a given task type can run at the same time. Prevents overutilization of equipment, facilities, or personnel.

**Resources View**
Chart showing resource utilization over time and identifying periods of overutilization.

## S

**Same-Track Prerequisite**
For manual-start steps, the "Start Step" button only appears after the previous step in the same track completes.

**Save**
Store a program to the user's account (requires sign-in).

**Schema Version** (`schemaVersion`)
Version of the Rhylthyme JSON schema (e.g., `0.1.0`, `0.2.0`). Indicates which schema features are supported.

**Settings Modal**
Configuration panel for customizing visualization theme, timeline display, and execution defaults.

**Share**
Generate a public share link (requires sign-in).

**Share Link** (or **Share URL**)
Publicly accessible URL that allows others to view a saved program without editing.

**Slack Time**
Unused time available in a step (for variable durations) or gap between steps.

**Sliding Step** (or **Step Sliding**)
When a manual-start step is not started, it slides forward on the timeline to accommodate time passing.

**Speed Control** (or **Speed Multiplier**)
Adjustment factor for execution speed (e.g., 1x, 2x, 5x, 10x). Higher multipliers preview long programs quickly.

**Stagger** (Legacy)
Deprecated field; use `replicates` with stagger mode instead. Time delay between batch instances.

**Start Step**
User interface action to manually begin a manually-triggered step.

**Start Trigger**
Defines when a step begins. Different trigger types create the dependency structure of a program.

**Step**
A single task within a track. Each step has a name, task type, duration, and start trigger. Steps are the atomic units of a program.

**Stop**
End execution and reset the program to the beginning.

## T

**Task** (or **Task Type**)
A resource type that a step uses (e.g., "stove-burner", "prep-work", "oven", "bench-space"). Used to assign steps to resources and enforce resource constraints.

**taskResources**
An array of resources with fractional usage. Example: `[{"name": "chef", "fraction": 0.5}, {"name": "stove-burner", "fraction": 1.0}]`

**Template ID** (`templateId`)
Reference to a track template definition.

**Template Parameters**
Custom parameters to specialize a track instance based on a template.

**Timeline View** (Gantt Chart)
Horizontal timeline showing tracks as lanes and steps as time-span bars. Shows progress during execution.

**Track**
A sequence of related steps that execute in order. Tracks run in parallel—while one track is performing one activity, another can perform a different activity simultaneously. Think of tracks as lanes of activity.

**Track Template** (or **Template**)
A reusable track definition that can be instantiated multiple times with different parameters.

**Trigger Name** (`triggerName`)
An optional identifier for a manual trigger (for variable/indefinite steps). Helps label the completion event in the UI.

## U

**User Content**
Programs, workflows, and other content created by users. Users retain ownership; Rhylthyme can display and process them with permission.

## V

**Validation**
Process of checking a program against the JSON schema and additional business logic constraints (e.g., reference resolution, consistency checks).

**Variable Duration**
A step with a time range that can be ended manually after the minimum time. Has minimum, maximum, and default times. Example: `{"type": "variable", "minSeconds": 120, "maxSeconds": 180, "defaultSeconds": 150}`

**View Toggle** (or **View Switcher**)
Control to switch between DAG, Timeline, Resources, Itinerary, and Editor views.

## Trigger Types Reference

| Trigger | Description | JSON Example |
|---------|-------------|--------------|
| `programStart` | Starts when the program begins | `{"type": "programStart"}` |
| `programStartOffset` | Starts after a delay from program start | `{"type": "programStartOffset", "offsetSeconds": 480}` |
| `afterStep` | Starts immediately after another step ends | `{"type": "afterStep", "stepId": "boil-water"}` |
| `afterStepWithBuffer` | Starts after another step ends, plus a buffer | `{"type": "afterStepWithBuffer", "stepId": "knead", "bufferSeconds": 60}` |
| `manual` | Waits for user to click "Start Step" | `{"type": "manual"}` |
| `onAbort` | Starts when another step is aborted | `{"type": "onAbort", "stepId": "primary-task"}` |

## Duration Types Reference

| Type | Description | JSON Example |
|------|-------------|--------------|
| **Fixed** | Runs for exact seconds | `{"type": "fixed", "seconds": 300}` |
| **Variable** | Has min/max/default times | `{"type": "variable", "minSeconds": 120, "maxSeconds": 180, "defaultSeconds": 150}` |
| **Indefinite** | Runs until manually completed | `{"type": "indefinite", "defaultSeconds": 120}` |

## Environment Types Reference

| Environment | Common Resource Types |
|-------------|----------------------|
| **Kitchen** | `stove-burner`, `prep-station`, `cleanup-station`, `oven`, `microwave` |
| **Laboratory** | `bench-space`, `equipment`, `safety-station`, `fume-hood`, `centrifuge` |
| **Airport** | `runway`, `gate`, `taxiway`, `baggage-handling`, `security` |
| **Bakery** | `mixer`, `oven`, `work-bench`, `prep-station`, `packaging` |
| **Manufacturing** | `assembly-line`, `quality-control`, `packaging`, `shipping` |
| **General** | Custom resource types as needed |

## See Also

- [Core Concepts](concepts.md) - Introduction to Rhylthyme fundamentals
- [Program Schema Reference](../development/schema.md) - Complete technical specification
- [Examples](examples.md) - Sample programs demonstrating different features