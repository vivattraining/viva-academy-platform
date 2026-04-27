#!/usr/bin/env node
/**
 * Lightweight standalone re-renderer for the markdown summary, in case you
 * want to regenerate it without re-running tests. Reads reports/summary.json
 * and reports/issue-log.json and rewrites reports/summary.md.
 *
 * Useful in CI to post the latest summary as a PR comment.
 */
const fs = require('fs');
const path = require('path');

const reportsDir = path.join(process.cwd(), 'reports');
const summaryPath = path.join(reportsDir, 'summary.json');
const issuesPath = path.join(reportsDir, 'issue-log.json');

if (!fs.existsSync(summaryPath) || !fs.existsSync(issuesPath)) {
  console.error('Missing reports/summary.json or reports/issue-log.json — run `npm test` first.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
const order = { critical: 0, major: 1, minor: 2 };

const lines = [
  '# Viva Career Academy — QA Audit',
  '',
  `_Generated ${summary.generatedAt}_`,
  '',
  '## Summary',
  '',
  `- **Pages tested:** ${summary.totalPages}`,
  `- **Audits run:** ${summary.totalAudits}`,
  `- **Tests failed:** ${summary.failedTests} / ${summary.totalTests}`,
  `- **Issues:** ${summary.issues.total} (Critical ${summary.issues.critical} · Major ${summary.issues.major} · Minor ${summary.issues.minor})`,
  '',
  '### Issues by type',
];
for (const [k, v] of Object.entries(summary.issues.byType || {})) lines.push(`- ${k}: ${v}`);
lines.push('', '### Slowest pages', '| Page | Device | Load (ms) | FCP (ms) |', '| --- | --- | ---: | ---: |');
for (const s of summary.slowest || []) lines.push(`| ${s.page} | ${s.device} | ${s.loadTimeMs} | ${s.fcp ?? '-'} |`);
lines.push('', '## Issue log', '');

if (!issues.length) {
  lines.push('_No issues detected._');
} else {
  lines.push('| Severity | Type | Page | Device | Description |', '| --- | --- | --- | --- | --- |');
  for (const i of [...issues].sort((a, b) => order[a.severity] - order[b.severity])) {
    lines.push(
      `| ${i.severity.toUpperCase()} | ${i.type} | ${i.page} | ${i.device} | ${String(i.description).replace(/\|/g, '\\|').slice(0, 240)} |`,
    );
  }
}

const out = path.join(reportsDir, 'summary.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(`Wrote ${out}`);
