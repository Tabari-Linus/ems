import { fileURLToPath } from 'node:url';
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
  // Secondary entry points import each other (`@ems/ui/form-field` from `@ems/ui/input`). Vite
  // would resolve those through the workspace package's `exports` (styles only), so point them
  // at the sources, like the tsconfig `paths` do for the Angular builders.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [
        ...toAliasArray(viteConfig.resolve?.alias),
        {
          find: /^@ems\/ui\/(?!styles\/)([\w-]+)$/,
          replacement: `${uiRoot}/$1/src/public-api.ts`,
        },
      ],
    },
  }),
};

const uiRoot = fileURLToPath(new URL('../projects/ui', import.meta.url)).replace(/\\/g, '/');

function toAliasArray(alias: unknown): { find: string | RegExp; replacement: string }[] {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias;
  return Object.entries(alias as Record<string, string>).map(([find, replacement]) => ({
    find,
    replacement,
  }));
}

export default config;
