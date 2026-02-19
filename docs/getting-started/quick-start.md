# Quick Start

This guide walks you through the Breakfast Schedule -- a program that coordinates making scrambled eggs, bacon, and toast in parallel. By the end, you'll understand how programs, tracks, steps, and triggers work together.

## Open the Example

Open the Breakfast Schedule directly in the web app:

**[Open Breakfast Schedule on rhylthyme.com](https://www.rhylthyme.com/api/example/breakfast_schedule)**

Or from the web app sidebar, click **Examples** and select **Breakfast Schedule**.

![Opening an example from the sidebar](../assets/screenshots/open-example.png)
<!-- TODO: Capture screenshot of opening the Breakfast Schedule example from the sidebar -->

## What You'll See

The Breakfast Schedule has three **tracks** running in parallel:

| Track | Steps | What Happens |
|-------|-------|-------------|
| **Scrambled Eggs** | Crack & Whisk, Heat Pan, Cook Eggs | Prep the eggs, heat the pan, then cook |
| **Bacon** | Prepare Bacon, Cook Bacon | Lay out the bacon, then cook until crispy |
| **Toast** | Make Toast | Starts late (at 8 minutes) so the toast is fresh when everything else finishes |

## Understanding the Timeline

Switch to the **Timeline** view using the view toggle at the bottom. You'll see:

- Each track is a horizontal row with colored bars for each step
- Steps within a track are sequential -- "Cook Eggs" can't start until "Heat Pan" finishes
- Tracks run in parallel -- Eggs and Bacon start at the same time
- The Toast track has a delayed start (8 minutes in), shown by the gap before its bar

![Timeline view of the Breakfast Schedule](../assets/screenshots/breakfast-timeline.png)
<!-- TODO: Capture screenshot of the Breakfast Schedule timeline view -->

## How Triggers Work

Look at how the steps connect:

- **"Crack and Whisk Eggs"** uses `programStart` -- it begins immediately
- **"Heat Pan"** uses `afterStep: eggs-crack-whisk` -- it starts when whisking finishes
- **"Cook Eggs"** uses `afterStep: eggs-heat-pan` -- it starts when the pan is hot
- **"Make Toast"** uses `programStartOffset: 480` -- it starts 8 minutes after the program begins, timed so the toast finishes with everything else

## Variable Durations

Several steps have **variable durations** -- they have a minimum and maximum time, with a default that auto-completes. In the Breakfast Schedule:

- "Heat Pan" runs 60-120 seconds (default 90s). You can click **Mark Complete** once the minimum has passed.
- "Cook Eggs" runs 120-180 seconds (default 150s).
- "Cook Bacon" runs 480-720 seconds (default 600s).

Variable-duration steps show a completion trigger icon on their timeline bar.

## Resource Constraints

The program defines resource constraints:

- **Stove burners**: max 2 concurrent -- you can't cook eggs, bacon, and something else all at once
- **Prep work**: max 2 concurrent
- **Toaster**: max 1

Switch to the **Resources** view to see resource utilization over time. Red shading indicates overutilization.

## Run It

1. Click **Start** in the execution controls
2. Watch the colored progress bars advance along each step
3. The **Itinerary** view shows a step-by-step list with countdowns
4. Steps turn green as they complete
5. Use the **Speed** dropdown to run at 10x or 20x for faster testing
6. Click **Mark Complete** on variable-duration steps to finish them early

![Running the Breakfast Schedule with execution controls](../assets/screenshots/breakfast-running.png)
<!-- TODO: Capture screenshot of the Breakfast Schedule running with progress bars -->

## Create Your Own

Use the **AI Chat** panel on the right side of the web app. Try typing:

> Create a schedule for making a simple pasta dinner with garlic bread

The AI will generate a complete Rhylthyme program with tracks, steps, triggers, and resource constraints, and visualize it automatically.

## Next Steps

- [Core Concepts](concepts.md) -- Programs, tracks, steps, triggers, environments
- [Visualization Guide](../web-app/visualization.md) -- In-depth guide to all five views
- [Manual Controls](../web-app/manual-controls.md) -- Steps that require user interaction
- [Examples](examples.md) -- More example programs to explore
