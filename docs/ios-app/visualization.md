# Visualization

!!! info "Screenshots coming soon - placeholder images shown below."

The Visualization tab appears in the tab bar after you load a program. It displays the program in an interactive web view with native playback controls, view switching, and full-screen mode.

## Views

A **segmented control** at the top of the screen lets you switch between two views. Switching views does not reload the program or interrupt execution -- playback continues seamlessly.

### Timeline

The default view. Shows all tracks and steps arranged on a horizontal timeline. Steps are color-coded by task type, and dependencies are drawn as connecting lines between steps.

<!-- TODO: Add iPhone screenshot -->
![Timeline view showing a program in progress](../assets/screenshots/ios/ios-visualization-timeline.png)

The timeline scrolls horizontally as execution progresses. Active steps are highlighted, completed steps are dimmed, and upcoming steps remain at full opacity.

### Itinerary

An alternative view that presents steps as a vertical list grouped by track, similar to a printed schedule or agenda. Each step shows its name, start time, duration, and current status.

<!-- TODO: Add iPhone screenshot -->
![Itinerary view showing step details](../assets/screenshots/ios/ios-visualization-itinerary.png)

The itinerary view is useful when you want a text-oriented overview of the program, especially for programs with many short steps.

## Playback Controls

Native playback controls are displayed in a toolbar at the bottom of the Visualization tab. These controls are rendered by SwiftUI outside the web view for a responsive, platform-native feel.

<!-- TODO: Add iPhone screenshot -->
![Playback controls at the bottom of the visualization](../assets/screenshots/ios/ios-visualization-playback.png)

| Control | Description |
|---------|-------------|
| **Stop** | Reset the program to the beginning. All step states return to "pending." |
| **Play / Pause** | Start or pause program execution. While paused, the timer freezes and no new steps begin. |
| **Elapsed Time** | Displays the current program time (scaled by the speed setting). |
| **Speed Picker** | Choose a playback speed: 1x, 2x, 5x, 10x, 30x, or 60x real time. |

!!! tip
    Use higher speeds like 30x or 60x to preview long-running programs quickly. You can change speed during playback without interrupting execution.

## Full-Screen Mode

Tap the **expand button** (top-right corner of the visualization) to enter full-screen mode. The tab bar, navigation bar, and playback toolbar hide, giving the visualization the entire screen.

<!-- TODO: Add iPhone screenshot -->
![Full-screen visualization mode](../assets/screenshots/ios/ios-visualization-fullscreen.png)

### Voice Commands

In full-screen mode, voice commands are available for hands-free control:

| Command | Action |
|---------|--------|
| "Start" | Begin program execution |
| "Stop" | Stop and reset the program |
| "Pause" | Pause execution |

!!! note
    Voice commands require microphone permission. The app will prompt you for access the first time you enter full-screen mode. You can manage this permission later in iOS Settings > Rhylthyme > Microphone.

To exit full-screen mode, tap the **collapse button** in the same position (top-right corner).

## Save, Share, and Download

A floating overlay with three action buttons appears over the visualization:

| Button | Description | Requires Login |
|--------|-------------|----------------|
| **Save** | Save the current program to your account | Yes |
| **Share** | Generate a share link (`rhylthyme://share=ID`) that others can open | Yes |
| **Download** | Export the program JSON to your device via the iOS share sheet | No |

!!! warning
    Save and Share require you to be signed in. If you tap either button while signed out, the app prompts you to log in first. See [Account & Settings](account.md) for sign-in options.

### Downloading a Program

When you tap **Download**, the app presents the standard iOS share sheet with the program JSON file. From there you can:

- Save to Files
- Copy to clipboard
- Send via AirDrop, Messages, Mail, or any other share extension

## Web View Details

The visualization runs inside a **WKWebView** using the same D3.js rendering engine as the Rhylthyme web app. This means:

- Visualizations are pixel-identical to [app.rhylthyme.com](https://app.rhylthyme.com)
- Pinch to zoom is supported within the web view
- The web view communicates with native controls via JavaScript bridge calls
