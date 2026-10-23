import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from './theme.service';

/**
 * Inline script for `<head>` in index.html, before any stylesheet, so a stored light/dark choice
 * is applied before first paint (no flash of the wrong theme). `system` needs no script: the
 * `prefers-color-scheme` media query in tokens.css handles it.
 *
 * ```html
 * <script>
 *   (function () {
 *     try {
 *       var t = localStorage.getItem('ems-theme');
 *       if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
 *     } catch (e) {}
 *   })();
 * </script>
 * ```
 *
 * With a Content-Security-Policy, allow it by hash (`script-src 'sha256-…'`), computed over the
 * exact script text as it appears in index.html (whitespace included), rather than with
 * `'unsafe-inline'`. The EMS app does this in docker/40-ems-runtime-config.sh and guards the
 * hash with src/theme-no-flash.spec.ts.
 */
export const THEME_NO_FLASH_SCRIPT = `(function () {
  try {
    var t = localStorage.getItem('${THEME_STORAGE_KEY}');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('${THEME_ATTRIBUTE}', t);
  } catch (e) {}
})();`;
