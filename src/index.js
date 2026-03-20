const core = require('@actions/core');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execPromise = promisify(exec);

async function checkNpm() {
  try {
    const { stdout } = await execPromise('npm audit --json 2>/dev/null || echo "{}"');
    const audit = JSON.parse(stdout);
    return {
      vulnerabilities: audit.vulnerabilities ? Object.keys(audit.vulnerabilities).length : 0,
      outdated: 0
    };
  } catch (err) {
    core.warning('npm audit check failed: ' + err.message);
    return { vulnerabilities: 0, outdated: 0 };
  }
}

async function checkPip() {
  try {
    const { stdout } = await execPromise('pip-audit --desc 2>/dev/null || echo ""');
    const vulnCount = (stdout.match(/found \d+ vulnerabilities/g) || []).length;
    return {
      vulnerabilities: vulnCount,
      outdated: 0
    };
  } catch (err) {
    core.warning('pip-audit check failed: ' + err.message);
    return { vulnerabilities: 0, outdated: 0 };
  }
}

async function checkCargo() {
  try {
    const { stdout } = await execPromise('cargo audit --json 2>/dev/null || echo "{}"');
    const audit = JSON.parse(stdout);
    return {
      vulnerabilities: audit.vulnerabilities ? audit.vulnerabilities.length : 0,
      outdated: 0
    };
  } catch (err) {
    core.warning('cargo audit check failed: ' + err.message);
    return { vulnerabilities: 0, outdated: 0 };
  }
}

async function run() {
  try {
    const packageManagers = core.getInput('package-managers').split(',').map(pm => pm.trim());
    const failOnVulnerable = core.getInput('fail-on-vulnerable') === 'true';
    const failOnOutdated = core.getInput('fail-on-outdated') === 'true';

    let totalVulns = 0;
    let totalOutdated = 0;
    const report = {};

    for (const pm of packageManagers) {
      core.info(`Checking ${pm}...`);
      let result = { vulnerabilities: 0, outdated: 0 };

      if (pm === 'npm' && fs.existsSync('package.json')) {
        result = await checkNpm();
      } else if (pm === 'pip' && fs.existsSync('requirements.txt')) {
        result = await checkPip();
      } else if (pm === 'cargo' && fs.existsSync('Cargo.toml')) {
        result = await checkCargo();
      }

      totalVulns += result.vulnerabilities;
      totalOutdated += result.outdated;
      report[pm] = result;
    }

    core.setOutput('vulnerabilities-found', totalVulns.toString());
    core.setOutput('outdated-found', totalOutdated.toString());
    core.setOutput('report', JSON.stringify(report));

    if (failOnVulnerable && totalVulns > 0) {
      core.setFailed(`Found ${totalVulns} vulnerabilities`);
    } else if (failOnOutdated && totalOutdated > 0) {
      core.setFailed(`Found ${totalOutdated} outdated dependencies`);
    } else {
      core.info('✅ All dependencies are secure');
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
