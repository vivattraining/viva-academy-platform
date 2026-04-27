import { test, expect } from '@playwright/test';
import { ALL_PAGES, fullUrl, PageDef } from './helpers/pages';
import { auditPage, auditLinks, auditOverlap } from './helpers/audit';

/**
 * Page-by-page audit. One test per (page × device) — Playwright runs both
 * device projects, so each page produces 2 tests.
 *
 * Each test:
 *   1. Loads the page and runs the full auditPage() pipeline
 *      (status, console, blank-screen, loader, perf, FCP, screenshot).
 *   2. Runs an overlap heuristic and flags as an issue if many overlaps detected.
 *   3. Crawls visible same-origin links via HEAD to catch dead links.
 *
 * To skip link crawling on internal/auth-redirect pages, set VIVA_SKIP_LINKS=1.
 */

for (const pageDef of ALL_PAGES) {
  test.describe(`${pageDef.name} (${pageDef.path})`, () => {
    test('audits page load, UI, console, performance', async ({ page }, testInfo) => {
      const url = fullUrl(pageDef.path);

      // Internal pages may redirect to login when anonymous — that's OK for status.
      const expectOk = true;

      const result = await auditPage(page, testInfo, {
        pageName: pageDef.name,
        url,
        readyLocator: pageDef.readyLocator,
        expectOk,
      });

      // Report-style soft assertions — collect failures rather than aborting.
      expect.soft(
        result.issues.filter((i) => i.severity === 'critical'),
        `Critical issues on ${pageDef.name}`,
      ).toEqual([]);

      // Heuristic overlap pass.
      const { overlaps } = await auditOverlap(page);
      if (overlaps > 5) {
        await testInfo.attach('overlap-warning', {
          contentType: 'text/plain',
          body: Buffer.from(`Detected ${overlaps} overlapping element pairs.`),
        });
      }

      // Link crawl (skippable).
      if (!process.env.VIVA_SKIP_LINKS) {
        const linkIssues = await auditLinks(page, pageDef.name, testInfo.project.name);
        for (const issue of linkIssues) {
          await testInfo.attach(`link-issue-${linkIssues.indexOf(issue)}`, {
            body: JSON.stringify(issue, null, 2),
            contentType: 'application/json',
          });
        }
        // Dead links are major — fail soft, surface in report.
        expect.soft(
          linkIssues.filter((i) => i.severity === 'critical'),
          `Critical link issues on ${pageDef.name}`,
        ).toEqual([]);
      }
    });
  });
}
