import { test, expect } from '@playwright/test';
import { fullUrl } from './helpers/pages';

/**
 * Forms audit — exercises field validation and submission behaviour on the
 * /apply and /login forms.
 *
 * Strategy: locate inputs directly by field selectors (these pages use
 * controlled React inputs without a native <form> wrapper), fill with
 * synthetic data, attempt submit, and capture the response. We do NOT submit
 * real applications — set VIVA_SUBMIT_FORMS=1 to opt in.
 */

const TARGETS = [
  { path: '/apply', name: 'Apply' },
  { path: '/login', name: 'Login' },
  { path: '/internal/login', name: 'Internal Login' },
];

// Matches fillable inputs; excludes hidden/submit/button/reset types.
const INPUT_SELECTOR =
  'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea';

for (const target of TARGETS) {
  test.describe(`Forms — ${target.name}`, () => {
    test('renders inputs and surfaces validation', async ({ page }, testInfo) => {
      await page.goto(fullUrl(target.path), { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const inputCount = await page.locator(INPUT_SELECTOR).count();
      if (inputCount === 0) {
        test.skip(true, `No input fields found on ${target.path}`);
        return;
      }

      // Empty submit → validation should appear (HTML5 :invalid or visible error).
      const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitBtn.count()) {
        await submitBtn.click({ trial: false }).catch(() => {});
        await page.waitForTimeout(500);
        const invalidCount = await page.locator(':invalid').count();
        const visibleErrors = await page.locator('[role="alert"], .error, [aria-invalid="true"]').count();
        expect.soft(
          invalidCount + visibleErrors,
          `Empty submit on ${target.path} produced no validation feedback`,
        ).toBeGreaterThan(0);
      }

      // Fill plausible synthetic data.
      const inputs = page.locator(INPUT_SELECTOR);
      const n = await inputs.count();
      for (let i = 0; i < n; i++) {
        const input = inputs.nth(i);
        const type = (await input.getAttribute('type')) || 'text';
        const name =
          (await input.getAttribute('name')) ||
          (await input.getAttribute('placeholder')) ||
          `field-${i}`;
        let value = `qa-${Date.now()}-${i}`;
        if (type === 'email' || /email/i.test(name)) value = `qa+${Date.now()}@example.com`;
        else if (type === 'tel' || /phone|tel/i.test(name)) value = '5551234567';
        else if (type === 'password') value = 'TestPassw0rd!';
        else if (type === 'number') value = '1';
        else if (type === 'url') value = 'https://example.com';
        else if (type === 'date') value = '2026-01-01';
        else if (type === 'checkbox' || type === 'radio') {
          await input.check({ force: true }).catch(() => {});
          continue;
        }
        await input.fill(value, { force: true }).catch(() => {});
      }

      const filledShot = await page.screenshot({ fullPage: false });
      await testInfo.attach(`${target.name}-filled`, { body: filledShot, contentType: 'image/png' });

      if (process.env.VIVA_SUBMIT_FORMS && (await submitBtn.count())) {
        const responsePromise = page
          .waitForResponse((resp) => resp.request().method() !== 'GET', { timeout: 10_000 })
          .catch(() => null);
        await submitBtn.click();
        const resp = await responsePromise;
        if (resp) {
          await testInfo.attach('submit-response', {
            body: JSON.stringify(
              { url: resp.url(), status: resp.status(), method: resp.request().method() },
              null,
              2,
            ),
            contentType: 'application/json',
          });
        }
      }
    });
  });
}
