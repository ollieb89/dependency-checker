# Dependency Checker

A GitHub Action that scans your project for outdated and vulnerable dependencies.

## Features

✅ **npm audit** — Find security vulnerabilities  
✅ **Outdated check** — Identify outdated packages  
✅ **Configurable** — Choose what to check and whether to fail  
✅ **PR summaries** — Auto-post results to pull requests  
✅ **JSON reports** — Structured output for custom workflows  

## Usage

```yaml
- name: Check dependencies
  uses: ollieb89/dependency-checker@v1.0.0
  with:
    npm-audit: true
    outdated-check: true
    fail-on-vulnerabilities: true
    fail-on-outdated: false
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `npm-audit` | No | `true` | Run npm audit for vulnerabilities |
| `outdated-check` | No | `true` | Check for outdated dependencies |
| `fail-on-vulnerabilities` | No | `true` | Fail workflow if vulnerabilities found |
| `fail-on-outdated` | No | `false` | Fail workflow if outdated dependencies found |
| `exclude-dev` | No | `false` | Exclude dev dependencies from checks |

## Outputs

| Output | Description |
|--------|-------------|
| `vulnerabilities` | Number of vulnerabilities found |
| `outdated` | Number of outdated packages |
| `audit-report` | Full audit report in JSON |
| `outdated-report` | Full outdated report in JSON |

## Examples

### Basic usage (fail on vulnerabilities)

```yaml
name: Deps
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ollieb89/dependency-checker@v1.0.0
```

### Warn only (don't fail)

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    fail-on-vulnerabilities: false
    fail-on-outdated: false
```

### Strict mode (fail on both)

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    fail-on-vulnerabilities: true
    fail-on-outdated: true
```

## How it works

1. Runs `npm audit --json` to detect security vulnerabilities
2. Runs `npm outdated --json` to identify outdated packages
3. Posts a summary to the PR (if running in a PR context)
4. Optionally fails the workflow based on configuration

## SEO Tags

`github-action`, `npm-audit`, `dependency-management`, `security`, `devops`, `continuous-integration`, `vulnerability-scanning`, `dependency-checker`, `npm-packages`, `ci-cd`

## License

MIT — see [LICENSE](./LICENSE)
