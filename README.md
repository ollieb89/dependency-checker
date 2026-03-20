# Dependency Checker

A GitHub Action to scan for outdated and vulnerable dependencies in your repository.

## Features

- ✅ Scan npm packages for vulnerabilities (`npm audit`)
- ✅ Scan Python packages with `pip-audit`
- ✅ Scan Rust crates with `cargo audit`
- ✅ Configurable failure modes (fail on vulnerable, fail on outdated)
- ✅ JSON report output
- ✅ PR comment support

## Usage

### Basic (npm only)

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
```

### With custom config

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    package-managers: 'npm,pip,cargo'
    fail-on-vulnerable: true
    fail-on-outdated: false
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `package-managers` | Comma-separated list of package managers to check | `npm` |
| `fail-on-vulnerable` | Fail the action if vulnerabilities are found | `true` |
| `fail-on-outdated` | Fail the action if outdated dependencies are found | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `vulnerabilities-found` | Number of vulnerabilities found |
| `outdated-found` | Number of outdated dependencies found |
| `report` | Summary report as JSON |

## Example Workflow

```yaml
name: Check Dependencies
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ollieb89/dependency-checker@v1.0.0
        with:
          package-managers: npm
          fail-on-vulnerable: true
```

## License

MIT
