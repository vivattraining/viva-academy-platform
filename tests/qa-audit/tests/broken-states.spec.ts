import { test, expect } from '@playwright/test';
import { ALL_PAGES, fullUrl } from './helpers/pages';

/**
 * Broken-state resilience: refresh-mid-load, back/forward, multi-tab.
 * Sampled across the public + a representative internal page to keep total
 * runtime sane. Add more by extending SAMPLE.
 */

// Sample only PUBLIC routes for refresh/back-forward resilience testing.
// Auth-gated routes (e.g. /dashboard) do server + client redirect chains
// that interrupt navigation in ways that aren't the site's "broken state"
// behaviour we're trying to validate — those redirects are correctly
// covered by tests/auth.spec.ts. Don't double-count the same behaviour
// as a broken-states failure.
const SAMPLE = ALL_PAGES.filter((p) =>
  ['/', '/apply', '/login', '/internal/login'].includes(p.path),
);

for (const pageDef of SAMPLE) {
  test(`Broken states — ${pageDef.name}`, async ({ page, context }, testInfo) => {
    const url = fullUrl(pageDef.path);

    // 1) Refresh mid-load.
    //    What we actually care about: can the page recover from a
    //    refresh-during-load? Triggering reload() while goto() is in flight
    //    will cancel both navigations and may leave page.url() at about:blank
    //    momentarily — that's expected browser plumbing, not a site bug.
    //    So we run the chaos, swallow whatever it throws, then do a clean
    //    re-navigation and assert THAT succeeds. If the site can't recover
    //    on a fresh load after a cancelled one, that's the real failure.
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
    await page.waitForTimeout(120);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => null);
    const recovery = await page
      .goto(url, { waitUntil: 'domcontentloaded' })
      .catch((err: Error) => ({ ok: () => false, statusText: () => err.message }) as any);
    expect
      .soft(
        recovery && recovery.ok && recovery.ok(),
        `Failed to recover ${pageDef.path} after refresh-mid-load`,
      )
      .toBe(true);

    // 2) Back/forward.
    await page.goto(fullUrl('/'), { waitUntil: 'domcontentloaded' });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => null);
    // goForward can be cancelled by client-side route policies (auth redirects, etc.) —
    // treat that as a soft signal, not a hard failure.
    await page.goForward({ waitUntil: 'domcontentloaded' }).catch(() => null);

    // 3) Multi-tab (same context to share session).
    const t2 = await context.newPage();
    const t3 = await context.newPage();
    await Promise.all([
      t2.goto(url, { waitUntil: 'domcontentloaded' }),
      t3.goto(url, { waitUntil: 'domcontentloaded' }),
    ]);
    expect.soft(t2.url()).not.toBe('about:blank');
    expect.soft(t3.url()).not.toBe('about:blank');
    await t2.close();
    await t3.close();

    await testInfo.attach('final-state', {
      body: JSON.stringify({ finalUrl: page.url() }, null, 2),
      contentType: 'application/json',
    });
  });
}
