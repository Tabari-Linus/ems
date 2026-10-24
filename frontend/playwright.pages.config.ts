import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env['E2E_PAGES_PORT'] ?? 4371);

/**
 * Page snapshots of the app itself (not Storybook): every page in light and dark at 1440 and
 * 390 wide, plus an axe pass. The API is mocked with `page.route` (e2e/pages/support.ts), so no
 * backend is needed and the screenshots are deterministic (fixed clock, fixed data).
 *
 * Baselines are per platform (fonts render differently on Windows and Linux):
 * `npm run e2e:pages -- --update-snapshots`.
 */
export default defineConfig({
  testDir: './e2e/pages',
  outputDir: './test-results/pages',
  snapshotPathTemplate: '{testDir}/baselines/{arg}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report/pages' }]]
    : 'list',
  expect: {
    // The dev server compiles lazy chunks on first request.
    timeout: 15_000,
    toHaveScreenshot: {
      threshold: 0.2,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx ng serve --port ${PORT} --no-hmr --no-live-reload`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env['CI'],
    timeout: 240_000,
  },
});
