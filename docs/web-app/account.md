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

## Runs

A **run** is one execution of a program. When you play a program in the
live timeline player, the player records what actually happened and saves
it beside the program in your library, so the next time you open it you can
see how long it really took rather than only how long it was supposed to
take. The full field-by-field reference is the
[runs schema](../development/runs-schema.md).

The **Runs** list under the player shows, newest first:

- when the run started;
- how it ended — `completed` (every step finished), `aborted` (you pressed
  Stop part-way) or `abandoned` (you closed the page mid-run);
- the actual total against the planned total, with the deviation;
- a **JSON** button that shows the whole record.

### What a run record contains

- The program's id and a content hash of the exact program JSON that was
  run, so a later edit to the program does not rewrite history.
- The planned start, end and duration of every step, frozen at the moment
  you pressed Start.
- The actual start and end of every step, and what ended it: you marking it
  done, its timer expiring, another step's hand-off, or an abort.
- How long the clock was paused while each step was running, including time
  the page spent in the background or the phone spent asleep.
- Which runtime wrote the record (web player or terminal runner), its
  version, whether the clock was wall-clock or simulated, and the playback
  speed.
- A copy of the program's own metadata (serves, source URL, ...) and your
  answers to any **variance factors** the author declared — nothing you did
  not enter yourself. If a program asks what is different about this run
  (turkey weight, oven type, sample count), the player puts a short form
  above the timeline the first time you press Start; every field is optional
  and the answers go into the record. See
  [manual controls](manual-controls.md#before-you-start-variance-factors).

There is no free text in a run record unless you type a note on a step.

### Runs while signed out

If you play a program without signing in, the record is kept **in your
browser only** (`localStorage`, newest 20 runs) and never sent anywhere. A
**Save this run?** prompt appears under the player; signing in uploads the
runs held in the browser to your library and clears them from local
storage. Clearing your browser data deletes them.

### Who can see your runs, and deleting them

Runs are **private to you**, even for a program you have made public: a
public program can be cooked by anyone, and each person's runs stay their
own. Sharing a program does not share its runs.

- Via MCP: `list_runs` and `load_run` return your own runs and nobody
  else's (see [MCP Server](mcp.md)).
- Deleting a run: `DELETE /api/mcp/runs/<run_id>` with your access token.
- Deleting a program deletes its runs with it.
- No run of yours leaves your account unless you contribute it, per run,
  with the checkbox described next.

### Turning your runs into better durations

Once a program has runs, its durations are checkable — and correctable.
Under the Runs list, signed in and with at least one recorded run, a
**Calibrate from my runs** card appears.

Pressing **Calibrate from my runs** asks the server what your runs imply.
Nothing changes: you get a table with one row per step — how many of your
runs measured it, what the program says now, what the runs propose, and the
difference — plus a line saying what accepting the lot would do to the total
time. Every step with a number to propose is ticked; untick the ones you
disagree with.

**Apply the checked steps** asks you to confirm, in the page rather than in a
pop-up, and tells you exactly which steps it is about to change. Saying yes
does two things:

1. writes the proposed durations into the program, each one stamped with
   `calibratedFrom: {runs, asOf, programVersion}` — how many runs it came
   from, when, and the hash of the plan those runs executed;
2. saves that program to your library, replacing the version that was there.

It is an ordinary save, so it is the same program in the same place; only the
durations moved, and the stamp says why. Steps carrying the stamp get a green
badge in the Runs card from then on, so a calibrated duration is never
mistaken for one you wrote.

Nothing else is touched. The runs themselves are untouched, your other
programs are untouched, and the proposal is never applied on its own —
declining leaves the program exactly as it was. The rules the proposal
follows (a range is never narrowed, a fixed step is never given a new number,
a step with fewer than five measurements is skipped) are set out in
[Calibrate from runs](visualization.md#calibrate-from-runs).

### Contributing runs to the public catalog

Under the player there is a checkbox, **Contribute this run to the public
catalog**. It is **off** unless you turn it on, it applies to the runs you
record from then on, and the setting is remembered on that device only
(nothing about it is stored on your account). It appears once you are signed
in, because a contribution is made with your own credentials.

With it on, finishing a run stores **two** records: the full one in your own
library, as before, and a second, narrower copy in the public catalog. The
public copy contains:

- the canonical hash of the program JSON that was run — the only key it is
  stored under;
- the program's `programId` and the run's own id and timestamps;
- which runtime ran it, its version, the clock mode and the speed;
- the planned and actual start and end of every step, what ended each step,
  when its trigger fired, what it waited on, and how long it was paused;
- `serves`, `actors`, `environmentType` and your answers to the program's
  declared variance factors.

It does **not** contain your user id (there is no owner column on the public
table at all), the id of your library entry, or any note you typed on a
step — notes are the one place a run record can hold free text, and they are
removed before the copy is made. Nothing else from the program's metadata
rides along either: no source URL, no title, no ingredient list.

Two consequences worth knowing before you tick it:

- **A contribution cannot be withdrawn.** Because the row records no owner,
  there is nothing to identify your contribution by. Deleting the run from
  your library, or your whole account, does not remove the contributed copy.
- **It is keyed by the exact program JSON.** Edit the program and its
  contributed runs no longer match it, which is the point: a plan and the
  record of a plan being executed stay tied to each other.

Anyone — signed in or not — can read contributed runs for a program version:
`GET /api/public/runs?programHash=sha256:…`, or the MCP tool
`list_public_runs` (see [MCP Server](mcp.md#list_public_runs)). What is
stored is also set out in the [privacy policy](../privacy.md#execution-records-runs).

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
