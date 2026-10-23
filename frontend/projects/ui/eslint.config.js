// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'ui', style: 'camelCase' },
      ],
      // Components are elements (ui-foo) or, when they enhance a native element, attributes
      // (button[uiButton]); the attribute form is allowed per component with a comment.
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ui', style: 'kebab-case' },
      ],
      // Design-system code has no legacy: `any` is an error, not a warning.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
