const core = require('@actions/core');
const exec = require('@actions/exec');
const github = require('@actions/github');
const fs = require('fs');

async function run() {
  try {
    const checkNpmAudit = core.getInput('check-npm-audit') === 'true';
    const checkOutdated = core.getInput('check-outdated') === 'true';
    const failOnHigh = core.getInput('fail-on-high') === 'true';
    const failOnOutdated = core.getInput('fail-on-outdated') === 'true';
    const commentPr = core.getInput('comment-pr') === 'true';

    let auditOutput = '';
    let outdatedOutput = '';
    let auditFound = 0;
    let outdatedCount = 0;
    let shouldFail = false;

    // Run npm audit
    if (checkNpmAudit) {
      core.info('🔍 Running npm audit...');
      try {
        await exec.exec('npm', ['audit', '--json'], {
          ignoreReturnCode: true,
          listeners: {
            stdout: (data) => { auditOutput += data.toString(); }
          }
        });
        
        try {
          const auditData = JSON.parse(auditOutput);
          const vulnerabilities = auditData.metadata?.vulnerabilities || {};
          auditFound = (vulnerabilities.critical || 0) + (vulnerabilities.high || 0);
          
          core.setOutput('audit-found', auditFound);
          core.info(`✅ Audit complete: ${auditFound} high/critical vulnerabilities found`);
          
          if (auditFound > 0 && failOnHigh) {
            shouldFail = true;
            core.warning(`🚨 High/critical vulnerabilities detected!`);
          }
        } catch (e) {
          core.warning(`Could not parse npm audit JSON: ${e.message}`);
        }
      } catch (e) {
        core.warning(`npm audit failed: ${e.message}`);
      }
    }

    // Check outdated packages
    if (checkOutdated) {
      core.info('📦 Checking for outdated packages...');
      try {
        await exec.exec('npm', ['outdated', '--json'], {
          ignoreReturnCode: true,
          listeners: {
            stdout: (data) => { outdatedOutput += data.toString(); }
          }
        });
        
        try {
          const outdatedData = JSON.parse(outdatedOutput);
          outdatedCount = Object.keys(outdatedData).length;
          
          core.setOutput('outdated-count', outdatedCount);
          core.info(`✅ Outdated check complete: ${outdatedCount} packages can be updated`);
          
          if (outdatedCount > 0 && failOnOutdated) {
            shouldFail = true;
            core.warning(`⚠️ ${outdatedCount} outdated packages detected`);
          }
        } catch (e) {
          core.warning(`Could not parse npm outdated JSON: ${e.message}`);
        }
      } catch (e) {
        core.warning(`npm outdated check failed: ${e.message}`);
      }
    }

    // Post PR comment if enabled
    if (commentPr && github.context.eventName === 'pull_request') {
      const token = core.getInput('token') || process.env.GITHUB_TOKEN;
      if (token) {
        const octokit = github.getOctokit(token);
        const pr = github.context.payload.pull_request;
        
        let comment = `## 🔐 Dependency Check Results\n\n`;
        if (checkNpmAudit) {
          comment += `- **Vulnerabilities**: ${auditFound === 0 ? '✅ None' : `🚨 ${auditFound} high/critical`}\n`;
        }
        if (checkOutdated) {
          comment += `- **Outdated Packages**: ${outdatedCount === 0 ? '✅ None' : `⚠️ ${outdatedCount} packages`}\n`;
        }
        
        try {
          await octokit.rest.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: pr.number,
            body: comment
          });
          core.info('✅ PR comment posted');
        } catch (e) {
          core.warning(`Failed to post PR comment: ${e.message}`);
        }
      }
    }

    if (shouldFail) {
      core.setFailed('Dependency checks failed');
    } else {
      core.info('✅ All dependency checks passed');
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
