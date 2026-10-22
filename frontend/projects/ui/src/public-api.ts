/*
 * Public API surface of @ems/ui (primary entry point).
 *
 * Components live in secondary entry points so apps only bundle what they import:
 *   @ems/ui/button   Button (button[uiButton], a[uiButton])
 *   @ems/ui/theme    ThemeService, THEME_NO_FLASH_SCRIPT
 * Global styles ship as CSS: @ems/ui/styles/index.css (cascade layers, reset, base).
 */
export type EmsUiEntryPoint = '@ems/ui/button' | '@ems/ui/theme';
