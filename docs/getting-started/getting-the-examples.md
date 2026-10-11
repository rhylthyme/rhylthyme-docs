# Getting the Examples

The example programs referenced in this documentation are maintained in a separate repository. To use them:

## Option 1: Clone the Examples Repository Alongside

```bash
# Navigate to the parent directory of rhylthyme
cd ..

# Clone the examples repository
git clone https://github.com/rhylthyme/rhylthyme-examples.git

# Run examples using relative paths
cd rhylthyme
rhylthyme run ../rhylthyme-examples/programs/breakfast_schedule.json
```

## Option 2: Clone Examples as a Subdirectory

```bash
# From within the rhylthyme directory
git clone https://github.com/rhylthyme/rhylthyme-examples.git examples

# Run examples directly
rhylthyme run examples/programs/breakfast_schedule.json
```

## Option 3: Download Individual Examples

```bash
# Download a specific example file
curl -O https://raw.githubusercontent.com/rhylthyme/rhylthyme-examples/main/programs/breakfast_schedule.json

# Run the downloaded file
rhylthyme run breakfast_schedule.json
```
