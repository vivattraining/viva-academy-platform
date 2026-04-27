# Viva Career Academy — QA Audit Suite

Automated QA + UX audit for `vivacareeracademy.com`, built on **Playwright Test**. Runs every page across desktop (1440×900) and iPhone (375×812), captures screenshots, logs console errors, measures performance, validates forms, and tests access control on internal routes.

## What it covers

| Area                  | Where                            | What it does                                                                 |
| --------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| Page load + UI        | `tests/page-audit.spec.ts`       | HTTP status, blank screens, infinite loaders, FCP, full-page screenshots, overlap heuristic |
| Console / network     | `tests/helpers/audit.ts`         | JS errors, warnings, failed requests captured per page                       |
| Dead links            | `tests/page-audit.spec.ts`       | HEAD-checks every same-origin link                                           |
| Forms                 | `tests/forms.spec.ts`            | Validation feedback, synthetic fill, opt-in submission                       |
| Access control        | `tests/auth.spec.ts`             | Anonymous user → every gated route must redirect/block                       |
| Login flows           | `tests/auth.spec.ts`             | Public + internal login, role-based dashboard, session persistence           |
| Broken states         | `tests/broken-states.spec.ts`    | Refresh-mid-load, back/forward, multi-tab                                    |
| External connectors   | `tests/integrations.spec.ts`     | Detects Zoom / WhatsApp / email integrations across pages                    |
| Reporting             | `reporters/audit-reporter.ts`    | `summary.md` + `summary.json` + `issue-log.json` + `console-errors.json`     |
| Navigation index      | `scripts/generate-links-html.js` | Outputs `reports/viva_links.html` (clickable index of all routes)            |

## Setup

```bash
cd tests/qa-audit
npm install
npx playwright install --with-deps chromium webkit
cp .env.example .env   # optional — fill in creds for login coverage
```

> Lives at `tests/qa-audit/` inside the monorepo. Has its own `package.json` and `node_modules` so it stays independent of the web/api workspaces — install/upgrade Playwright in here, not at the repo root.

## Run

```bash
# Full audit (both viewports, all specs)
npm run audit

# Just one viewport
npm run test:desktop
npm run test:mobile

# Interactive (UI mode)
npm run test:ui

# Open the Playwright HTML report
npm run report
```

After a run, look at:

- `reports/summary.md` — markdown dashboard you can paste into Slack
- `reports/issue-log.json` — every issue with severity / type / device
- `reports/console-errors.json` — JS errors grouped by page
- `reports/viva_links.html` — open in a browser to click through every route
- `reports/artifacts/<page>__<device>.png` — full-page screenshots
- `reports/html/index.html` — full Playwright trace + step-through

## Login credentials

The auth spec is **opt-in**. Without env vars, it only checks that the public/internal login pages render and that anonymous users can't reach gated routes. Set:

```bash
export VIVA_PUBLIC_USER="..."
export VIVA_PUBLIC_PASS="..."
export VIVA_PUBLIC_DASHBOARD="/student"     # optional, where login should land

export VIVA_INTERNAL_USER="..."
export VIVA_INTERNAL_PASS="..."
export VIVA_INTERNAL_DASHBOARD="/dashboard"
```

In CI, store these as repo secrets — they're already wired into `.github/workflows/qa-release.yml`.

## Pre-release CI gate

`.github/workflows/qa-release.yml` runs the suite on:

1. Every PR targeting `main` (catch issues before merge — comments the summary on the PR).
2. Every push to `main`.
3. **Every release-candidate tag** (`v*-rc*`, `v*-beta*`).
4. Manual dispatch from the Actions tab.

The `gate` job at the bottom is what makes this a *release gate*. In your release workflow (the one that cuts production tags), add:

```yaml
needs: gate
```

…so a production tag like `v1.2.0` can only be cut after the audit passes on the matching `v1.2.0-rc1` candidate.

`VIVA_FAIL_ON_CRITICAL=1` is set in CI, which exits non-zero whenever any critical issue is detected — even if Playwright's soft asserts kept the test green for reporting.

## Customising

- **Add / remove pages:** edit `tests/helpers/pages.ts`. Both spec loops + the link-index generator pick up changes automatically.
- **Tighten perf budget:** set `VIVA_PERF_BUDGET_MS` (default 3000ms).
- **Skip link crawling locally:** `VIVA_SKIP_LINKS=1 npm test`.
- **Submit real forms:** `VIVA_SUBMIT_FORMS=1 npm test` — off by default to avoid fake applications.

## External-connector check

`tests/integrations.spec.ts` scans every page's HTML for evidence of Zoom (`zoom.us` links, `ZoomMtg` SDK), WhatsApp (`wa.me` / `api.whatsapp.com`), and email (`mailto:`, SendGrid / Postmark / Resend / Mailgun). The output goes to `reports/artifacts/connectors.json`. **Connectors that show up nowhere = the gap to close before launch.** This is a static check — it tells you what's wired into the markup, not whether the integration works end-to-end. Pair it with smoke-tests in your backend.

If a connector is missing:

| Missing       | Action                                                                                  |
| ------------- | --------------------------------------------------------------------------------------- |
| Zoom          | Add Zoom Meeting SDK or join-link CTAs to trainer/student/dashboard routes              |
| WhatsApp      | Add `wa.me/<number>` click-to-chat buttons or WhatsApp Business API webhooks            |
| Email         | Surface `mailto:` contacts on public pages; verify SendGrid/Postmark keys in your stack |

## Project layout

```
viva-qa-suite/
├── playwright.config.ts          # 2 projects (desktop + mobile), reporters
├── tests/
│   ├── helpers/
│   │   ├── pages.ts              # Single source of truth for routes
│   │   └── audit.ts              # auditPage / auditLinks / auditOverlap
│   ├── page-audit.spec.ts        # Per-page UI + perf + links
│   ├── forms.spec.ts             # Form validation + (opt-in) submission
│   ├── auth.spec.ts              # Access control + login flows
│   ├── broken-states.spec.ts     # Refresh / back-forward / multi-tab
│   └── integrations.spec.ts      # Zoom / WhatsApp / email detection
├── reporters/
│   └── audit-reporter.ts         # Aggregates artefacts → summary.md/json
├── scripts/
│   ├── generate-links-html.js    # Writes reports/viva_links.html
│   └── generate-summary.js       # Re-renders markdown without re-running tests
├── .github/workflows/qa-release.yml
├── .env.example
├── package.json
└── tsconfig.json
```
