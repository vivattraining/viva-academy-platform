/**
 * Fix-verification recordings.
 *
 * One test per resolved bug fix (Issues 8/23/33, 20, 21, 22, 24, 66, 67, 68).
 * Each test runs with video: 'on' and slowMo so every action is clearly
 * visible in the recorded .webm.
 *
 * Run:
 *   cd tests/qa-audit
 *   $env:VIVA_BASE_URL="http://localhost:3000"
 *   $env:NEXT_PUBLIC_API_URL="http://localhost:8000"
 *   npx playwright test tests/fix-verification.spec.ts --project=desktop-chromium --reporter=list
 */

import { test, expect, type Page } from '@playwright/test';
import { fullUrl } from './helpers/pages';

test.use({
  video: 'on',
  launchOptions: { slowMo: 700 },
  viewport: { width: 1440, height: 900 },
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.VIVA_BASE_URL || 'http://localhost:3001').replace(':3001', ':8000');

const TENANT = 'Viva Career Academy';
const ACTIVE_COURSE_CODE = 'P · 01';

async function pause(ms = 1200): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function adminLogin(page: Page, email: string, password: string): Promise<string | null> {
  await page.goto(fullUrl('/internal/login'), { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  await pause();
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await pause(600);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 60_000 }).catch(() => {}),
    page.locator('button[type="submit"], button.button-primary').first().click(),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
  await pause(2000);
  return page.evaluate((): string | null => {
    try {
      const raw = window.localStorage.getItem('academy-session');
      if (!raw) return null;
      return (JSON.parse(raw) as { session_token?: string }).session_token ?? null;
    } catch {
      return null;
    }
  });
}

// ─── Fix 1 — Issues #8/#23/#33 ───────────────────────────────────────────────

test.describe('Fix — Issues #8/#23/#33: Apply form per-field inline validation', () => {
  test('Blur errors fire per-field; empty submit surfaces all three required errors simultaneously', async ({ page }) => {
    await page.goto(fullUrl('/apply'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause();

    const nameInput = page.locator(
      'input:not([type="email"]):not([type="tel"]):not([type="hidden"])' +
      ':not([type="submit"]):not([type="password"]):not([type="checkbox"]):not([type="radio"])',
    ).first();

    await nameInput.scrollIntoViewIfNeeded();
    await nameInput.fill('John123');
    await pause(400);
    await nameInput.blur();
    await pause(900);
    await expect(page.locator('text=/must not contain numbers/i')).toBeVisible({
      message: 'Expected inline error after blurring name with digits',
    });
    await pause(600);

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('notvalid');
    await pause(400);
    await emailInput.blur();
    await pause(900);
    await expect(page.locator('text=/valid email/i')).toBeVisible({
      message: 'Expected inline error after blurring malformed email',
    });
    await pause(600);

    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill('123');
    await pause(400);
    await phoneInput.blur();
    await pause(900);
    await expect(page.locator('text=/valid phone/i')).toBeVisible({
      message: 'Expected inline error after blurring short phone number',
    });
    await pause(600);

    // Clear all fields then dispatch native submit — the submit button has
    // disabled={!formReady} so a direct click would be a no-op.
    await nameInput.fill('');
    await nameInput.blur();
    await pause(300);
    await emailInput.fill('');
    await emailInput.blur();
    await pause(300);
    await phoneInput.fill('');
    await phoneInput.blur();
    await pause(300);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await pause(1200);

    await expect(page.locator('text=/Full name is required/i')).toBeVisible({
      message: 'Expected "Full name is required" on empty submit',
    });
    await expect(page.locator('text=/Email address is required/i')).toBeVisible({
      message: 'Expected "Email address is required" on empty submit',
    });
    await expect(page.locator('text=/Phone number is required/i')).toBeVisible({
      message: 'Expected "Phone number is required" on empty submit',
    });
    await pause(1500);
  });
});

// ─── Fix 2 — Issue #20 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #20: Admin cannot change own role (select disabled)', () => {
  const internalUser = process.env.VIVA_INTERNAL_USER;
  const internalPass = process.env.VIVA_INTERNAL_PASS;

  test('Own-user edit form has role select disabled with explanatory label', async ({ page }) => {
    if (!internalUser || !internalPass) {
      test.skip(true, 'VIVA_INTERNAL_USER / VIVA_INTERNAL_PASS not set');
      return;
    }
    await adminLogin(page, internalUser, internalPass);
    await page.goto(fullUrl('/admin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause(2000);

    const ownEmailParagraph = page.locator(`p.muted:has-text("${internalUser}")`).first();
    await ownEmailParagraph.scrollIntoViewIfNeeded();
    await pause(600);
    const ownPanel = ownEmailParagraph.locator(
      'xpath=ancestor::div[contains(@class,"editorial-workbench-panel")][1]',
    );
    await ownPanel.locator('button:has-text("Edit access")').click();
    await pause(1200);

    await expect(ownPanel.locator('select[disabled]')).toBeVisible({
      message: 'Expected role <select disabled> when editing own account',
    });
    await expect(page.locator('text=/You cannot change your own role/i')).toBeVisible({
      message: 'Expected explanatory label beside disabled select',
    });
    await pause(1500);

    const cancelBtn = ownPanel.locator('button:has-text("Cancel")');
    if ((await cancelBtn.count()) > 0) await cancelBtn.click();
    await pause(600);
  });
});

// ─── Fix 3 — Issue #21 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #21: Trainer page loads without contrast/crash error', () => {
  const internalUser = process.env.VIVA_INTERNAL_USER;
  const internalPass = process.env.VIVA_INTERNAL_PASS;

  test('Authenticated visit to /trainer renders without crash or login redirect', async ({ page }) => {
    if (!internalUser || !internalPass) {
      test.skip(true, 'VIVA_INTERNAL_USER / VIVA_INTERNAL_PASS not set');
      return;
    }
    await adminLogin(page, internalUser, internalPass);
    await page.goto(fullUrl('/trainer'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2000);

    expect(page.url()).not.toContain('login');
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
    const errorOverlayCount = await page.locator('nextjs-portal, #__next-error').count();
    expect(errorOverlayCount).toBe(0);
    await pause(1500);
  });
});

// ─── Fix 4 — Issue #22 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #22: Duplicate phone+course returns 409', () => {
  test('Second application with same phone and course code is rejected with 409', async ({ page }) => {
    await page.goto(fullUrl('/apply'), { waitUntil: 'domcontentloaded' });
    await pause();

    const timestamp = Date.now();
    const uniquePhone = String(timestamp).slice(-9) + String(Math.floor(Math.random() * 9) + 1);

    const result = await page.evaluate(
      async ({ apiBase, tenant, courseCode, phone, ts }: {
        apiBase: string; tenant: string; courseCode: string; phone: string; ts: number;
      }) => {
        async function post(email: string) {
          const res = await fetch(`${apiBase}/api/v1/academy/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenant_name: tenant,
              student_name: 'QA Dup Phone Test',
              student_email: email,
              student_phone: phone,
              course_code: courseCode,
              currency: 'INR',
            }),
          });
          return { status: res.status, body: await res.json().catch(() => ({})) };
        }
        const first = await post(`qa-dup-a-${ts}@example.com`);
        await new Promise(r => setTimeout(r, 300));
        const second = await post(`qa-dup-b-${ts}@example.com`);
        return { first, second };
      },
      { apiBase: API_BASE, tenant: TENANT, courseCode: ACTIVE_COURSE_CODE, phone: uniquePhone, ts: timestamp },
    );

    await page.evaluate((r: unknown) => console.log('Issue #22 dup-phone:', JSON.stringify(r, null, 2)), result);
    await pause(2000);

    expect(result.first.status).toBeLessThan(400);
    expect(result.second.status).toBe(409);
  });
});

// ─── Fix 5 — Issue #24 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #24: payment_stage=paid does not auto-enroll', () => {
  const internalUser = process.env.VIVA_INTERNAL_USER;
  const internalPass = process.env.VIVA_INTERNAL_PASS;

  test('After marking payment paid only, application_stage and enrollment_stage stay at default', async ({ page }) => {
    if (!internalUser || !internalPass) {
      test.skip(true, 'VIVA_INTERNAL_USER / VIVA_INTERNAL_PASS not set');
      return;
    }
    const timestamp = Date.now();

    await page.goto(fullUrl('/apply'), { waitUntil: 'domcontentloaded' });
    await pause();

    const createResult = await page.evaluate(
      async ({ apiBase, tenant, courseCode, email, phone }: {
        apiBase: string; tenant: string; courseCode: string; email: string; phone: string;
      }) => {
        const res = await fetch(`${apiBase}/api/v1/academy/applications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_name: tenant,
            student_name: 'QA FixTest',
            student_email: email,
            student_phone: phone,
            course_code: courseCode,
            currency: 'INR',
          }),
        });
        return { status: res.status, body: await res.json().catch(() => ({})) };
      },
      {
        apiBase: API_BASE,
        tenant: TENANT,
        courseCode: ACTIVE_COURSE_CODE,
        email: `qa-fix24-${timestamp}@example.com`,
        phone: `8${timestamp}`.slice(0, 10),
      },
    );

    expect(createResult.status).toBeLessThan(400);
    const applicationId = (createResult.body as { item?: { id?: string } })?.item?.id;
    expect(applicationId).toBeTruthy();
    await pause();

    const sessionToken = await adminLogin(page, internalUser, internalPass);
    expect(sessionToken).toBeTruthy();
    await pause();

    const statusResult = await page.evaluate(
      async ({ apiBase, tenant, appId, token }: {
        apiBase: string; tenant: string; appId: string; token: string;
      }) => {
        const res = await fetch(
          `${apiBase}/api/v1/academy/applications/${encodeURIComponent(appId)}/status/secure`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Academy-Session': token },
            body: JSON.stringify({ tenant_name: tenant, payment_stage: 'paid' }),
          },
        );
        return { status: res.status, body: await res.json().catch(() => ({})) };
      },
      { apiBase: API_BASE, tenant: TENANT, appId: applicationId!, token: sessionToken! },
    );

    await page.evaluate((r: unknown) => console.log('Issue #24 payment-only update:', JSON.stringify(r, null, 2)), statusResult);
    await pause(1500);

    expect(statusResult.status).toBeLessThan(400);
    const item = (statusResult.body as { item?: Record<string, unknown> })?.item ?? {};
    expect(item['payment_stage']).toBe('paid');
    expect(item['application_stage']).not.toBe('enrolled');
    expect(item['enrollment_stage']).not.toBe('active');
    await pause(1000);
  });
});

// ─── Fix 6 — Issue #66 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #66: Certificate page graceful error (local server)', () => {
  test('Invalid certificate token renders graceful message with no Next.js crash overlay', async ({ page }) => {
    await page.goto(fullUrl('/certificates/invalid-token-qa-test'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await pause(2000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(20);
    const errorOverlayCount = await page.locator('nextjs-portal, #__next-error').count();
    expect(errorOverlayCount).toBe(0);
    await pause(1000);
  });
});

// ─── Fix 7 — Issue #67 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #67: Admin name update reflects in list and success message persists', () => {
  const internalUser = process.env.VIVA_INTERNAL_USER;
  const internalPass = process.env.VIVA_INTERNAL_PASS;

  test('New name appears in user list and success message is visible after save', async ({ page }) => {
    if (!internalUser || !internalPass) {
      test.skip(true, 'VIVA_INTERNAL_USER / VIVA_INTERNAL_PASS not set');
      return;
    }
    await adminLogin(page, internalUser, internalPass);
    await page.goto(fullUrl('/admin'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause(2000);

    const timestamp = Date.now();
    const newName = `QA Name ${timestamp}`;

    const ownEmailParagraph = page.locator(`p.muted:has-text("${internalUser}")`).first();
    await ownEmailParagraph.scrollIntoViewIfNeeded();
    await pause(600);
    const ownPanel = ownEmailParagraph.locator(
      'xpath=ancestor::div[contains(@class,"editorial-workbench-panel")][1]',
    );
    await ownPanel.locator('button:has-text("Edit access")').click();
    await pause(1200);

    const nameEditInput = ownPanel.locator('input.editorial-input').first();
    await nameEditInput.fill('');
    await nameEditInput.type(newName);
    await pause(600);
    await ownPanel.locator('button:has-text("Save changes")').click();
    await pause(2500);

    await expect(page.locator('text=/User updated/i')).toBeVisible({
      message: 'Expected "User updated." success message to persist after save',
    });
    await expect(page.locator(`text="${newName}"`).first()).toBeVisible({
      message: `Expected new name "${newName}" to appear in the refreshed user list`,
    });
    await pause(1500);
  });
});

// ─── Fix 8 — Issue #68 ───────────────────────────────────────────────────────

test.describe('Fix — Issue #68: Login CTA buttons present in nav on public pages', () => {
  test('Advisory board nav shows both login buttons; login page nav hides them', async ({ page }) => {
    await page.goto(fullUrl('/advisory-board'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause(1500);

    const studentLoginLink = page.locator('nav a[href="/login"]').filter({ hasText: 'Student Login' });
    const adminLoginLink = page.locator('nav a[href="/internal/login"]').filter({ hasText: 'Admin Login' });

    await expect(studentLoginLink).toBeVisible({
      message: 'Expected "Student Login" link in nav on /advisory-board',
    });
    await expect(adminLoginLink).toBeVisible({
      message: 'Expected "Admin Login" link in nav on /advisory-board',
    });
    await pause(1200);

    await page.goto(fullUrl('/login'), { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await pause(1200);

    const studentLoginOnLoginPage = page.locator('nav a[href="/login"]').filter({ hasText: 'Student Login' });
    await expect(studentLoginOnLoginPage).not.toBeVisible({
      message: 'Expected "Student Login" CTA to be absent from nav on /login page',
    });
    await pause(1000);
  });
});
