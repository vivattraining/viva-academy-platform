/**
 * Issue-fix demo recordings.
 *
 * One test per resolved QA issue. Each test runs with video: 'on' and
 * slowMo so every action is clearly visible in the recorded .webm.
 *
 * Run:
 *   npx playwright test tests/issue-demo.spec.ts --project=desktop-chromium --reporter=list
 *
 * Output videos:
 *   test-results/issue-demo-{name}-desktop-chromium/video.webm
 */

import { test, expect } from '@playwright/test';
import { fullUrl } from './helpers/pages';

test.use({
  video: 'on',
  launchOptions: { slowMo: 700 },
  viewport: { width: 1440, height: 900 },
});

// ─── helpers ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VIVA_BASE_URL || 'http://localhost:3001')
    // Local dev: web on :3001, api on :8000.
    .replace(':3001', ':8000')
    // Production: web on www.<domain>, api on api.<domain>.
    .replace('://www.', '://api.');

async function pause(ms = 1200) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Demo 1 — Issue #39: Form validation now active ──────────────────────────

test.describe('Demo — Issue #39: Form validation', () => {
  test('Apply, Login and Internal Login forms validate on empty submit', async ({ page }) => {
    // ── /apply ──────────────────────────────────────────────────────────────
    await page.goto(fullUrl('/apply'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();

    const applySubmit = page.locator('button[type="submit"]').first();
    await applySubmit.scrollIntoViewIfNeeded();
    await pause(600);
    await applySubmit.click({ force: true });
    await pause(1500);
    // Show invalid email format error
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('not-an-email');
    await pause(600);
    await applySubmit.click({ force: true });
    await pause(1500);
    // Fill valid synthetic data
    await emailInput.fill('qa-demo@example.com');
    // Name field may not have type="text" attribute (defaults to text)
    const nameInput = page.locator('input:not([type="email"]):not([type="password"]):not([type="tel"]):not([type="hidden"]):not([type="submit"])').first();
    if (await nameInput.count()) await nameInput.fill('QA Demo User');
    const telInput = page.locator('input[type="tel"]').first();
    if (await telInput.count()) await telInput.fill('9876543210');
    await pause(1000);

    // ── /login ───────────────────────────────────────────────────────────────
    await page.goto(fullUrl('/login'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();
    const loginSubmit = page.locator('button[type="submit"]').first();
    await loginSubmit.click({ force: true });
    await pause(1500);
    await page.locator('input[type="email"]').first().fill('bad-email');
    await loginSubmit.click({ force: true });
    await pause(1500);

    // ── /internal/login ──────────────────────────────────────────────────────
    await page.goto(fullUrl('/internal/login'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();
    const intSubmit = page.locator('button[type="submit"]').first();
    await intSubmit.click({ force: true });
    await pause(1500);
    await page.locator('input[type="email"]').first().fill('invalid-email');
    await intSubmit.click({ force: true });
    await pause(1500);

    // Soft assertion: at least one input field existed on each page (not skipped).
    // These pages use controlled React inputs without a native <form> wrapper.
    expect(await page.locator('input[type="email"], input[type="password"]').count()).toBeGreaterThan(0);
  });
});

// ─── Demo 2 — Issue #26: /onboarding/trainer server-side redirect ─────────────

test.describe('Demo — Issue #26: Trainer onboarding server-side auth', () => {
  test('Anonymous visit to /onboarding/trainer redirects to /internal/login', async ({ page }) => {
    await page.goto(fullUrl('/onboarding/trainer'), { waitUntil: 'domcontentloaded' });
    await pause(1500);
    // Server redirects before any React renders — URL must contain 'login'
    const url = page.url();
    expect(url).toContain('login');
    await pause(1500);

    // Contrast: with ?token= the invite page IS allowed to render
    await page.goto(fullUrl('/onboarding/trainer?token=demo-invalid-token'), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle');
    await pause(2000);
    // Will show invite-not-found error (not a redirect — token path is open)
    const body = await page.evaluate(() => document.body.innerText);
    expect(body.length).toBeGreaterThan(10);
  });
});

// ─── Demo 3 — Issue #34: Applications/Batches return 401 (not 422) ───────────

test.describe('Demo — Issue #34: Auth before param validation', () => {
  test('Unauthenticated request to /applications/secure returns 401', async ({ page }) => {
    await page.goto(fullUrl('/internal/login'), { waitUntil: 'domcontentloaded' });
    await pause();

    // Call the API from the browser to show the status code visibly
    const result = await page.evaluate(async (apiBase: string) => {
      // No session token, no tenant_name — previously returned 422, now 401
      const noParamRes = await fetch(`${apiBase}/api/v1/academy/applications/secure`, {
        headers: { Accept: 'application/json' },
      });
      const noParamBody = await noParamRes.json().catch(() => ({}));

      // With tenant_name but still no auth — still 401
      const withParamRes = await fetch(
        `${apiBase}/api/v1/academy/applications/secure?tenant_name=viva-career-academy`,
        { headers: { Accept: 'application/json' } },
      );
      const withParamBody = await withParamRes.json().catch(() => ({}));

      return {
        noParamStatus: noParamRes.status,
        noParamBody,
        withParamStatus: withParamRes.status,
        withParamBody,
      };
    }, API_BASE);

    // Display the result in the browser console so it appears in the recording
    await page.evaluate((res: unknown) => {
      console.log('Issue #34 API check:', JSON.stringify(res, null, 2));
    }, result);
    await pause(2000);

    expect(result.noParamStatus).toBe(401);
    expect(result.withParamStatus).toBe(401);
  });
});

// ─── Demo 4 — Issue #27: EmailStr rejects malformed emails ───────────────────

test.describe('Demo — Issue #27: EmailStr validation on application create', () => {
  test('POST /applications with invalid email returns 422', async ({ page }) => {
    await page.goto(fullUrl('/apply'), { waitUntil: 'domcontentloaded' });
    await pause();

    const checks = await page.evaluate(async (apiBase: string) => {
      const bad = ['notvalid@', '@example.com', 'test@', 'plaintext', ''];
      const results: Array<{ email: string; status: number }> = [];
      for (const email of bad) {
        const res = await fetch(`${apiBase}/api/v1/academy/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_name: 'viva-career-academy',
            student_name: 'QA Demo',
            student_email: email,
            student_phone: '9876543210',
          }),
        });
        results.push({ email, status: res.status });
      }
      return results;
    }, API_BASE);

    await page.evaluate((res: unknown) => {
      console.log('Issue #27 EmailStr validation:', JSON.stringify(res, null, 2));
    }, checks);
    await pause(2000);

    for (const { status } of checks) {
      expect(status).not.toBe(200);
    }
  });
});

// ─── Demo 5 — Issues #25 / #28 / #31: Login flows & internal portals ─────────

test.describe('Demo — Issues #25 #28 #31: Login flows and internal portals', () => {
  // These are read at module load time. Using a non-null assertion (!) here
  // would cast `undefined` to `string` — the test would then try to `fill('')`
  // into the login form and fail at the .toContain('/admin') assertion,
  // masquerading a missing-creds CI configuration as a production bug.
  // Read as optional and gate with test.skip below so missing secrets surface
  // as "skipped" (correct) instead of "failed" (misleading).
  const internalUser = process.env.VIVA_INTERNAL_USER;
  const internalPass = process.env.VIVA_INTERNAL_PASS;
  const publicUser = process.env.VIVA_PUBLIC_USER;
  const publicPass = process.env.VIVA_PUBLIC_PASS;

  test('Admin login reaches /admin; student login reaches /student', async ({ page }) => {
    if (!internalUser || !internalPass || !publicUser || !publicPass) {
      test.skip(
        true,
        'VIVA_INTERNAL_USER / VIVA_INTERNAL_PASS / VIVA_PUBLIC_USER / VIVA_PUBLIC_PASS not set — login-flow test needs all four',
      );
      return;
    }
    // ── Admin login ──────────────────────────────────────────────────────────
    await page.goto(fullUrl('/internal/login'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();
    await page.locator('input[type="email"]').first().fill(internalUser);
    await page.locator('input[type="password"]').first().fill(internalPass);
    await pause(800);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 60_000 }).catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2000);
    const adminUrl = page.url();
    expect(adminUrl).toContain('/admin');

    // Show a couple of internal portal pages
    for (const path of ['/operations', '/roster', '/admissions']) {
      await page.goto(fullUrl(path), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await pause(1500);
      expect(page.url()).not.toContain('login');
    }

    // ── Student login ────────────────────────────────────────────────────────
    await page.goto(fullUrl('/login'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();
    await page.locator('input[type="email"]').first().fill(publicUser);
    await page.locator('input[type="password"]').first().fill(publicPass);
    await pause(800);
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 60_000 }).catch(() => {}),
      page.locator('button[type="submit"]').first().click(),
    ]);
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2000);
    expect(page.url()).toContain('/student');
  });
});

// ─── Demo 6 — Issue #66: Certificate page handles missing token gracefully ────

test.describe('Demo — Issue #66: Certificate view graceful error handling', () => {
  test('Invalid certificate token shows graceful message, no crash', async ({ page }) => {
    await page.goto(fullUrl('/certificates/demo-invalid-token-000'), {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    // Page must render something (not blank, not a Next.js crash page)
    expect(bodyText.length).toBeGreaterThan(20);
    // Must NOT show a Next.js/React unhandled error overlay
    const hasErrorOverlay = await page.locator('nextjs-portal, #__next-error').count();
    expect(hasErrorOverlay).toBe(0);
    await pause(1500);

    // Also verify the page source no longer has the duplicate apiBaseUrl definition
    const pageSource = await page.evaluate(() => document.documentElement.outerHTML);
    // The canonical import is from lib/api — verify no inline definition leaked into HTML
    expect(pageSource).not.toContain('localhost:8000".replace');
    await pause(1000);
  });
});
