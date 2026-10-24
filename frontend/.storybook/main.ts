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
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [...toAliasArray(viteConfig.resolve?.alias), ...EMS_SOURCE_ALIASES],
    },
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [...(viteConfig.optimizeDeps?.include ?? []), ...PREBUNDLED_DEPS],
    },
  }),
};

const projects = fileURLToPath(new URL('../projects', import.meta.url)).replace(/\\/g, '/');

/**
 * The ONE place Storybook (and `npm run storybook:test`, which loads this config) maps the design
 * system to its sources, like the tsconfig `paths` do for the Angular builders. Without it Vite
 * would resolve `@ems/*` through the workspace packages (no JS entry, styles only).
 * `@ems/ui/styles/*` stays a real package path (CSS).
 */
export const EMS_SOURCE_ALIASES = [
  { find: /^@ems\/ui\/(?!styles\/)([\w-]+)$/, replacement: `${projects}/ui/$1/src/public-api.ts` },
  { find: /^@ems\/ui$/, replacement: `${projects}/ui/src/public-api.ts` },
  { find: /^@ems\/icons$/, replacement: `${projects}/icons/src/public-api.ts` },
  { find: /^@ems\/tokens$/, replacement: `${projects}/tokens/src/public-api.ts` },
];

/**
 * Every bare import the stories reach, pre-bundled up front. Otherwise Vite discovers them while
 * the first story loads, re-optimises, and reloads the page mid-run; on a cold cache the first
 * `storybook:test` then fails with "Failed to fetch dynamically imported module" / NG0203.
 * Add a package here when a story or component starts importing it.
 */
export const PREBUNDLED_DEPS = [
  '@angular/cdk/a11y',
  '@angular/cdk/dialog',
  '@angular/cdk/listbox',
  '@angular/cdk/menu',
  '@angular/cdk/overlay',
  '@angular/cdk/portal',
  '@angular/common',
  '@angular/core',
  '@angular/core/rxjs-interop',
  '@angular/forms',
  '@angular/forms/signals',
  '@angular/platform-browser',
  '@angular/router',
  '@lucide/angular',
  '@storybook/addon-themes',
  'rxjs',
  'storybook/test',
];

function toAliasArray(alias: unknown): { find: string | RegExp; replacement: string }[] {
  if (!alias) return [];
  if (Array.isArray(alias)) return alias;
  return Object.entries(alias as Record<string, string>).map(([find, replacement]) => ({
    find,
    replacement,
  }));
}

export default config;
