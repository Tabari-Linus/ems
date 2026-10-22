import { defineConfig, devices } from '@playwright/test';

const PORT = 6007;

/**
 * Visual regression for the design system: screenshots of Storybook stories (built static
 * Storybook, `npm run storybook:build`) in light and dark, plus an axe pass per theme.
 *
 * Baselines live next to the spec (visual/baselines/) and are per platform, because
 * system fonts render differently on Windows and Linux. Refresh them on purpose with
 * `npm run test:visual -- --update-snapshots`.
 */
export default defineConfig({
  testDir: './visual',
  outputDir: './test-results/visual',
  snapshotPathTemplate: '{testDir}/baselines/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? 2 : undefined,
  reporter: process.env['CI']
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report/visual' }]]
    : 'list',
  expect: {
    toHaveScreenshot: {
      // Anti-aliasing noise only; a colour, spacing or size change moves far more pixels.
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
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 600 } },
    },
  ],
  webServer: {
    command: `npx vite preview --outDir storybook-static --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/index.json`,
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
