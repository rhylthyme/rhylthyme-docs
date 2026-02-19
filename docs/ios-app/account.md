# Account & Settings

!!! info "Screenshots coming soon - placeholder images shown below."

Sign in to save programs to the cloud, share them with others, and sync your library across devices. Rhylthyme uses Supabase for authentication and storage.

## Signing In

Rhylthyme supports three sign-in methods. All three create or link to the same account based on your email address.

### Google

1. Tap **Continue with Google**
2. Select your Google account in the OAuth popup
3. You are signed in immediately

### Apple

1. Tap **Continue with Apple**
2. Authenticate with Face ID, Touch ID, or your device passcode
3. Choose whether to share or hide your email address
4. You are signed in immediately

### Email Magic Link

1. Tap **Continue with Email**
2. Enter your email address
3. Check your inbox for a sign-in link from Rhylthyme
4. Tap the link to complete sign-in

!!! note
    The magic link expires after 60 minutes. If it expires, request a new one from the sign-in screen.

<!-- TODO: Add iPhone screenshot -->
![Sign-in screen with Google, Apple, and email options](../assets/screenshots/ios/ios-login.png)

## Saving Programs

Once signed in, you can save any loaded program to your account:

1. Load a program (from an example, chat, upload, or URL)
2. In the **Visualization** tab, tap the **Save** floating button
3. The program is stored in your account and appears in **My Programs** on the Home tab

Saved programs sync across all your devices -- iPhone, iPad, and the web app at [app.rhylthyme.com](https://app.rhylthyme.com).

## Sharing Programs

To share a program with someone else:

1. Load the program you want to share
2. In the **Visualization** tab, tap the **Share** floating button
3. A share link is generated with the format `rhylthyme://share=ID`
4. The iOS share sheet opens so you can send the link via Messages, Mail, AirDrop, or any other method

When the recipient taps the link on a device with Rhylthyme installed, the app opens and loads the shared program directly.

!!! tip
    Share links point to a public, read-only copy of the program. The recipient gets their own copy and cannot modify your saved version.

Shared programs are also accessible on the web at `https://app.rhylthyme.com/?share=ID`.

## Settings

The Settings tab lets you manage your profile and app preferences.

<!-- TODO: Add iPhone screenshot -->
![Settings screen with profile and preferences](../assets/screenshots/ios/ios-settings.png)

### Profile

- **Display Name** -- Edit the name shown on your account
- **Email** -- Displays the email associated with your sign-in method (read-only)

### Preferences

| Setting | Description | Options |
|---------|-------------|---------|
| **Time Format** | Controls how timestamps are displayed in the visualization and itinerary | 12-hour (default) or 24-hour |

### Sign Out

Tap **Sign Out** at the bottom of the Settings tab to log out. Your saved programs remain in the cloud and will be available when you sign in again.

## Data and Privacy

- **Account data** is stored in Supabase (hosted on AWS)
- **Saved programs** are private by default and only visible to you
- **Shared programs** are read-only and accessible to anyone with the share link
- **Chat history** is stored locally on your device and not synced to the cloud
- **No tracking or analytics** beyond basic Supabase authentication logs
- Deleting your account removes all saved and shared programs permanently
