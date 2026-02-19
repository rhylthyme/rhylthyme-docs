# iOS App

!!! info "Screenshots coming soon - placeholder images shown below."

Rhylthyme for iOS brings real-time program scheduling to your iPhone and iPad. Load example programs, create new ones with AI chat, visualize timelines with interactive playback, and sync your saved programs across devices.

<!-- TODO: Add iPhone screenshot -->
![Rhylthyme iOS app on iPhone showing the Home tab](../assets/screenshots/ios/ios-home.png)

## Key Features

- **Interactive Visualization** -- Timeline and itinerary views with native playback controls, speed adjustment (1x--60x), and full-screen mode with voice commands
- **AI Chat** -- Describe a workflow in plain language and let Claude generate a Rhylthyme program for you
- **Built-in Examples** -- Explore programs like Breakfast Schedule, Academy Awards, Lab Experiment, and more
- **Cloud Sync** -- Sign in with Google, Apple, or email to save and share programs via Supabase
- **Deep Links** -- Open shared programs directly with `rhylthyme://share=ID` links
- **iPad Support** -- Optimized split-view layout with sidebar navigation

## Architecture

Rhylthyme for iOS is a hybrid app built with **SwiftUI** and **WKWebView**. The native shell provides tab navigation, playback controls, authentication, and settings, while the visualization engine runs inside a web view using the same D3.js-powered renderer as the web app at [app.rhylthyme.com](https://app.rhylthyme.com).

This approach means the visualizations you see on iOS are identical to those on the web -- same timeline rendering, same itinerary layout, same execution engine.

## Device Layouts

=== "iPhone"

    iPhone uses a standard **tab bar** at the bottom of the screen with up to four tabs:

    | Tab | Description |
    |-----|-------------|
    | Home | Browse examples, prompts, your saved programs, upload, or load from URL |
    | Visualization | Appears after loading a program; shows timeline or itinerary with playback controls |
    | Chat | Conversational interface for creating programs with Claude AI |
    | Settings | Profile, preferences, sign out |

=== "iPad"

    iPad uses a **NavigationSplitView** with a persistent sidebar on the left and a detail pane on the right. The sidebar contains the same sections as the iPhone Home tab, while the detail pane shows the visualization or chat view.

    <!-- TODO: Add iPhone screenshot -->
    ![iPad split-view layout with sidebar and visualization](../assets/screenshots/ios/ios-ipad-layout.png)

## Requirements

- iOS 17.0 or later
- iPhone or iPad
- Internet connection required for AI chat, cloud sync, and loading programs from URL

## Next Steps

- [Getting Started](getting-started.md) -- Install the app and load your first program
- [Home Tab](home.md) -- Browse examples, manage programs, and import from URL
- [Visualization](visualization.md) -- Timeline and itinerary views with playback controls
- [Chat](chat.md) -- Create programs with AI
- [Account & Settings](account.md) -- Sign in, save, share, and configure preferences
