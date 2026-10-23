import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs every Storybook story as a test in real Chromium (Vitest browser mode): the story must
 * render, its `play` function must pass, and axe must report no violations
 * (`parameters.a11y.test: 'error'` in .storybook/preview.ts).
 *
 * Two projects, one per theme: `storybook-light` and `storybook-dark` run the same stories, the
 * dark one with `<html data-theme="dark">` (via __EMS_STORY_THEME__, read in preview.ts), so axe
 * (colour contrast included) is enforced in both themes.
 *
 * Kept separate from the Angular unit-test builder (`ng test`), which owns `*.spec.ts`.
 */
function themeProject(theme: 'light' | 'dark'): TestProjectInlineConfiguration {
  return {
    extends: true,
    define: { __EMS_STORY_THEME__: JSON.stringify(theme) },
    // One dependency cache per project: the two projects start in parallel, and on a cold cache
    // both would pre-bundle into the same folder at once (a race that can hang or reload a run).
    cacheDir: path.join(dirname, 'node_modules', '.vite', `storybook-${theme}`),
    // Browser mode has no index.html for Vite's dependency scan, so dependencies were discovered
    // story by story and each discovery re-optimised and reloaded the page ("Failed to fetch
    // dynamically imported module" on a cold cache). Scan every story up front instead.
    optimizeDeps: { entries: ['projects/**/*.stories.ts', '.storybook/preview.ts'] },
    plugins: [
      storybookAngularVitest({ tsConfig: '.storybook/tsconfig.json' }),
      storybookTest({ configDir: path.join(dirname, '.storybook') }),
    ],
    test: {
      name: `storybook-${theme}`,
      // On a cold Vite cache the first story of a file compiles its whole import graph (the
      // composed pages pull in most of @ems/ui), which can exceed the 15 s default.
      testTimeout: 60_000,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{ browser: 'chromium' }],
      },
    },
  };
}

export default defineConfig({
  test: {
    projects: [themeProject('light'), themeProject('dark')],
  },
});
