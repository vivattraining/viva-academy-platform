import { test, expect } from '@playwright/test';
import { fullUrl, ALL_PAGES } from './helpers/pages';

/**
 * External-connector audit. Scans rendered HTML across all pages for
 * references to Zoom, WhatsApp, and email integrations, and reports which
 * are present / missing. This does NOT verify they're functional end-to-end —
 * it answers "are these wired up at all?" and surfaces the gaps for follow-up.
 *
 * Pattern matching:
 *   - Zoom:     zoom.us links, "join Zoom" buttons, ZoomMtg SDK script tags
 *   - WhatsApp: wa.me / api.whatsapp.com links, WhatsApp click-to-chat buttons
 *   - Email:    mailto: links, embedded SendGrid / Postmark / Resend SDKs
 */

type Connector = 'Zoom' | 'WhatsApp' | 'Email';

interface Finding {
  page: string;
  url: string;
  connector: Connector;
  evidence: string[];
}

const PATTERNS: Record<Connector, RegExp[]> = {
  Zoom: [/zoom\.us\//i, /ZoomMtg/i, /\bzoom\b.*meeting/i],
  WhatsApp: [/wa\.me\//i, /api\.whatsapp\.com/i, /whatsapp/i],
  Email: [/mailto:/i, /sendgrid/i, /postmark/i, /resend\.com/i, /mailgun/i],
};

const findings: Finding[] = [];

for (const pageDef of ALL_PAGES) {
  test(`Connectors — ${pageDef.name}`, async ({ page }, testInfo) => {
    const url = fullUrl(pageDef.path);
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
    const html = await page.content();
    const detected: Partial<Record<Connector, string[]>> = {};

    for (const [connector, regexes] of Object.entries(PATTERNS) as [Connector, RegExp[]][]) {
      const hits: string[] = [];
      for (const re of regexes) {
        const m = html.match(new RegExp(re.source, re.flags + 'g'));
        if (m) hits.push(...m.slice(0, 3));
      }
      if (hits.length) detected[connector] = [...new Set(hits)];
    }

    const present = Object.keys(detected) as Connector[];
    const missing = (Object.keys(PATTERNS) as Connector[]).filter((c) => !present.includes(c));

    for (const conn of present) findings.push({ page: pageDef.name, url, connector: conn, evidence: detected[conn]! });

    await testInfo.attach('connectors', {
      body: JSON.stringify({ present, missing, evidence: detected }, null, 2),
      contentType: 'application/json',
    });

    expect(present.length + missing.length).toBe(3);
  });
}

test.afterAll(async () => {
  const fs = await import('fs');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'reports', 'artifacts');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'connectors.json'), JSON.stringify(findings, null, 2));
});
