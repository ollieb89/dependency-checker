const core = require('@actions/core');
const github = require('@actions/github');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function run() {
  try {
    const npmCheck = core.getInput('npm-check') === 'true';
    const severity = core.getInput('severity');
    const failOnOutdated = core.getInput('fail-on-outdated') === 'true';

    let vulnerabilities = [];
    let outdated = [];
    let report = {};

    // Check npm vulnerabilities
    if (npmCheck && fs.existsSync('package-lock.json')) {
      core.info('🔍 Scanning npm vulnerabilities...');
      try {
        const { stdout } = await execAsync('npm audit --json', { cwd: process.cwd() });
        const auditReport = JSON.parse(stdout);
        
        if (auditReport.vulnerabilities) {
          vulnerabilities = Object.entries(auditReport.vulnerabilities)
            .filter(([, v]) => shouldReportSeverity(v.severity, severity))
            .map(([name, v]) => ({
              package: name,
              severity: v.severity,
              vulnerableVersions: v.range,
              fixedIn: v.fixAvailable ? v.fixAvailable.inRange : 'N/A'
            }));
        }
        report.vulnerabilities = auditReport;
      } catch (e) {
        core.warning('npm audit failed or no vulnerabilities found');
      }

      // Check outdated packages
      core.info('📦 Scanning outdated packages...');
      try {
        const { stdout } = await execAsync('npm outdated --json', { cwd: process.cwd() });
        const outdatedReport = JSON.parse(stdout);
        outdated = Object.entries(outdatedReport).map(([name, versions]) => ({
          package: name,
          current: versions.current,
          wanted: versions.wanted,
          latest: versions.latest,
          type: versions.type
        }));
        report.outdated = outdatedReport;
      } catch (e) {
        core.warning('npm outdated check completed');
      }
    }

    // Output results
    core.setOutput('vulnerabilities-found', vulnerabilities.length);
    core.setOutput('outdated-found', outdated.length);
    core.setOutput('report', JSON.stringify(report, null, 2));

    // Generate summary
    let summary = `## 🔐 Dependency Check Report\n\n`;
    summary += `**Vulnerabilities:** ${vulnerabilities.length}\n`;
    summary += `**Outdated Packages:** ${outdated.length}\n\n`;

    if (vulnerabilities.length > 0) {
      summary += `### ⚠️ Vulnerabilities Found\n`;
      vulnerabilities.forEach(v => {
        summary += `- **${v.package}** (${v.severity}): ${v.vulnerableVersions}\n`;
      });
      summary += '\n';
    }

    if (outdated.length > 0) {
      summary += `### 📦 Outdated Packages\n`;
      outdated.slice(0, 10).forEach(o => {
        summary += `- **${o.package}**: ${o.current} → ${o.latest}\n`;
      });
      if (outdated.length > 10) {
        summary += `- ... and ${outdated.length - 10} more\n`;
      }
    }

    core.summary.addRaw(summary);
    await core.summary.write();

    // Fail if conditions met
    if (failOnOutdated && outdated.length > 0) {
      core.setFailed(`Found ${outdated.length} outdated packages`);
    }
    if (vulnerabilities.length > 0 && severity !== 'low') {
      core.warning(`Found ${vulnerabilities.length} vulnerabilities`);
    }

    core.info('✅ Dependency check complete');
  } catch (error) {
    core.setFailed(error.message);
  }
}

function shouldReportSeverity(vulnSeverity, minSeverity) {
  const levels = { low: 0, moderate: 1, high: 2, critical: 3 };
  return levels[vulnSeverity] >= levels[minSeverity];
}

run();
