import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Viva Career Academy QA suite.
 *
 * Two projects: 1440x900 desktop and 375x812 (iPhone) mobile, run in parallel.
 * Reports: list (terminal), HTML (reports/html), JSON (reports/results.json),
 * and a custom audit reporter that emits issue-log.json + console-errors.json.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry locally so we can spot flaky cold-starts; 2 in CI.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['./reporters/audit-reporter.ts'],
  ],

  outputDir: 'test-results',

  use: {
    baseURL: process.env.VIVA_BASE_URL || 'https://www.vivacareeracademy.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: false,
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 13'],
        // Override to spec'd 375x812 explicitly
        viewport: { width: 375, height: 812 },
        // Mobile emulation can be slower on cold-starts; give nav an extra
        // 15s of headroom so we don't false-positive on real perf signals.
        navigationTimeout: 45_000,
      },
    },
  ],
});
