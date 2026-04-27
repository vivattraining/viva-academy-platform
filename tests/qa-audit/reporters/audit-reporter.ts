import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Aggregates per-test audit-result.json artefacts (written by helpers/audit.ts)
 * into:
 *   - reports/issue-log.json
 *   - reports/console-errors.json
 *   - reports/summary.json   (counts by severity / type / device)
 *
 * Also writes reports/summary.md — a markdown dashboard suitable for posting
 * as a CI comment or pasting into Slack.
 */

interface Issue {
  page: string;
  url: string;
  device: string;
  type: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  screenshot?: string;
}

interface AuditResult {
  page: string;
  url: string;
  device: string;
  status: number | null;
  loadTimeMs: number;
  domContentLoadedMs: number | null;
  firstContentfulPaintMs: number | null;
  consoleErrors: Array<{ type: string; text: string }>;
  pageErrors: string[];
  failedRequests: Array<{ url: string; failure: string }>;
  fullPageScreenshot: string;
  issues: Issue[];
}

class AuditReporter implements Reporter {
  private results: AuditResult[] = [];
  private testCount = 0;
  private failed = 0;

  onTestEnd(test: TestCase, result: TestResult) {
    this.testCount++;
    if (result.status === 'failed' || result.status === 'timedOut') this.failed++;

    for (const att of result.attachments) {
      if (att.name === 'audit-result' && att.body) {
        try {
          this.results.push(JSON.parse(att.body.toString()));
        } catch {
          /* ignore malformed */
        }
      }
    }
  }

  async onEnd(_full: FullResult) {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    // Pull anything left on disk in case attachments were lost.
    const artifactDir = path.join(reportsDir, 'artifacts');
    if (fs.existsSync(artifactDir)) {
      for (const f of fs.readdirSync(artifactDir)) {
        if (!f.endsWith('.json')) continue;
        if (f === 'connectors.json') continue;
        const full = path.join(artifactDir, f);
        try {
          const data = JSON.parse(fs.readFileSync(full, 'utf8'));
          if (data && data.url && data.page && data.device && Array.isArray(data.issues)) {
            const exists = this.results.some(
              (r) => r.page === data.page && r.device === data.device && r.url === data.url,
            );
            if (!exists) this.results.push(data);
          }
        } catch {
          /* skip */
        }
      }
    }

    // Issue log + console errors.
    const issues: Issue[] = this.results.flatMap((r) => r.issues);
    fs.writeFileSync(path.join(reportsDir, 'issue-log.json'), JSON.stringify(issues, null, 2));

    const consoleByPage: Record<string, AuditResult['consoleErrors']> = {};
    for (const r of this.results) {
      const key = `${r.page} (${r.device})`;
      consoleByPage[key] = [...(consoleByPage[key] || []), ...r.consoleErrors];
    }
    fs.writeFileSync(
      path.join(reportsDir, 'console-errors.json'),
      JSON.stringify(consoleByPage, null, 2),
    );

    // Summary counts.
    const bySeverity = { critical: 0, major: 0, minor: 0 };
    const byType: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    for (const i of issues) {
      bySeverity[i.severity]++;
      byType[i.type] = (byType[i.type] || 0) + 1;
      byDevice[i.device] = (byDevice[i.device] || 0) + 1;
    }

    const pages = new Set(this.results.map((r) => r.page));
    const summary = {
      generatedAt: new Date().toISOString(),
      totalTests: this.testCount,
      failedTests: this.failed,
      totalPages: pages.size,
      totalAudits: this.results.length,
      issues: { total: issues.length, ...bySeverity, byType, byDevice },
      slowest: [...this.results]
        .sort((a, b) => b.loadTimeMs - a.loadTimeMs)
        .slice(0, 5)
        .map((r) => ({
          page: r.page,
          device: r.device,
          loadTimeMs: r.loadTimeMs,
          fcp: r.firstContentfulPaintMs,
        })),
    };
    fs.writeFileSync(path.join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2));

    // Markdown dashboard.
    const md = renderMarkdown(summary, issues);
    fs.writeFileSync(path.join(reportsDir, 'summary.md'), md);

    // Console banner so CI logs surface the headline numbers.
    /* eslint-disable no-console */
    console.log('\n========== QA AUDIT SUMMARY ==========');
    console.log(`Pages tested:   ${summary.totalPages}`);
    console.log(`Total audits:   ${summary.totalAudits}`);
    console.log(`Issues found:   ${summary.issues.total}`);
    console.log(`  Critical:     ${summary.issues.critical}`);
    console.log(`  Major:        ${summary.issues.major}`);
    console.log(`  Minor:        ${summary.issues.minor}`);
    console.log(`Reports:        reports/summary.md, reports/issue-log.json`);
    console.log('======================================\n');
    /* eslint-enable no-console */

    // Non-zero exit is handled by Playwright if any tests failed; for releases
    // we additionally want to fail when critical issues are present even if
    // tests soft-asserted. Let the prerelease script enforce that.
    if (process.env.VIVA_FAIL_ON_CRITICAL && summary.issues.critical > 0) {
      // eslint-disable-next-line no-console
      console.error(`Critical issues present: ${summary.issues.critical}`);
      process.exitCode = 1;
    }
  }
}

function renderMarkdown(summary: any, issues: Issue[]): string {
  const lines: string[] = [];
  lines.push('# Viva Career Academy — QA Audit');
  lines.push('');
  lines.push(`_Generated ${summary.generatedAt}_`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Pages tested:** ${summary.totalPages}`);
  lines.push(`- **Audits run:** ${summary.totalAudits} (across desktop + mobile)`);
  lines.push(`- **Tests failed:** ${summary.failedTests} / ${summary.totalTests}`);
  lines.push(`- **Issues:** ${summary.issues.total} (Critical ${summary.issues.critical} · Major ${summary.issues.major} · Minor ${summary.issues.minor})`);
  lines.push('');
  lines.push('### Issues by type');
  for (const [k, v] of Object.entries(summary.issues.byType)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('### Slowest pages');
  lines.push('| Page | Device | Load (ms) | FCP (ms) |');
  lines.push('| --- | --- | ---: | ---: |');
  for (const s of summary.slowest) {
    lines.push(`| ${s.page} | ${s.device} | ${s.loadTimeMs} | ${s.fcp ?? '-'} |`);
  }
  lines.push('');
  lines.push('## Issue log');
  lines.push('');
  if (issues.length === 0) {
    lines.push('_No issues detected._');
  } else {
    lines.push('| Severity | Type | Page | Device | Description |');
    lines.push('| --- | --- | --- | --- | --- |');
    const order = { critical: 0, major: 1, minor: 2 } as const;
    for (const i of [...issues].sort((a, b) => order[a.severity] - order[b.severity])) {
      lines.push(
        `| ${i.severity.toUpperCase()} | ${i.type} | ${i.page} | ${i.device} | ${i.description.replace(/\|/g, '\\|').slice(0, 240)} |`,
      );
    }
  }
  lines.push('');
  lines.push('---');
  lines.push('Full Playwright HTML report: `reports/html/index.html`');
  return lines.join('\n');
}

export default AuditReporter;
