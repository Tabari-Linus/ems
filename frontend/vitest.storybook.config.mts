import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Runs every Storybook story as a test in real Chromium (Vitest browser mode): the story must
 * render, its `play` function must pass, and axe must report no violations
 * (`parameters.a11y.test: 'error'` in .storybook/preview.ts).
 *
 * Kept separate from the Angular unit-test builder (`ng test`), which owns `*.spec.ts`.
 */
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookAngularVitest({ tsConfig: '.storybook/tsconfig.json' }),
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
