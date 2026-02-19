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
