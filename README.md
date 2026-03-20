# Dependency Checker

🔍 GitHub Action to scan for outdated and vulnerable dependencies. Posts a summary comment on PRs.

## Features

✅ **npm audit**: Detects security vulnerabilities  
✅ **npm outdated**: Identifies outdated packages  
✅ **PR Comments**: Automatic summary posted to pull requests  
✅ **Configurable**: Choose what to check and fail conditions  

## Usage

```yaml
- uses: ollieb89/dependency-checker@v1.0.0
  with:
    npm-check-updates: true
    npm-audit: true
    fail-on-vulnerabilities: false
    fail-on-outdated: false
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `npm-check-updates` | `true` | Check npm packages for outdated versions |
| `npm-audit` | `true` | Run npm audit for security vulnerabilities |
| `fail-on-vulnerabilities` | `false` | Fail workflow if vulnerabilities found |
| `fail-on-outdated` | `false` | Fail workflow if outdated deps found |

## Outputs

| Output | Description |
|--------|-------------|
| `vulnerabilities-found` | Boolean: vulnerabilities detected |
| `outdated-found` | Boolean: outdated packages detected |
| `vulnerability-count` | Count of vulnerable packages |
| `outdated-count` | Count of outdated packages |

## Example Workflow

```yaml
name: Dependency Check
on: [pull_request]

jobs:
  deps:
    runs-on: ubuntu-latest
    steps:
      - uses: ollieb89/dependency-checker@v1.0.0
        with:
          fail-on-vulnerabilities: true
```

## License

MIT
