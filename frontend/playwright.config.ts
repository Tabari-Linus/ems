import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against an already running stack (docker compose: frontend on :4200,
 * API on :8080), so no `webServer` is configured. Point elsewhere with E2E_BASE_URL.
 */
export default defineConfig({
  testDir: './e2e',
  // Mocked page snapshots run with playwright.pages.config.ts (npm run e2e:pages).
  testIgnore: 'pages/**',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
