# Getting Started

This page covers the different ways to load a Rhylthyme program into the web app for visualization.

## Loading an Example

The left sidebar includes a set of built-in examples that span different environment types. Click any example to load it instantly.

| Example | Environment | Description |
|---------|-------------|-------------|
| Breakfast Schedule | Kitchen | Coordinating eggs, bacon, and toast |
| Academy Awards | Events | Multi-track ceremony production |
| Lab Experiment | Laboratory | Sequential lab protocol |
| Bakery | Bakery | Bread and pastry production |
| Airport | Airport | Runway, gate, and taxiway coordination |
| Cell Culture | Laboratory | Cell culture experimental protocol |
| Sunny Side Up Eggs | Kitchen | Step-by-step cooking with video |

![Academy Awards example loaded in the web app showing a multi-track ceremony program](../assets/screenshots/web/academy-awards.png)

!!! tip "Sunny Side Up Eggs includes video"
    The Sunny Side Up Eggs example includes embedded video tooltips for each step. Hover over a step node in the DAG view to see the associated video clip.

## Uploading a Program

You can upload your own program files directly from your computer.

### Drag and Drop

1. Scroll to the **Upload Program** section in the left sidebar.
2. Drag a `.json`, `.yaml`, or `.yml` file onto the drop zone.
3. The program will be validated and visualized automatically.

### File Browser

1. Click the drop zone area labeled "Drop file here or click to browse."
2. Select a file from your file system.
3. The program loads into the main visualization area.

!!! note "File Size Limit"
    Uploaded files are limited to 16 MB.

## Loading from URL

If your program JSON is hosted online (for example, in a GitHub repository), you can load it directly by URL.

1. Scroll to the **Load from URL** section in the left sidebar.
2. Paste the URL into the text field. For GitHub files, use the raw URL (e.g., `https://raw.githubusercontent.com/rhylthyme/rhylthyme-examples/main/programs/breakfast_schedule.json`).
3. Click the download button to fetch and visualize the program.

!!! tip "GitHub Raw URLs"
    For files on GitHub, click the "Raw" button on the file page to get the direct URL, or construct it manually by replacing `github.com` with `raw.githubusercontent.com` and removing `/blob/`.

## Using Prompts (AI Import)

The **Prompts** section in the sidebar provides pre-built queries that use the AI chat assistant to import and generate programs from external sources.

| Prompt | Source | What It Does |
|--------|--------|--------------|
| Nutty Chicken Curry | TheMealDB | Imports a chicken curry recipe and creates a cooking schedule |
| Beef Stew | Spoonacular | Searches Spoonacular for a beef stew recipe and creates a cooking schedule |
| RNA Extraction with Trizol | protocols.io | Imports a lab protocol and creates a laboratory schedule |

Clicking a prompt automatically sends it to the AI chat panel. The assistant will call the appropriate importer, convert the external data into a Rhylthyme program, and visualize it.

!!! note "Chat Required"
    Prompts use the AI chat feature, which requires the Anthropic API to be available. On the hosted version at www.rhylthyme.com, this works out of the box.

## Browsing Public Programs

The **Public Programs** section in the sidebar lets you search for and load programs shared by other users.

1. Type a search term into the search field (e.g., "breakfast" or "lab").
2. Click the search icon or press Enter.
3. Click on a result to load and visualize it.

Alternatively, click "browse recent" to see the most recently shared programs.

## Loading a Shared Program

When someone shares a program, they get a URL with a `?share=` parameter. Opening that URL in your browser will automatically load and visualize the shared program.

```
https://www.rhylthyme.com?share=abc123
```

## What Happens After Loading

Once a program is loaded (by any method), the web app:

1. Validates the program against the Rhylthyme schema.
2. Generates the visualization HTML with all five views.
3. Displays the program in the main content area with:
    - A **program info bar** showing total time, schema version, environment type, and resource constraints.
    - **Execution controls** for running the program in real time.
    - A **view toggle bar** at the bottom for switching between DAG, Timeline, Resources, Itinerary, and Editor.
4. Shows **Save**, **Share**, and **Download** buttons in the top-right corner of the main area.

The program is now stored in memory (as `currentProgram`) and remains available for download, saving to your account, or sharing until you load a different program.
