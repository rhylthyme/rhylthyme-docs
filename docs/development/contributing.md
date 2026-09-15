# Contributing

## Getting Started

```bash
# Clone the repos
git clone https://github.com/rhylthyme/rhylthyme-spec.git
git clone https://github.com/rhylthyme/rhylthyme-cli-runner.git
git clone https://github.com/rhylthyme/rhylthyme-importers.git
git clone https://github.com/rhylthyme/rhylthyme-examples.git

# Create venv (Python 3.12+)
python3.12 -m venv .venv
source .venv/bin/activate

# Install in development mode
pip install -e ./rhylthyme-spec[dev]
pip install -e ./rhylthyme-cli-runner[dev]
pip install -e ./rhylthyme-importers[dev]
```

## Running Tests

```bash
# Run tests for a specific package
cd rhylthyme-cli-runner && pytest
cd rhylthyme-examples && pytest
```

## Code Style

- Python 3.12+ features are welcome
- Use type hints where practical
- Follow existing patterns in each package

## Re-baselining the prompt evaluation

`rhylthyme eval-prompts` scores agent-authored programs against the 24
expert programs in `rhylthyme-examples/gold/`. Two files in
`rhylthyme-cli-runner/eval/` hold the published numbers:

| file | what it is |
|---|---|
| `eval/four-turn.json` | The pattern `plan_schedule` ships. **This is the CI gate.** |
| `eval/baseline.json` | The historical single-message prompt, kept so the README can show what the four turns bought. Never a gate. |

Each file stores the model id, the date, a git note and the full
per-program results, so the pin and the numbers it produced can never
drift apart. The CI job `eval-prompts` re-runs the four-turn pattern
against the pinned model and fails on a relationships-F1 drop of more
than 5 points or **any** end-to-end pass-rate drop.

### When to re-baseline

- **Quarterly**, to rotate the model pin. Any pin goes stale, and drift
  in a pinned model's behaviour looks exactly like a prompt regression,
  so rotate on a schedule rather than in reaction to a red build.
- **When a prompt change is meant to move the numbers.** A deliberate
  improvement is a re-baseline, not a threshold bump: raise
  `--rel-f1-drop` only to debug, never to land a merge.
- **When the gold set grows.** New programs are reported as "new since
  the reference" and do not fail the gate, but the stored file should be
  extended in the same commit that adds them.

Do *not* re-baseline to silence a failure you do not understand. Read
the per-program rows the comparison prints first: a single program that
collapsed is a prompt bug, a broad shallow slide is usually model drift.

### How to re-baseline

Both files move together, in **one commit** that updates the model pin
and the JSON, with the before/after numbers in the commit message.

```bash
cd rhylthyme-cli-runner
export ANTHROPIC_API_KEY=...          # a live run spends real money
MODEL=claude-haiku-4-5-20251001       # the new pin

# The pattern that ships: this is the file CI gates on.
python -m rhylthyme_cli_runner.cli eval-prompts \
  --gold ../rhylthyme-examples/gold --model "$MODEL" \
  --patterns four-turn --concurrency 3 --max-fix-iterations 2 \
  --cache-dir eval/cache --out eval-results/four-turn \
  --write-baseline eval/four-turn.json

# The historical comparison, on the same model and the same day.
python -m rhylthyme_cli_runner.cli eval-prompts \
  --gold ../rhylthyme-examples/gold --model "$MODEL" \
  --patterns baseline --concurrency 3 --max-fix-iterations 2 \
  --cache-dir eval/cache --out eval-results/baseline \
  --write-baseline eval/baseline.json

# What changed against the old numbers (run before you commit them).
python -m rhylthyme_cli_runner.cli eval-prompts compare \
  --baseline eval/four-turn.json --results eval-results/four-turn/results.json -v
```

Then, in the same commit:

1. `eval/four-turn.json` and `eval/baseline.json` (new numbers, new pin,
   same date).
2. `eval/cache/` — the new response files. Keep the directory under
   about 1.5 MB; responses from a retired pin can be dropped.
3. The per-domain table in `rhylthyme-cli-runner/README.md`, with the
   model id and the date. The numbers are published in exactly one
   place and linked from elsewhere, so nothing else needs editing.
4. `pytest tests/test_eval_baseline.py` — it asserts both files share
   one pin, cover the same programs and cover all 24.

Rotating the pin without re-running is not a re-baseline: the comparison
warns when the reference and the results disagree about the model, and a
mismatched pin makes the gate meaningless.

## Submitting Changes

1. Fork the relevant repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## Repository Links

- [rhylthyme-spec](https://github.com/rhylthyme/rhylthyme-spec)
- [rhylthyme-cli-runner](https://github.com/rhylthyme/rhylthyme-cli-runner)
- [rhylthyme-importers](https://github.com/rhylthyme/rhylthyme-importers)
- [rhylthyme-examples](https://github.com/rhylthyme/rhylthyme-examples)
