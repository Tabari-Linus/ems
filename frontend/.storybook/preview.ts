import { withThemeByDataAttribute } from '@storybook/addon-themes';
import type { Preview } from '@storybook/angular-vite';

// Same global styles, in the same order, as an app consuming the design system.
import '../projects/tokens/src/generated/tokens.css';
import '../projects/ui/styles/index.css';

const preview: Preview = {
  decorators: [
    // Toolbar light/dark toggle: sets <html data-theme="…">, exactly like ThemeService.
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: { expanded: true },
    // Any axe violation fails the story's test (Vitest addon) instead of only warning.
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  tags: ['autodocs'],
};

export default preview;
