// @ts-check
const { defineConfig } = require('eslint/config');
const rootConfig = require('../../eslint.config.js');

module.exports = defineConfig([
  ...rootConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Docs-only components (stories/) use the ems- prefix.
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ems', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
