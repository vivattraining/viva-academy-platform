import { test, expect } from '@playwright/test';
import { fullUrl } from './helpers/pages';

/**
 * Forms audit — exercises field validation and submission behaviour on the
 * /apply and /login forms.
 *
 * Strategy: for each visible <form>, fill text/email/tel/password inputs with
 * synthetic data, attempt submit, and capture the response (validation errors,
 * thank-you state, network call, or error toast). We do NOT submit real
 * applications — set VIVA_SUBMIT_FORMS=1 to opt in.
 */

const TARGETS = [
  { path: '/apply', name: 'Apply' },
  { path: '/login', name: 'Login' },
  { path: '/internal/login', name: 'Internal Login' },
];

for (const target of TARGETS) {
  test.describe(`Forms — ${target.name}`, () => {
    test('renders inputs and surfaces validation', async ({ page }, testInfo) => {
      await page.goto(fullUrl(target.path), { waitUntil: 'domcontentloaded' });

      const formCount = await page.locator('form').count();
      if (formCount === 0) {
        test.info().annotations.push({ type: 'skip', description: `No <form> on ${target.path}` });
        test.skip(true, `No form found on ${target.path}`);
        return;
      }

      const form = page.locator('form').first();
      await expect(form).toBeVisible();

      // Empty submit → validation should appear (HTML5 :invalid or visible error).
      const submitBtn = form.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitBtn.count()) {
        await submitBtn.click({ trial: false }).catch(() => {});
        await page.waitForTimeout(500);
        const invalidCount = await form.locator(':invalid').count();
        const visibleErrors = await page.locator('[role="alert"], .error, [aria-invalid="true"]').count();
        expect.soft(
          invalidCount + visibleErrors,
          `Empty submit on ${target.path} produced no validation feedback`,
        ).toBeGreaterThan(0);
      }

      // Fill plausible synthetic data.
      const inputs = form.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
      const n = await inputs.count();
      for (let i = 0; i < n; i++) {
        const input = inputs.nth(i);
        const type = (await input.getAttribute('type')) || 'text';
        const name = (await input.getAttribute('name')) || `field-${i}`;
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

      const filledShot = await page.screenshot({ fullPage: true });
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
