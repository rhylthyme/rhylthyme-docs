# Chat

!!! info "Screenshots coming soon - placeholder images shown below."

The Chat tab provides a conversational interface for creating Rhylthyme programs with Claude AI. Describe what you want to schedule in plain language, and the AI generates a valid program for you.

<!-- TODO: Add iPhone screenshot -->
![Chat tab with an empty conversation](../assets/screenshots/ios/ios-chat.png)

## Creating a Program

1. Switch to the **Chat** tab
2. Type a description of the workflow you want to model -- for example:
    - "Create a schedule for making pancakes and bacon for breakfast"
    - "Plan a 3-hour lab experiment with two incubation steps"
    - "Schedule a morning airport departure with check-in, security, and boarding"
3. Tap **Send**
4. Claude analyzes your request and generates a Rhylthyme program JSON
5. The generated program automatically loads into the **Visualization** tab

<!-- TODO: Add iPhone screenshot -->
![Chat response with a generated program](../assets/screenshots/ios/ios-chat-response.png)

## Using Prompts

You can also start a conversation from a pre-written prompt:

1. Go to the **Home** tab
2. Scroll to the **Prompts** section
3. Tap any prompt card
4. The Chat tab opens with the prompt text already filled in
5. Tap **Send** to generate the program

This is a convenient shortcut when you want inspiration or a starting point.

## Conversation Flow

The chat supports multi-turn conversations. After the AI generates a program, you can follow up with modifications:

- "Add a 10-minute rest step between mixing and baking"
- "Make the incubation step 30 minutes instead of 20"
- "Add a second track for cleanup tasks"
- "Change the oven preheat to happen in parallel with prep"

Each follow-up generates an updated program that replaces the current visualization.

!!! tip
    Be specific about timing, dependencies, and resource assignments. The more detail you provide, the more accurate the generated program will be.

## Requirements

- An active internet connection is required for the Chat tab to function
- The AI service is powered by Claude and processes requests server-side
- No API key configuration is needed on your part -- the app handles authentication with the Rhylthyme backend

!!! note
    Chat history is stored locally on your device for the duration of the session. Starting a new conversation clears the previous history. Programs you want to keep should be saved to your account (requires sign-in) or downloaded as JSON files.
