/*
 * Public API surface of @ems/ui (primary entry point).
 *
 * Components live in secondary entry points so apps only bundle what they import, e.g.
 * `import { Button } from '@ems/ui/button'`. The catalogue (selector, purpose, a11y pattern) is in
 * projects/README.md. Global styles ship as CSS: @ems/ui/styles/index.css (cascade layers).
 */

/**
 * Every secondary entry point. `npm run ds:lint-css` fails if this list and the folders with an
 * ng-package.json drift apart.
 */
export const EMS_UI_ENTRY_POINTS = [
  '@ems/ui/alert',
  '@ems/ui/app-shell',
  '@ems/ui/avatar',
  '@ems/ui/button',
  '@ems/ui/card',
  '@ems/ui/checkbox',
  '@ems/ui/data-table',
  '@ems/ui/description-list',
  '@ems/ui/dialog',
  '@ems/ui/drawer',
  '@ems/ui/empty-state',
  '@ems/ui/error-state',
  '@ems/ui/filter-pill',
  '@ems/ui/form-field',
  '@ems/ui/input',
  '@ems/ui/menu',
  '@ems/ui/nav-item',
  '@ems/ui/page-header',
  '@ems/ui/pagination',
  '@ems/ui/password-input',
  '@ems/ui/person-card',
  '@ems/ui/search-input',
  '@ems/ui/select',
  '@ems/ui/skeleton',
  '@ems/ui/spinner',
  '@ems/ui/status-pill',
  '@ems/ui/switch',
  '@ems/ui/tabs',
  '@ems/ui/tag',
  '@ems/ui/theme',
  '@ems/ui/toast',
  '@ems/ui/tooltip',
  '@ems/ui/view-toggle',
] as const;

export type EmsUiEntryPoint = (typeof EMS_UI_ENTRY_POINTS)[number];
