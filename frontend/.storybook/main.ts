import type { StorybookConfig } from '@storybook/angular-vite';

/**
 * Design-system docs site for @ems/ui, @ems/icons and @ems/tokens (frontend/projects/*).
 *
 * Framework: @storybook/angular-vite (Vite + Analog's Angular plugin), which is what the
 * Vitest addon needs to run every story as a test (play functions + axe).
 */
const config: StorybookConfig = {
  stories: ['../projects/**/*.stories.ts'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: { tsconfig: '.storybook/tsconfig.json' },
  },
  core: { disableTelemetry: true },
};

export default config;
