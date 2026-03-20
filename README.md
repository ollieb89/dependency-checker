# 🔐 Dependency Checker

A GitHub Action to scan for outdated and vulnerable npm dependencies. Get instant visibility into your project's dependency health.

## Features

- ✅ **Vulnerability Scanning** — Detect security vulnerabilities using `npm audit`
- ✅ **Outdated Package Detection** — Find packages that have newer versions available
- ✅ **Severity Filtering** — Control which vulnerability levels trigger alerts
- ✅ **Workflow Summary** — Beautiful reports in GitHub Actions summary
- ✅ **Flexible Configuration** — Fine-tune checks to your needs

## Usage

```yaml
name: Dependency Check
on: [push, pull_request]

jobs:
  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ollieb89/dependency-checker@v1.0.0
        with:
          npm-check: 'true'
          severity: 'moderate'
          fail-on-outdated: 'false'
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `npm-check` | Scan npm dependencies | `true` |
| `severity` | Minimum severity level (low, moderate, high, critical) | `moderate` |
| `fail-on-outdated` | Fail workflow if outdated packages found | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `vulnerabilities-found` | Count of vulnerabilities |
| `outdated-found` | Count of outdated packages |
| `report` | Full JSON report |

## Examples

### Fail on High-Severity Vulnerabilities Only

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    severity: 'high'
    fail-on-outdated: 'false'
```

### Enforce No Outdated Packages

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    npm-check: 'true'
    fail-on-outdated: 'true'
```

## How It Works

1. Runs `npm audit --json` to detect security vulnerabilities
2. Runs `npm outdated --json` to find packages with newer versions
3. Filters results by severity level
4. Posts formatted summary to GitHub Actions summary
5. Optionally fails the workflow based on configuration

## Local Testing

```bash
npm install
npm run build
node dist/index.js
```

## License

MIT — See [LICENSE](LICENSE)

## Author

Built by [@ollieb89](https://github.com/ollieb89)
