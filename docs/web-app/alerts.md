# Alerts and Notifications

A program can tell the person running it when something is about to happen:
"the oven is nearly hot, get the trays ready", "take the tray out now". These
are **alerts**. The program's author sets them on individual steps, and the
live runner delivers them at the right moment. On the web you get a banner and
a chime, and the iOS and Android apps also send a phone notification while
the app is in the background.

Alerts are tied to the program clock, not to wall-clock time. They move when
the schedule moves, a pause holds them, and at 10x speed they arrive ten
times sooner.

## Adding alerts to a step

Give a step an `alerts` array. Each alert is anchored to the step's **start**
or **end**. It can be moved earlier (negative offset) or later (positive
offset):

```json
{
  "stepId": "preheat",
  "name": "Preheat the oven",
  "task": "oven",
  "startTrigger": { "type": "programStart" },
  "duration": { "type": "fixed", "seconds": "12m" },
  "alerts": [
    { "event": "end", "offsetSeconds": "-2m", "message": "Oven is nearly hot: get the trays ready" }
  ]
}
```

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `event` | yes | | `"start"` or `"end"`: the moment of this step the alert is anchored to |
| `offsetSeconds` | no | `0` | Seconds from that moment: a number (`-120`) or a time string (`"-2m"`, `"30s"`, `"1h30m"`). Negative is before, positive is after |
| `message` | no | see below | Plain text, 1 to 200 characters |
| `level` | no | `"notice"` | `"notice"` or `"alarm"`. An alarm can ring as a device alarm in the apps when the person has turned on **Use Alarms**. On the web an alarm banner stays until dismissed and the chime plays three times |

The full field reference is in the
[Program Schema Reference](../development/schema.md#alerts). Alerts need
program schema package 0.2.3-alpha or later, and work with both the 0.2.0-alpha
and 0.3.0-alpha program schemas.

### A heads-up before a step ends

The most common alert is a warning shortly before a step finishes, as in the
oven example above: `"event": "end"` with a negative offset. It fires two
minutes before the step's projected end. If the step runs late or is
completed early, the alert moves with it.

### A notice when a step starts

`"event": "start"` with no offset fires the moment the step begins. Without
a `message`, the runner shows a default text:

```json
"alerts": [ { "event": "start" } ]
```

| Alert | Default text |
|-------|--------------|
| `start`, offset 0 | Starting now |
| `start`, negative offset | Starts in 2 min |
| `start`, positive offset | Started 2 min ago |
| `end`, negative offset | Ends in 2 min |
| `end`, offset 0 | Done |
| `end`, positive offset | Ended 2 min ago |

The alert's title is always the step's name. Default texts are translated
into the web app's six languages. Your own `message` is shown as written.

### An alarm when it really matters

Use `"level": "alarm"` for the alerts that must not be missed:

```json
"alerts": [
  { "event": "end", "level": "alarm", "message": "Take the tray out" }
]
```

On the web an alarm banner stays on screen until it is dismissed, and the
chime plays three times. In the iOS and Android apps, an alarm rings as a
real device alarm when **Use Alarms** is on. See
[iOS](#ios-app) and [Android](#android-app) below.

### Repeated steps

A step with `replicates` expands into one instance per repetition, and each
instance gets its own copy of the alerts. This step alerts three times at the
start and three times at the end, once for each tray:

```json
{
  "stepId": "bake",
  "name": "Bake tray",
  "task": "oven",
  "startTrigger": { "type": "afterStep", "stepId": "preheat" },
  "duration": { "type": "fixed", "seconds": "20m" },
  "replicates": { "count": 3, "mode": "serial" },
  "alerts": [
    { "event": "start" },
    { "event": "end", "level": "alarm", "message": "Take the tray out" }
  ]
}
```

The alert title names the instance, for example "Bake tray (2 of 3)", so you
know which tray it is about.

### Try it

The **Sunny Side Up Eggs** example program
([`programs/sunny_side_up_eggs.json`](https://github.com/rhylthyme/rhylthyme-examples/blob/main/programs/sunny_side_up_eggs.json)
in rhylthyme-examples) has a heads-up 30 seconds before the pan is hot, a
reminder to check the whites, and an alarm when the eggs are done.

## When an alert fires

- An alert fires **once per run**, when the program clock reaches its anchor
  plus its offset.
- Before a step has started or ended, the runner uses its **projected** start
  or end, and keeps recalculating as the schedule changes. A step that slides
  later because a manual step is waiting, or that is completed early, takes
  its alerts with it.
- An alert at or after the start of a step (offset 0 or positive) fires from
  the step's **actual** start. An alert at or after the end fires from its
  actual end.
- If a step starts or ends before a "before" alert's time arrives (for
  example, you complete a step early), that alert is skipped.
- Steps on a choice branch you did not pick never alert.
- **Pause** holds every alert. **Stop** resets them, so the next run alerts
  again.

### Alerts that can never fire

Some alerts ask for a time the runner cannot know in advance. They never
fire, and the validators (`rhylthyme validate`, the `validate_program` MCP
tool) warn about them:

| Code | Severity | What it means | What to do |
|------|----------|---------------|------------|
| `W_ALERT_BEFORE_MANUAL_START` | warning | A `start` alert with a negative offset on a step whose `startTrigger` is `manual`. Nobody knows when the person will press **Start** | Anchor the alert on the end of the step before it, or use an offset of 0 or more |
| `W_ALERT_BEFORE_INDEFINITE_END` | warning | An `end` alert with a negative offset on an `indefinite` step. The step has no projected end | Use an offset of 0 or more, or give the step a fixed or variable duration |
| `W_ALERT_BEFORE_PROGRAM_START` | warning | A `start` alert with a negative offset that would fall before the program starts: a `programStart` step, or a `programStartOffset` shorter than the offset | Shorten the offset, or delay the step with `programStartOffset` |
| `E_ALERT_BAD_OFFSET` | error | `offsetSeconds` is neither a number nor a readable time string (for example `"soon"`) | Use a number of seconds or a string such as `"-2m"` |

For example, `rhylthyme validate` reports:

```
Warnings:
  - [W_ALERT_BEFORE_MANUAL_START] Alert 0 on step 'b' fires 30 s before the
    step starts, but the step starts manually, so its start cannot be predicted
    and the alert never fires. (fix: Anchor it on the end of the step before,
    or use offsetSeconds >= 0.)
```

The `validate_program` MCP tool reports the same codes and fixes, formatted
as a Markdown list.

Alerts that break the format (an unknown `event` or `level`, an empty or
over-long `message`, an unknown key, an empty `alerts` array) fail schema
validation. The hosted `validate_program` tool reports these as `bad_alert`
errors with a fix for each.

Warnings do not make a program invalid. The alert is simply ignored at run
time.

!!! warning "Known limitation: before-start alerts on negative-offset steps"
    A step whose `startTrigger` is `afterStep` with a **negative**
    `offsetSeconds` ("peel the potatoes 45 minutes before the roast is done")
    waits for you to press **Start** on the web, just like a manual step (see
    [When predicted offsets are on](manual-controls.md#when-predicted-offsets-are-on)).
    A `start` alert with a negative offset on such a step therefore does
    **not** fire, on the web or in the apps. The validators do not warn about
    this case yet, and `analyze_schedule` still lists the alert at its planned
    time. Use an alert at offset 0 or later on that step instead, or put the
    heads-up on the step it is waiting for.

## On the web

The web runner at [app.rhylthyme.com](https://app.rhylthyme.com) delivers
every alert while a program is playing:

- **Banner:** alerts appear at the top of the page and stack if several arrive
  together. A notice closes by itself after 8 seconds, and an alarm stays
  until you dismiss it. Every banner has a close button.
- **Sound:** a short chime, played three times for an alarm. On devices that
  support it, the phone also vibrates.
- **Browser notification:** if you turn on **Browser notifications**, an alert
  that comes due while the tab is in the background also shows as a system
  notification.

### Settings

Open **Settings** (the gear icon in the execution panel). The alert options are
in the execution section:

| Setting | Default | What it does |
|---------|---------|--------------|
| **Program alerts** | on | Shows the alerts a program sets on its steps. Turn it off to run without any alerts |
| **Alert sound** | on | Plays the chime with each alert |
| **Browser notifications** | off | Also notifies you when the tab is in the background. Turning it on asks your browser for permission. If notifications are blocked for the site, the setting says so, and you can allow them in your browser's site settings |

Settings are saved in your browser, like the other visualization settings.
**Browser notifications** is not shown inside the iOS and Android apps,
because the apps send their own notifications.

!!! tip "Background tabs"
    Browsers slow down timers in background tabs, sometimes to once a minute.
    The program clock still keeps correct time, but an alert can arrive up to
    about a minute late in a background tab. If the browser held the tab for
    so long that an alert is more than five minutes overdue, it is skipped
    instead of shown late. For time-critical alerts, keep the tab in front or
    use the mobile app.

## iOS app

In the iOS app, alerts that come due while the app is **open** are shown
in the timeline as in-app banners, the same as on the web. Alerts that come
due while the app is in the **background** or the phone is locked arrive as
iOS notifications. The app schedules them with iOS ahead of time, so they
arrive even though the app is not running.

The settings are in the **Settings** tab, in the Visualization section:

| Setting | Default | What it does |
|---------|---------|--------------|
| **Program Alerts** | on | Sends the program's alerts as notifications while Rhylthyme is in the background. It needs notification permission. When it is off, alerts are still shown in the app while it is open |
| **Use Alarms** | off | Rings `"level": "alarm"` alerts as alarms, which sound through silent mode and Do Not Disturb. Requires iOS 26 or later and **iOS Notifications** turned on |

Pausing, resuming, stopping or changing speed from the app, the Live Activity,
Control Center or voice control reschedules the notifications at once. A
pause or stop cancels the ones still pending.

iOS keeps up to 60 program alerts scheduled at a time, the soonest first.

!!! note "Alarms while the app is open"
    iOS cannot hide an alarm while the app is on screen. With **Use Alarms**
    on, an alarm-level alert that comes due while the app is open may ring as
    an alarm and show as an in-app banner at the same time.

## Android app

The Android app works the same way. While the timeline is **on screen**,
alerts are shown in the app. While Rhylthyme is **not on screen**, they are
posted as Android notifications.

The settings are on the **Settings** screen:

| Setting | Default | What it does |
|---------|---------|--------------|
| **Program Alerts** | on | Notifies you of the program's alerts when Rhylthyme is not on screen. Turning it on asks for notification permission if needed. If notifications are blocked, the row says so and opens the system settings |
| **Use Alarms** | off | Shows `"level": "alarm"` alerts as full-screen alarms. Requires **Notifications** to be on, and Android may ask for permission to show full-screen alerts |

Pause, resume, stop and speed changes from notification actions, tiles,
shortcuts or voice update the pending alerts even when the timeline is not
open.

!!! note "Delivery timing on Android"
    To work around battery saving (Doze), the app also sets a system alarm
    for each upcoming alert. On Android 12 and later these are inexact, so
    an alert can arrive a little late when the phone has been idle. If
    Android closes the app completely, alerts still pending are lost, the
    same as manual-step notifications.

## Planning with analyze_schedule (MCP)

The [`analyze_schedule`](mcp.md#analyze_schedule) tool on the Rhylthyme MCP
server lists every alert it can place on the plan. Each step in its result has
an `alerts` array:

```json
"alerts": [
  { "event": "end", "offsetSeconds": -120, "atSeconds": 600,
    "at": "2026-10-10T18:10:00.000Z",
    "message": "Oven is nearly hot: get the trays ready", "level": "notice" }
]
```

`atSeconds` is the planned fire time in program seconds. `at` is the clock
time, included only when you pass `startAt` or `finishAt`. Alerts without a
`message` get the default text. The text summary has an **Alerts** section
in time order, and the itineraries show alerts at their fire times:

```
**Alerts (7):**
- 2026-10-10 18:10 Preheat the oven: Oven is nearly hot: get the trays ready
- 2026-10-10 18:12 Bake tray (1 of 3): Starting now
- 2026-10-10 18:32 Bake tray (1 of 3): Take the tray out (alarm)
- 2026-10-10 18:32 Bake tray (2 of 3): Starting now
...
```

The list is the **plan**. It leaves out alerts whose time cannot be planned:

- every `start` alert on a manual step and every `end` alert on an indefinite
  step, since they depend on when the person acts
- alerts that would fall before the program starts
- alerts whose offset cannot be read

At run time, alerts move with the actual schedule as described in
[When an alert fires](#when-an-alert-fires).

`validate_program` on the hosted MCP server reports all four alert codes.
The local `rhylthyme-mcp` server shows validation errors only, so it reports
`E_ALERT_BAD_OFFSET` but not the three warnings.
