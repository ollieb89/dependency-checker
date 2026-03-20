# Dependency Checker

A GitHub Action to scan for **outdated and vulnerable dependencies** with `npm audit` and version checks.

## Features
✅ Run npm audit to detect vulnerabilities  
✅ Check for outdated packages  
✅ Optional PR comments with results  
✅ Fail on high/critical vulnerabilities  
✅ Fail on outdated packages (optional)  

## Usage

```yaml
name: Dependency Check

on: [pull_request, push]

jobs:
  check-deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ollieb89/dependency-checker@v1.0.0
        with:
          check-npm-audit: true
          check-outdated: true
          fail-on-high: true
          comment-pr: true
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `node-version` | `22` | Node.js version to use |
| `check-npm-audit` | `true` | Run npm audit for vulnerabilities |
| `check-outdated` | `true` | Check for outdated packages |
| `fail-on-high` | `true` | Fail if high/critical vulnerabilities found |
| `fail-on-outdated` | `false` | Fail if outdated packages found |
| `comment-pr` | `true` | Post results as PR comment |

## Outputs

| Output | Description |
|--------|-------------|
| `audit-found` | Number of high/critical vulnerabilities found |
| `outdated-count` | Number of outdated packages |
| `audit-summary` | Detailed audit summary |

## Example

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    check-npm-audit: true
    fail-on-high: true
    comment-pr: true
```

This will:
1. Run npm audit to check for vulnerabilities
2. Fail the workflow if high/critical vulnerabilities are found
3. Post a PR comment with the results

## License
MIT
