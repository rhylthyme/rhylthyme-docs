# Home Tab

!!! info "Screenshots coming soon - placeholder images shown below."

The Home tab is the main entry point of the app. It provides access to your saved programs, built-in examples, AI prompt shortcuts, and options to load programs from files or URLs.

<!-- TODO: Add iPhone screenshot -->
![Home tab overview](../assets/screenshots/ios/ios-home.png)

## My Programs

!!! note
    The My Programs section only appears when you are signed in.

If you are signed in, the top of the Home tab displays your saved programs. Tap any program to load it into the Visualization tab.

Programs saved from the web app at [app.rhylthyme.com](https://app.rhylthyme.com) also appear here -- your library syncs across devices through your Supabase account.

## Examples

The Examples section lists built-in programs that demonstrate different use cases for Rhylthyme:

| Example | Description |
|---------|-------------|
| **Breakfast Schedule** | Parallel cooking tasks with timing dependencies |
| **Academy Awards** | Event ceremony schedule with sequential segments |
| **Lab Experiment** | Scientific protocol with equipment constraints |
| **Bakery** | Production workflow with oven and mixer resources |
| **Airport** | Runway and gate scheduling with resource limits |
| **Cell Culture** | Multi-day lab protocol with incubation steps |
| **Sunny Side Up Eggs** | Simple recipe with video chapters |

<!-- TODO: Add iPhone screenshot -->
![Examples list expanded](../assets/screenshots/ios/ios-home-examples.png)

Tap any example to load it immediately. The app switches to the Visualization tab and displays the program's timeline.

## Prompts

The Prompts section provides pre-written conversation starters for the Chat tab. Each prompt describes a type of program you might want to create:

- Tap a prompt to open the **Chat** tab with the prompt pre-filled
- Claude AI generates a Rhylthyme program based on the description
- The resulting program loads into the Visualization tab automatically

This is a quick way to create custom programs without writing JSON by hand.

## Upload

The Upload section lets you load a Rhylthyme program JSON file from your device:

1. Tap **Upload Program**
2. Select a `.json` file from the iOS file picker (Files app, iCloud Drive, or other file providers)
3. The program validates and loads into the Visualization tab

!!! warning
    The uploaded file must be valid Rhylthyme program JSON. If validation fails, an error message describes what went wrong.

## Load from URL

You can also load a program from any publicly accessible URL:

1. Tap **Load from URL**
2. Enter or paste the full URL to a Rhylthyme program JSON file
3. Tap **Load**
4. The app fetches the file, validates it, and opens the Visualization tab

This is useful for loading programs hosted on GitHub, shared via a link, or served by the Rhylthyme web app.

## Deep Links

Rhylthyme supports the `rhylthyme://` URL scheme for opening shared programs directly:

```
rhylthyme://share=abc123
```

When you tap a deep link (for example, from Messages or Safari), the app opens and loads the shared program into the Visualization tab. See [Account & Settings](account.md#sharing-programs) for how to generate share links.
