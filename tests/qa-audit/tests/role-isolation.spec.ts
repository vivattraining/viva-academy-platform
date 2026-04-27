import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { fullUrl, INTERNAL_PAGES } from './helpers/pages';

/**
 * Role-isolation contract — codifies the access rules:
 *
 *   1. Anonymous → no /student, no internal routes (covered in auth.spec.ts).
 *   2. Authenticated student WITHOUT payment → cannot reach /student.
 *   3. Paid student → can reach only their subscribed course; cannot reach
 *      /admin, /trainer, /admissions, /operations, /roster, /messages,
 *      /white-label, /dashboard.
 *
 * Credentials & course-id come from env vars. All four scenarios skip cleanly
 * when their creds aren't configured, so this spec is safe to ship before the
 * fix lands. Once creds are wired into CI as repo secrets, the suite enforces
 * the contract on every run.
 *
 *   VIVA_UNPAID_USER         + VIVA_UNPAID_PASS
 *   VIVA_PAID_USER           + VIVA_PAID_PASS
 *   VIVA_PAID_COURSE_PATH    e.g. "/student/course/abc-123" (the URL the
 *                            paid student SHOULD see)
 *   VIVA_PAID_FORBIDDEN_COURSE_PATH  optional, a course they did NOT pay for
 *                                    — used to verify cross-course isolation
 */

const STUDENT_FORBIDDEN_PATHS = INTERNAL_PAGES.filter((p) =>
  ['/admin', '/trainer', '/admissions', '/operations', '/roster', '/messages', '/white-label', '/dashboard'].includes(
    p.path,
  ),
).map((p) => p.path);

async function loginAt(page: Page, loginPath: string, user: string, pass: string) {
  await page.goto(fullUrl(loginPath), { waitUntil: 'domcontentloaded' });
  const userField = page.locator('input[type="email"], input[name*="user" i], input[name*="email" i]').first();
  const passField = page.locator('input[type="password"]').first();
  await userField.fill(user);
  await passField.fill(pass);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button[type="submit"], input[type="submit"]').first().click(),
  ]);
}

/** Decide whether the current page state means "this user could see this content". */
async function isAccessAllowed(page: Page): Promise<{ allowed: boolean; evidence: Record<string, unknown> }> {
  const url = page.url();
  const status = 'unknown';
  const onLogin = /login/i.test(url);
  const showsPasswordPrompt = (await page.locator('input[type="password"]').count()) > 0;
  const showsForbidden =
    (await page
      .locator('text=/forbidden|unauthori[sz]ed|access denied|not allowed|403/i')
      .count()) > 0;
  const bodyChars = await page.evaluate(() => (document.body?.innerText || '').trim().length);
  const allowed = !onLogin && !showsPasswordPrompt && !showsForbidden && bodyChars > 50;
  return { allowed, evidence: { url, status, onLogin, showsPasswordPrompt, showsForbidden, bodyChars } };
}

// ---------- 2. Unpaid student must NOT reach /student ----------

test.describe('Unpaid student isolation', () => {
  const user = process.env.VIVA_UNPAID_USER;
  const pass = process.env.VIVA_UNPAID_PASS;

  test('cannot reach /student before paying', async ({ browser }, testInfo) => {
    test.skip(!user || !pass, 'VIVA_UNPAID_USER / VIVA_UNPAID_PASS not configured');

    const context: BrowserContext = await browser.newContext();
    const page = await context.newPage();
    await loginAt(page, '/login', user!, pass!);

    await page.goto(fullUrl('/student'), { waitUntil: 'domcontentloaded' });
    const verdict = await isAccessAllowed(page);

    await testInfo.attach('unpaid-student-access', {
      body: JSON.stringify(verdict, null, 2),
      contentType: 'application/json',
    });

    expect
      .soft(verdict.allowed, `Unpaid student reached /student — ${JSON.stringify(verdict.evidence)}`)
      .toBe(false);

    await context.close();
  });
});

// ---------- 3. Paid student: own course YES, other sections NO ----------

test.describe('Paid student isolation', () => {
  const user = process.env.VIVA_PAID_USER;
  const pass = process.env.VIVA_PAID_PASS;
  const ownCourse = process.env.VIVA_PAID_COURSE_PATH;
  const forbiddenCourse = process.env.VIVA_PAID_FORBIDDEN_COURSE_PATH;

  test('can reach their subscribed course', async ({ browser }, testInfo) => {
    test.skip(!user || !pass || !ownCourse, 'Paid student creds / course path not configured');

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAt(page, '/login', user!, pass!);

    await page.goto(fullUrl(ownCourse!), { waitUntil: 'domcontentloaded' });
    const verdict = await isAccessAllowed(page);

    await testInfo.attach('own-course-access', {
      body: JSON.stringify(verdict, null, 2),
      contentType: 'application/json',
    });

    expect.soft(verdict.allowed, `Paid student CANNOT reach their own course ${ownCourse}`).toBe(true);

    await context.close();
  });

  test('cannot reach a course they did not pay for', async ({ browser }, testInfo) => {
    test.skip(
      !user || !pass || !forbiddenCourse,
      'VIVA_PAID_FORBIDDEN_COURSE_PATH not configured (cross-course isolation check)',
    );

    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAt(page, '/login', user!, pass!);

    await page.goto(fullUrl(forbiddenCourse!), { waitUntil: 'domcontentloaded' });
    const verdict = await isAccessAllowed(page);

    await testInfo.attach('cross-course-access', {
      body: JSON.stringify(verdict, null, 2),
      contentType: 'application/json',
    });

    expect
      .soft(verdict.allowed, `Paid student reached unrelated course ${forbiddenCourse}`)
      .toBe(false);

    await context.close();
  });

  for (const path of STUDENT_FORBIDDEN_PATHS) {
    test(`cannot reach ${path} (faculty/admin route)`, async ({ browser }, testInfo) => {
      test.skip(!user || !pass, 'Paid student creds not configured');

      const context = await browser.newContext();
      const page = await context.newPage();
      await loginAt(page, '/login', user!, pass!);

      await page.goto(fullUrl(path), { waitUntil: 'domcontentloaded' });
      const verdict = await isAccessAllowed(page);

      await testInfo.attach(`forbidden-${path.replace(/\W+/g, '_')}`, {
        body: JSON.stringify(verdict, null, 2),
        contentType: 'application/json',
      });

      expect.soft(verdict.allowed, `Paid student reached ${path} — should be blocked`).toBe(false);

      await context.close();
    });
  }
});
