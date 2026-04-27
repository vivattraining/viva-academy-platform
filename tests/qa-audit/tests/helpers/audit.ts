import { Page, TestInfo, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reusable auditing primitives. Every spec wraps a navigation in `auditPage`
 * which:
 *   - attaches console / pageerror / requestfailed listeners
 *   - measures navigation timing
 *   - flags blank screens and infinite loaders
 *   - takes a full-page screenshot per device
 *   - returns an AuditResult that the custom reporter aggregates.
 */

export type Severity = 'critical' | 'major' | 'minor';
export type IssueType = 'UI' | 'Functional' | 'Performance' | 'Access' | 'Console';

export interface Issue {
  page: string;
  url: string;
  device: string;
  type: IssueType;
  severity: Severity;
  description: string;
  screenshot?: string;
  evidence?: Record<string, unknown>;
}

export interface AuditResult {
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

const PERF_BUDGET_MS = Number(process.env.VIVA_PERF_BUDGET_MS || 3000);

/** Where the audit reporter expects to find issue + console artefacts. */
const ARTIFACT_DIR = path.join(process.cwd(), 'reports', 'artifacts');

function ensureArtifactDir() {
  if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function safeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80);
}

export interface AuditOptions {
  /** Friendly page name (matches PageDef.name). */
  pageName: string;
  /** Full URL (or path) to navigate. */
  url: string;
  /** Optional locator that should be visible if the page rendered correctly. */
  readyLocator?: string;
  /** Whether to expect HTTP 200; set false for pages we expect to redirect/block. */
  expectOk?: boolean;
}

/**
 * Drive a single page-level audit. Use inside a Playwright `test()`.
 */
export async function auditPage(
  page: Page,
  testInfo: TestInfo,
  opts: AuditOptions,
): Promise<AuditResult> {
  ensureArtifactDir();

  const consoleErrors: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];
  const failedRequests: Array<{ url: string; failure: string }> = [];
  const issues: Issue[] = [];

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      consoleErrors.push({ type, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText ?? 'unknown';
    // Ignore aborted prefetches, beacons, analytics noise.
    if (/ERR_ABORTED|net::ERR_BLOCKED_BY_CLIENT/.test(failure)) return;
    failedRequests.push({ url: req.url(), failure });
  });

  const device = testInfo.project.name;
  const startedAt = Date.now();
  let status: number | null = null;

  try {
    const response = await page.goto(opts.url, { waitUntil: 'domcontentloaded' });
    status = response?.status() ?? null;
  } catch (err) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Functional',
      severity: 'critical',
      description: `Navigation threw: ${(err as Error).message}`,
    });
  }

  // Wait for network to settle (capped) — flag as a warning, not a failure.
  try {
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  } catch {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Performance',
      severity: 'minor',
      description: 'networkidle not reached within 15s — possible long-running requests.',
    });
  }

  const loadTimeMs = Date.now() - startedAt;

  // Performance via PerformanceTiming + paint entries.
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    const paint = performance.getEntriesByType('paint');
    const fcp = paint.find((p) => p.name === 'first-contentful-paint');
    return {
      domContentLoadedMs: nav ? nav.domContentLoadedEventEnd - nav.startTime : null,
      firstContentfulPaintMs: fcp ? fcp.startTime : null,
    };
  });

  // Status check.
  if (opts.expectOk !== false && status !== null && (status < 200 || status >= 400)) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Functional',
      severity: 'critical',
      description: `Non-OK HTTP status: ${status}`,
    });
  }

  // Blank screen detection: <body> has no visible text or no rendered children.
  const blank = await page.evaluate(() => {
    const body = document.body;
    if (!body) return true;
    const text = (body.innerText || '').trim();
    const hasMedia = body.querySelector('img, svg, canvas, video') !== null;
    return text.length < 5 && !hasMedia;
  });
  if (blank) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'UI',
      severity: 'critical',
      description: 'Blank screen — body has no visible text or media.',
    });
  }

  // Infinite loader detection: presence of common spinner classes after networkidle.
  const stillLoading = await page.evaluate(() => {
    const selectors = [
      '[role="progressbar"]',
      '.spinner',
      '.loading',
      '.loader',
      '[data-loading="true"]',
    ];
    return selectors.some((sel) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
    });
  });
  if (stillLoading) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'UI',
      severity: 'major',
      description: 'Loader/spinner still visible after networkidle — possible infinite loader.',
    });
  }

  // Optional ready-locator check.
  if (opts.readyLocator) {
    try {
      await expect(page.locator(opts.readyLocator).first()).toBeVisible({ timeout: 5_000 });
    } catch {
      issues.push({
        page: opts.pageName,
        url: opts.url,
        device,
        type: 'UI',
        severity: 'major',
        description: `Expected ready locator not visible: ${opts.readyLocator}`,
      });
    }
  }

  // Performance budget.
  if (loadTimeMs > PERF_BUDGET_MS) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Performance',
      severity: loadTimeMs > PERF_BUDGET_MS * 2 ? 'major' : 'minor',
      description: `Page load exceeded ${PERF_BUDGET_MS}ms budget: ${loadTimeMs}ms`,
      evidence: { loadTimeMs, ...perf },
    });
  }

  // Console errors → issues (warnings counted as minor).
  for (const ce of consoleErrors) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Console',
      severity: ce.type === 'error' ? 'major' : 'minor',
      description: `[${ce.type}] ${ce.text}`,
    });
  }
  for (const pe of pageErrors) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Console',
      severity: 'critical',
      description: `Uncaught: ${pe}`,
    });
  }
  for (const fr of failedRequests) {
    issues.push({
      page: opts.pageName,
      url: opts.url,
      device,
      type: 'Functional',
      severity: 'major',
      description: `Failed request (${fr.failure}): ${fr.url}`,
    });
  }

  // Full-page screenshot.
  const shotName = `${safeFilename(opts.pageName)}__${device}.png`;
  const shotPath = path.join(ARTIFACT_DIR, shotName);
  await page.screenshot({ path: shotPath, fullPage: true });
  await testInfo.attach(`screenshot-${device}`, { path: shotPath, contentType: 'image/png' });

  const result: AuditResult = {
    page: opts.pageName,
    url: opts.url,
    device,
    status,
    loadTimeMs,
    domContentLoadedMs: perf.domContentLoadedMs,
    firstContentfulPaintMs: perf.firstContentfulPaintMs,
    consoleErrors,
    pageErrors,
    failedRequests,
    fullPageScreenshot: path.relative(process.cwd(), shotPath),
    issues,
  };

  // Persist per-test JSON; the custom reporter aggregates these.
  const jsonName = `${safeFilename(opts.pageName)}__${device}.json`;
  fs.writeFileSync(path.join(ARTIFACT_DIR, jsonName), JSON.stringify(result, null, 2));
  await testInfo.attach('audit-result', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  });

  return result;
}

/**
 * Click every visible <a> with a same-origin href, verify each resolves to a 2xx/3xx
 * via HEAD request. Returns issues (does not throw).
 */
export async function auditLinks(page: Page, pageName: string, device: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const origin = new URL(page.url()).origin;

  const hrefs: string[] = await page.$$eval('a[href]', (anchors, originArg) => {
    const out = new Set<string>();
    for (const a of anchors as HTMLAnchorElement[]) {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      try {
        const url = new URL(href, location.href);
        if (url.origin === originArg) out.add(url.toString());
      } catch {
        /* ignore */
      }
    }
    return [...out];
  }, origin);

  for (const href of hrefs.slice(0, 50)) {
    try {
      const resp = await page.request.fetch(href, { method: 'HEAD', failOnStatusCode: false });
      const status = resp.status();
      if (status >= 400) {
        issues.push({
          page: pageName,
          url: page.url(),
          device,
          type: 'Functional',
          severity: status >= 500 ? 'critical' : 'major',
          description: `Dead link (${status}): ${href}`,
        });
      }
    } catch (err) {
      issues.push({
        page: pageName,
        url: page.url(),
        device,
        type: 'Functional',
        severity: 'major',
        description: `Link request failed (${(err as Error).message}): ${href}`,
      });
    }
  }
  return issues;
}

/**
 * Visit a few global states the page should survive: refresh-mid-load,
 * back/forward.
 */
export async function auditBrokenStates(page: Page, url: string, pageName: string, device: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Refresh while DOM is mid-paint.
    const refresh = page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    await refresh;
    // Back/forward
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.goForward({ waitUntil: 'domcontentloaded' });
  } catch (err) {
    issues.push({
      page: pageName,
      url,
      device,
      type: 'Functional',
      severity: 'major',
      description: `Broken-state navigation failed: ${(err as Error).message}`,
    });
  }
  return issues;
}

/**
 * Detect overlapping bounding boxes among a sample of visible elements.
 * Heuristic only — flags pairs whose rectangles intersect by more than 50% of the smaller box.
 */
export async function auditOverlap(page: Page): Promise<{ overlaps: number }> {
  return page.evaluate(() => {
    const sample = Array.from(document.querySelectorAll('button, a, h1, h2, h3, input, label')) as HTMLElement[];
    let overlaps = 0;
    const rects = sample
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => rect.width > 0 && rect.height > 0);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i].rect;
        const b = rects[j].rect;
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const inter = x * y;
        const min = Math.min(a.width * a.height, b.width * b.height);
        if (min > 0 && inter / min > 0.5 && rects[i].el !== rects[j].el && !rects[i].el.contains(rects[j].el) && !rects[j].el.contains(rects[i].el)) {
          overlaps++;
        }
      }
    }
    return { overlaps };
  });
}
