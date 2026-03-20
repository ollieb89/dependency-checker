const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const checkNpm = core.getInput('check-npm') === 'true';
    const checkPython = core.getInput('check-python') === 'true';
    const failOnVulnerable = core.getInput('fail-on-vulnerable') === 'true';
    const githubToken = core.getInput('github-token');

    let issues = [];
    let summary = '';

    // Check npm packages
    if (checkNpm) {
      core.info('Scanning npm dependencies...');
      const npmIssues = await scanNpm();
      issues.push(...npmIssues);
    }

    // Check Python packages
    if (checkPython) {
      core.info('Scanning Python dependencies...');
      const pythonIssues = await scanPython();
      issues.push(...pythonIssues);
    }

    // Generate summary
    if (issues.length === 0) {
      summary = '✅ All dependencies are up-to-date and secure!';
      core.info(summary);
    } else {
      summary = `⚠️ Found ${issues.length} dependency issues:\n\n`;
      issues.forEach((issue, i) => {
        summary += `${i + 1}. **${issue.package}** (${issue.type})\n   - Current: ${issue.current}\n   - Latest: ${issue.latest}\n   - Severity: ${issue.severity}\n\n`;
      });
    }

    // Post PR comment if in PR context
    if (github.context.eventName === 'pull_request' && githubToken) {
      const octokit = github.getOctokit(githubToken);
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: github.context.issue.number,
        body: `## 📦 Dependency Checker\n\n${summary}`
      });
    }

    // Set outputs
    core.setOutput('summary', summary);
    core.setOutput('issue-count', issues.length);

    // Fail if requested and issues found
    if (failOnVulnerable && issues.length > 0) {
      core.setFailed(`Found ${issues.length} dependency issues`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function scanNpm() {
  const issues = [];
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return issues;
  }

  try {
    // Run npm audit for vulnerabilities
    let auditOutput = '';
    await exec.exec('npm', ['audit', '--json'], {
      listeners: {
        stdout: (data) => {
          auditOutput += data.toString();
        }
      },
      ignoreReturnCode: true
    });

    const auditData = JSON.parse(auditOutput);
    
    if (auditData.vulnerabilities) {
      Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
        issues.push({
          package: pkg,
          type: 'vulnerability',
          current: vuln.installed || 'unknown',
          latest: vuln.fixed || 'varies',
          severity: vuln.severity || 'unknown'
        });
      });
    }

    // Check for outdated packages
    let outdatedOutput = '';
    await exec.exec('npm', ['outdated', '--json'], {
      listeners: {
        stdout: (data) => {
          outdatedOutput += data.toString();
        }
      },
      ignoreReturnCode: true
    });

    if (outdatedOutput) {
      try {
        const outdatedData = JSON.parse(outdatedOutput);
        Object.entries(outdatedData).forEach(([pkg, info]) => {
          if (info.current !== info.latest) {
            issues.push({
              package: pkg,
              type: 'outdated',
              current: info.current,
              latest: info.latest,
              severity: 'low'
            });
          }
        });
      } catch (e) {
        // outdated might output invalid JSON
      }
    }
  } catch (error) {
    core.warning(`npm scan failed: ${error.message}`);
  }

  return issues;
}

async function scanPython() {
  const issues = [];
  const requirementsPath = path.join(process.cwd(), 'requirements.txt');

  if (!fs.existsSync(requirementsPath)) {
    return issues;
  }

  try {
    let pipCheckOutput = '';
    await exec.exec('pip', ['check'], {
      listeners: {
        stdout: (data) => {
          pipCheckOutput += data.toString();
        }
      },
      ignoreReturnCode: true
    });

    if (pipCheckOutput.includes('ERROR')) {
      const lines = pipCheckOutput.split('\n');
      lines.forEach((line) => {
        if (line.includes('is incompatible')) {
          issues.push({
            package: line.split(' ')[0],
            type: 'conflict',
            current: 'unknown',
            latest: 'unknown',
            severity: 'high'
          });
        }
      });
    }
  } catch (error) {
    core.warning(`Python scan failed: ${error.message}`);
  }

  return issues;
}

run();
