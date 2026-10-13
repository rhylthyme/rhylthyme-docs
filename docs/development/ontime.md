# Ontime importer

[Ontime](https://www.getontime.no) is a free, open-source rundown and
timer app for live events. A show in Ontime is a **rundown**: a list of
events, each with a clock start, an end and a duration, gathered into
groups, with milestones between them. The Ontime importer turns a rundown
into a Rhylthyme run of show you can share, play live, and check for
clashes.

It reads a rundown in either of the forms Ontime uses:

- **the project file** Ontime saves (`.json`, from *Download project*,
  version 4 or 3);
- **the rundown as a table**: Ontime's `.xlsx` export or import template, a
  Google Sheet, or the same table as CSV, TSV or Markdown. The columns are
  Ontime's: `time start`, `time end`, `duration`, `cue`, `title`, `note`,
  `link start`, `skip`, `timer type`. Case does not matter, and `start`,
  `end`, `name` and `notes` work too. Any other column, such as `presenter`,
  is kept as a custom field.

## A small example

A product launch evening, as a table in Ontime's column layout
([download it](../assets/examples/ontime/product-launch.csv)):

```csv
cue,title,time start,time end,duration,link start,timer type,note,presenter
,Doors,,,,,group,,
1,Doors open,18:00:00,18:30:00,00:30:00,,,House music; bar open,
,,,,,,group-end,,
,Keynote,,,,,group,,
2,Welcome,18:30:00,18:35:00,00:05:00,,,Walk-in music fades,Host
3,Product demo,18:35:00,19:05:00,00:30:00,x,,Two clickers on stage,CEO
,Mics live in the house,,,,,milestone,,
4,Audience Q&A,19:05:00,19:20:00,00:15:00,x,,Two roaming mics,Host
,,,,,,group-end,,
5,Reception,19:30:00,21:00:00,01:30:00,,,Canapés in the foyer,
```

The rows with `group` and `group-end` in the `timer type` column mark out
the sections, as in Ontime's spreadsheet. The `x` under `link start` means
"start when the previous event ends".

Imported, it becomes a program called *Product launch* with three tracks:

| Track | Step | Time | Starts |
|---|---|---|---|
| Doors | Doors open | 18:00–18:30 | at the start of the show |
| Keynote | Welcome | 18:30–18:35 | after *Doors open* |
| Keynote | Product demo | 18:35–19:05 | after *Welcome* |
| Keynote | Audience Q&A | 19:05–19:20 | after *Product demo*, with an alert "Mics live in the house" |
| Rundown | Reception | 19:30–21:00 | 1 h 30 min into the show, leaving the ten-minute gap |

Each step keeps what Ontime knew about the event in `metadata.ontime`:

```json
{
  "stepId": "4-audience-q-a",
  "name": "Audience Q&A",
  "description": "Two roaming mics",
  "startTrigger": { "type": "afterStep", "stepId": "3-product-demo" },
  "duration": { "type": "fixed", "seconds": 900 },
  "alerts": [{ "event": "start", "message": "Mics live in the house" }],
  "metadata": {
    "ontime": {
      "cue": "4",
      "timeStart": "19:05:00",
      "timeEnd": "19:20:00",
      "custom": { "presenter": "Host" },
      "markers": [{ "kind": "milestone", "title": "Mics live in the house" }]
    }
  }
}
```

## Importing

### Web app

On [events.rhylthyme.com](https://events.rhylthyme.com), open **Upload
Program** and drop the file: an `.xlsx` or `.csv` rundown, or the `.json`
project file Ontime saved. An Ontime project is told apart from a
Rhylthyme program by its contents, so either kind of `.json` can be
uploaded. The timeline opens straight away.

### Claude and other MCP clients

Ask for it in words ("import this Ontime rundown") and paste the table or
the project JSON, or give a link. The assistant calls `import_from_source`
with `source: "ontime"` and `action: "import"`, and either:

- `text`: the project JSON, or the table as CSV, TSV or Markdown;
- `query`: a public URL to the JSON or CSV, or a Google Sheet's share
  link. The sheet must be shared as *anyone with the link can view*; it is
  read as its CSV export.

Imports need a signed-in Rhylthyme account, as every import does.

### Command line and Python

```bash
rhylthyme import show.xlsx -i ontime
rhylthyme import product-launch.csv -i ontime --publish
```

```python
from rhylthyme_importers import OntimeImporter

result = OntimeImporter(allow_local_files=True).import_from_url("show.json")
result = OntimeImporter().import_from_source(csv_text, title="Product launch")
program = result.program
```

## How a rundown becomes a program

| In Ontime | In the program |
|---|---|
| Rundown | The program. A project's title and the rundown's title name it. |
| Group | A track. Events outside any group go on a track called *Rundown*. |
| Event | A step with a fixed duration. The title is the step name and the note is its description. |
| Linked event (`link start`) | Starts after the step before it. |
| Event at its own clock time | Starts that long after the first event (`programStartOffset`), so gaps stay gaps. One that starts just as the previous event ends follows it instead. |
| Two events at once | The later one goes on a track of its own (*… (overlap)*), since steps in one track never overlap. |
| Milestone | An alert on the next step's start, or at the end of the last step. |
| Event with no length | The same as a milestone. |
| Skipped event | Left out, and listed in `metadata.ontime.skippedEvents`. |
| Delay | Ignored, as in Ontime's own spreadsheet export. A delay adjusts a running show, not the plan. |
| Cue, clock times, end action, timer type, colour, custom fields | `metadata.ontime` on the step. |

Times are read as Ontime reads them:

- `09:30`, `0930` and `9:30 am` are all half past nine; `7p` is 7 pm.
- A bare `15` is fifteen minutes. `1h30` is an hour and a half.
- In a yes/no column such as `link start` or `skip`, anything but `false`
  means yes.
- Days roll over as they do in Ontime. An event whose clock time is not
  after the previous event's is on the next day, and so is one that follows
  an event running past midnight.

A project with more than one rundown imports the first one that has
events. From Python, pass `rundown=` with the rundown's id or title to
choose another.

### Where it differs from Ontime's spreadsheet import

- **Without a `link start` column, the gaps are kept.** Ontime links every
  row of such a table to the one before it, which closes up the gaps. The
  importer links only the rows that have no start time.
- **A table needs a time column.** It must have `time start`, `time end` or
  `duration`, and one more of Ontime's columns, to be recognised as a
  rundown.

The program does not set a start date, because Ontime does not store one.
The show's first clock time is in `metadata.ontime.showStart`. Give a date
when you analyse or play the program (`startAt` in `analyze_schedule`) to
put it on the wall clock.
