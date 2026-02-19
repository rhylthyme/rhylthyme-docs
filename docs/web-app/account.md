# Account

The Rhylthyme web app supports user accounts for saving programs, sharing them with others, and building a profile. Authentication is handled by Supabase with multiple sign-in options.

## Signing In

You can sign in from several locations in the interface:

- The **Sign In** button in the sidebar header (desktop)
- The **Sign In** button in the mobile brand header
- The **Sign In / Register** button on the welcome screen
- The **Sign In** prompt in the My Programs section

Clicking any of these opens the login modal with three authentication options:

### Google

Click **Continue with Google** to authenticate with your Google account. You will be redirected to Google's sign-in page and then back to the app.

### Apple

Click **Continue with Apple** to authenticate with your Apple ID. This follows the standard Apple Sign-In flow.

### Email Magic Link

1. Enter your email address in the text field.
2. Click **Send Link**.
3. Check your inbox for an email with a login link.
4. Click the link to be signed in automatically.

!!! note "No Password Required"
    Rhylthyme uses passwordless authentication. There is no traditional username/password registration. Your account is tied to your Google account, Apple ID, or email address.

## After Signing In

Once signed in, the interface updates to show:

- Your **display name** (or email) and **avatar** in the sidebar header
- The **My Programs** section populates with your saved programs
- **Save** and **Share** buttons become functional in the actions bar

### Interests Onboarding

On your first sign-in, you may be prompted to select interest categories (cooking, laboratory, manufacturing, etc.). These are stored in your profile and can be updated later. You can also skip this step.

## Saving Programs

To save a program to your account:

1. Load or create a program using any method (examples, upload, chat, URL).
2. Click the **Save** button in the top-right actions bar.
3. The program is stored in your account under "My Programs" in the sidebar.

Saved programs track:

- **Program title** -- Editable via the pencil icon next to the action buttons
- **Program JSON** -- The complete program data
- **Schema version** -- The Rhylthyme schema version
- **Last updated date** -- When the program was last saved

!!! tip "Updating a Saved Program"
    If you modify a program (via the Editor view or chat) and save again, it updates the existing saved entry rather than creating a duplicate.

## My Programs

The **My Programs** section in the sidebar shows all programs saved to your account, sorted by most recently updated.

Each program entry shows:

- The program name
- The last updated date
- A **visibility toggle** (lock/globe icon) to make it public or private
- A **delete button** to remove it

Click on a program to load and visualize it. The save state is preserved, so subsequent saves update the same entry.

### Public vs. Private Programs

- **Private** (default) -- Only you can see the program. Shown with a lock icon.
- **Public** -- The program appears in public search results and can be found by other users. Shown with a globe icon.

Click the visibility icon on any saved program to toggle between public and private.

## Sharing Programs

Sharing creates a permanent link that anyone can use to view your program.

1. Load the program you want to share.
2. Click the **Share** button in the actions bar.
3. If the program is not yet saved, it will be saved automatically first.
4. A share link is generated and copied to your clipboard.

The share URL has the format:

```
https://www.rhylthyme.com?share=<share_id>
```

Anyone who opens this URL will see the program visualization. They do not need an account to view it.

!!! note "Share vs. Public"
    **Sharing** creates a direct link to a specific program. **Making a program public** adds it to search results. You can share a private program -- only people with the link can access it. Making it public additionally lets people discover it through search.

## Downloading Programs

The **Download** button exports the current program as a `.json` file to your computer. This works whether or not you are signed in.

The filename is based on the program's `programId` field (e.g., `breakfast-schedule.json`).

## User Profiles

Signed-in users have a profile that other users can view.

### Editing Your Profile

Click your avatar or the edit button next to your name in the sidebar header to open the profile editor. You can set:

- **Display name** -- The name shown to other users
- **Bio** -- A short description
- **Avatar** -- Upload a profile picture

Click **Save Profile** to apply changes.

### Viewing Other Profiles

When browsing public programs or shared programs, author names are clickable. Clicking an author name opens their public profile, which shows:

- Display name and avatar
- Bio
- **Follower count** and **following count**
- A list of their public programs
- A **Follow** or **Edit Profile** button (depending on whether it is your own profile)

## Followers

The follower system lets you connect with other Rhylthyme users.

- **Follow** a user by clicking the "Follow" button on their profile.
- **Unfollow** by clicking the "Following" button (which appears when you already follow someone).
- View your **follower** and **following** counts on your own profile.

## Signing Out

Click the **Sign Out** option that appears next to your display name in the sidebar header. This clears your session and returns the interface to the signed-out state.

!!! warning "Unsaved Work"
    Signing out does not automatically save the currently loaded program. If you have unsaved changes, save or download the program before signing out.
