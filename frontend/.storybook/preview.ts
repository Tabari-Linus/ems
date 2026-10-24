import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/angular-vite';

// Same global styles, in the same order, as an app consuming the design system. The fonts are
// bundled from @fontsource-variable/* by ui/styles/fonts.css, so Storybook makes no font requests.
import '../projects/tokens/src/generated/tokens.css';
import '../projects/ui/styles/index.css';

/**
 * `npm run storybook:test` runs every story twice: once per theme. The dark Vitest project defines
 * __EMS_STORY_THEME__ = 'dark' (vitest.storybook.config.mts); everywhere else it is undefined and
 * stories start in light.
 */
declare const __EMS_STORY_THEME__: 'light' | 'dark' | undefined;
const initialTheme = typeof __EMS_STORY_THEME__ === 'undefined' ? 'light' : __EMS_STORY_THEME__;

const preview: Preview = {
  decorators: [
    // Toolbar light/dark toggle: sets <html data-theme="…">, exactly like ThemeService.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: initialTheme,
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  initialGlobals: { theme: initialTheme },
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    // Any axe violation fails the story's test (Vitest addon) instead of only warning.
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Colour', 'Typography', 'Space and shape', 'Motion', 'Icon', 'Token reference'],
          'Actions & inputs',
          'Feedback',
          'Overlays',
          'Navigation',
          'Data display',
          'Layout',
          'Patterns',
          ['Home', 'People directory'],
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
