# Duration evaluation: catalog runs

!!! warning "Not produced yet — gated on the observation window"

    This page is a placeholder on purpose. The held-out evaluation of
    prediction against the plan is only meaningful on **real** runs, and the
    catalog does not have enough of them yet. Nothing here is estimated,
    extrapolated or filled in from synthetic data; when the window closes the
    command below is run and its output replaces this page.

## What is being waited for

PRD §5's exit criterion: **30 days of recorded runs on the catalog's five
most-loaded programs**. Until then:

* most programs have fewer usable runs than the `--min-runs` gate, so
  `runs evaluate` reports *"fewer usable runs than --min-runs: nothing to
  hold out yet"* rather than a number;
* a program with, say, six runs would be split five/one, and a mean absolute
  error over a single held-out run is not a measurement of anything.

A *usable* run is one that completed on a wall clock at speed 1; a usable
*step* within it was ended by the executor and never paused. Both filters are
defined once, in
[`rhylthyme_cli_runner.history.usable`](../runs-schema.md#usable-runs), and a
run that fails them is excluded with a reason `runs report` prints.

## The command to run when the window closes

From the monorepo root, with the catalog's recorded runs in the runs
directory:

```bash
# Per program, with the program file so the roll-up knows each step's task
rhylthyme runs evaluate <programId-or-program-file> --format md \
    --out rhylthyme-docs/docs/development/reports/duration-evaluation-catalog.md

# ...or every program at once
rhylthyme runs evaluate --all --format md
```

Add `--since YYYY-MM-DD` to restrict the corpus to the observation window
itself, and `--format json --out …` beside the Markdown if the numbers are
wanted in machine-readable form. The defaults are the ones the acceptance
criterion assumes: `--holdout 0.2`, `--min-runs 5`,
`--verdict-min-runs 5`, `--cv-threshold 0.25`.

## What the page must answer

The acceptance criterion (PRD §8, last item):

> A held-out evaluation on catalog runs: predicted duration beats planned
> `defaultSeconds` in mean absolute error for at least the step types the
> inferentiality report marked predictable.

So the finished page needs, per program:

1. the per-step table with `n`, MAE predicted, MAE planned and improvement,
   with the `predictable` rows marked (the `*` column) — `runs evaluate`
   prints exactly this;
2. the roll-up by step type, where the claim is read off the
   *predictable improvement* column;
3. the `Claim` line — `holds`, or which step types it `FAILS` for;
4. the `basis` histogram, which says whether the numbers came from the
   identical-context branch or from the fitted model.

A step type where the claim fails is not a failure to be hidden: PRD §9 Q1
expects a large group of durations that are the executor's *choice* rather
than a measurable process, and the honest outcome is to leave those step
types on the planned values and say so.

## In the meantime

* [The synthetic evaluation](duration-evaluation-synthetic.md) — the same
  command on a corpus with a known generating law, which checks that the
  measurement itself is sound.
* `rhylthyme runs report <program>` — the inferentiality report, which is the
  prerequisite verdict and can already be run on whatever has been recorded.
