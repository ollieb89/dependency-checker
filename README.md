# Dependency Checker

GitHub Action to automatically scan for outdated and vulnerable dependencies in your repository.

## Features

✅ **npm Audit** — Detect npm security vulnerabilities  
✅ **npm Outdated** — Find outdated npm packages  
✅ **Python Check** — Detect Python dependency conflicts  
✅ **PR Comments** — Post results directly in pull requests  
✅ **Configurable Severity** — Fail workflow on critical issues  

## Usage

```yaml
name: Check Dependencies
on: [pull_request, push]

jobs:
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Dependency Checker
        uses: ollieb89/dependency-checker@v1.0.0
        with:
          check-npm: true
          check-python: true
          fail-on-vulnerable: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `check-npm` | `true` | Scan npm packages (package.json) |
| `check-python` | `true` | Scan Python packages (requirements.txt, pyproject.toml) |
| `fail-on-vulnerable` | `true` | Fail workflow if vulnerabilities found |
| `github-token` | `github.token` | GitHub token for PR comments |

## Outputs

| Output | Description |
|--------|-------------|
| `summary` | Human-readable dependency report |
| `issue-count` | Total number of issues found |

## Example Workflow

```yaml
- name: Check Dependencies
  uses: ollieb89/dependency-checker@v1.0.0
  with:
    check-npm: true
    fail-on-vulnerable: true
```

The action will post a comment on your PR with all findings, including package names, current/latest versions, and severity levels.

## License

MIT
