import { test, expect } from '@playwright/test';
import { ACCESS_GATED_PAGES, fullUrl, INTERNAL_PAGES } from './helpers/pages';

/**
 * Authentication & access-control audit.
 *
 * Two halves:
 *
 * 1. Unauthorized access — anonymous browser context tries to load every gated
 *    internal page. Each page MUST either redirect to a login route, return a
 *    401/403, or render a login screen. Anything else (e.g. internal data
 *    rendered to anonymous users) is a CRITICAL access issue.
 *
 * 2. Authenticated flow (skipped unless VIVA_*_USER / VIVA_*_PASS env vars
 *    are set). Attempts login on /login (public) and /internal/login (staff),
 *    verifies role-based dashboard, and checks no redirect loops.
 */

test.describe('Access control — anonymous', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const pageDef of ACCESS_GATED_PAGES) {
    test(`${pageDef.path} blocks anonymous access`, async ({ page }, testInfo) => {
      const url = fullUrl(pageDef.path);
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
      const finalUrl = page.url();
      const status = resp?.status() ?? 0;

      const redirectedToLogin = /login/i.test(finalUrl) && finalUrl !== url;
      const blocked = status === 401 || status === 403;
      const showsLoginForm = (await page.locator('input[type="password"]').count()) > 0;

      // Detect "renders authenticated content" — page kept its requested URL
      // AND shows substantial body content AND no password prompt is anywhere
      // on screen. A 307 that lands back on the gated route without a login
      // prompt is the concrete failure mode.
      const renderedContent = await page.evaluate(() => (document.body?.innerText || '').trim().length);
      const stayedOnGatedRoute = finalUrl.replace(/\/$/, '') === url.replace(/\/$/, '');

      const allowed =
        !redirectedToLogin &&
        !blocked &&
        !showsLoginForm &&
        stayedOnGatedRoute &&
        renderedContent > 50;

      await testInfo.attach('access-check', {
        body: JSON.stringify(
          {
            requested: url,
            final: finalUrl,
            status,
            redirectedToLogin,
            blocked,
            showsLoginForm,
            stayedOnGatedRoute,
            renderedContentChars: renderedContent,
            allowed,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });

      expect
        .soft(
          allowed,
          `Anonymous user reached ${pageDef.path} without auth — final=${finalUrl} status=${status} bodyChars=${renderedContent}`,
        )
        .toBe(false);
    });
  }
});

/**
 * Authenticated flows. Provide creds via env:
 *   VIVA_PUBLIC_USER, VIVA_PUBLIC_PASS  → tested at /login
 *   VIVA_INTERNAL_USER, VIVA_INTERNAL_PASS → tested at /internal/login
 *   VIVA_INTERNAL_DASHBOARD → expected post-login URL substring (default /dashboard)
 */
test.describe('Authenticated flows', () => {
  const flows = [
    {
      label: 'Public student login',
      loginPath: '/login',
      user: process.env.VIVA_PUBLIC_USER,
      pass: process.env.VIVA_PUBLIC_PASS,
      expectAfterLogin: process.env.VIVA_PUBLIC_DASHBOARD || '/student',
    },
    {
      label: 'Internal staff login',
      loginPath: '/internal/login',
      user: process.env.VIVA_INTERNAL_USER,
      pass: process.env.VIVA_INTERNAL_PASS,
      expectAfterLogin: process.env.VIVA_INTERNAL_DASHBOARD || '/dashboard',
    },
  ];

  for (const flow of flows) {
    test(flow.label, async ({ page }, testInfo) => {
      test.skip(!flow.user || !flow.pass, `${flow.label}: credentials not configured`);

      await page.goto(fullUrl(flow.loginPath), { waitUntil: 'domcontentloaded' });

      const userField = page.locator('input[type="email"], input[name*="user" i], input[name*="email" i]').first();
      const passField = page.locator('input[type="password"]').first();
      await userField.fill(flow.user!);
      await passField.fill(flow.pass!);

      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.locator('button[type="submit"], input[type="submit"]').first().click(),
      ]);

      const finalUrl = page.url();
      await testInfo.attach('post-login', {
        body: JSON.stringify({ finalUrl, expectedSubstring: flow.expectAfterLogin }, null, 2),
        contentType: 'application/json',
      });

      expect.soft(finalUrl).toContain(flow.expectAfterLogin);

      // Redirect-loop sentinel: navigate again and ensure stays put.
      await page.goto(fullUrl(flow.expectAfterLogin), { waitUntil: 'domcontentloaded' });
      expect.soft(page.url()).toContain(flow.expectAfterLogin);

      // Session persistence: open the same page in a new tab from same context.
      const tab2 = await page.context().newPage();
      await tab2.goto(fullUrl(flow.expectAfterLogin), { waitUntil: 'domcontentloaded' });
      const stillAuthed = !/login/i.test(tab2.url());
      expect.soft(stillAuthed, 'Session not persisted across tabs').toBe(true);
      await tab2.close();
    });
  }
});

/**
 * Sanity: the public login pages themselves must render correctly.
 */
test.describe('Login pages render', () => {
  for (const pageDef of INTERNAL_PAGES.filter((p) => p.path.endsWith('login'))) {
    test(`${pageDef.path} loads + has password field`, async ({ page }) => {
      await page.goto(fullUrl(pageDef.path), { waitUntil: 'domcontentloaded' });
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });
  }
});
