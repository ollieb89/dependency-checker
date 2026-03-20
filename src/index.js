const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function run() {
  try {
    const npmCheckUpdates = core.getInput('npm-check-updates') === 'true';
    const npmAudit = core.getInput('npm-audit') === 'true';
    const failOnVulnerabilities = core.getInput('fail-on-vulnerabilities') === 'true';
    const failOnOutdated = core.getInput('fail-on-outdated') === 'true';

    let reportLines = ['## 📦 Dependency Check Report\n'];
    let vulnerabilityCount = 0;
    let outdatedCount = 0;
    let hasVulnerabilities = false;
    let hasOutdated = false;

    // Check npm audit
    if (npmAudit) {
      try {
        reportLines.push('### 🔒 Security Audit\n');
        const { stdout, stderr } = await execAsync('npm audit --json 2>/dev/null || true', {
          maxBuffer: 10 * 1024 * 1024,
        });

        if (stdout) {
          const auditData = JSON.parse(stdout);
          vulnerabilityCount = auditData.metadata?.vulnerabilities?.total || 0;

          if (vulnerabilityCount > 0) {
            hasVulnerabilities = true;
            const critical = auditData.metadata?.vulnerabilities?.critical || 0;
            const high = auditData.metadata?.vulnerabilities?.high || 0;

            reportLines.push(
              `❌ **${vulnerabilityCount} vulnerabilities found**\n`,
              `- Critical: ${critical}\n`,
              `- High: ${high}\n`
            );

            if (auditData.vulnerabilities) {
              reportLines.push('\n**Vulnerable packages:**\n');
              Object.entries(auditData.vulnerabilities).forEach(([pkg, info]) => {
                reportLines.push(`- **${pkg}**: ${info.via?.[0]?.title || 'Unknown'}\n`);
              });
            }
          } else {
            reportLines.push('✅ No vulnerabilities found\n');
          }
        }
      } catch (err) {
        reportLines.push(`⚠️ Could not run npm audit: ${err.message}\n`);
      }
    }

    // Check for outdated packages
    if (npmCheckUpdates) {
      reportLines.push('\n### 📈 Outdated Packages\n');
      try {
        const { stdout } = await execAsync('npm outdated --json 2>/dev/null || true', {
          maxBuffer: 10 * 1024 * 1024,
        });

        if (stdout && stdout.trim()) {
          const outdated = JSON.parse(stdout);
          outdatedCount = Object.keys(outdated).length;

          if (outdatedCount > 0) {
            hasOutdated = true;
            reportLines.push(`⚠️ **${outdatedCount} outdated packages**\n\n`);
            reportLines.push('| Package | Current | Latest |\n');
            reportLines.push('|---------|---------|--------|\n');

            Object.entries(outdated).forEach(([pkg, info]) => {
              reportLines.push(
                `| ${pkg} | ${info.current} | ${info.latest} |\n`
              );
            });
          } else {
            reportLines.push('✅ All packages up to date\n');
          }
        } else {
          reportLines.push('✅ All packages up to date\n');
        }
      } catch (err) {
        reportLines.push(`⚠️ Could not check outdated packages: ${err.message}\n`);
      }
    }

    // Set outputs
    core.setOutput('vulnerabilities-found', hasVulnerabilities.toString());
    core.setOutput('outdated-found', hasOutdated.toString());
    core.setOutput('vulnerability-count', vulnerabilityCount.toString());
    core.setOutput('outdated-count', outdatedCount.toString());

    // Post comment to PR if applicable
    const prNumber = process.env.PR_NUMBER;
    if (prNumber && github.context.payload.pull_request) {
      const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
      await octokit.rest.issues.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: parseInt(prNumber),
        body: reportLines.join(''),
      });
    }

    // Log report to console
    console.log(reportLines.join(''));

    // Fail if conditions met
    if (failOnVulnerabilities && hasVulnerabilities) {
      core.setFailed(`Found ${vulnerabilityCount} vulnerabilities`);
    }
    if (failOnOutdated && hasOutdated) {
      core.setFailed(`Found ${outdatedCount} outdated packages`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
