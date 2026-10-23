# @ems/ui

EMS Angular component library: standalone, signal inputs, `OnPush`, one secondary entry point per
component, styles from `@ems/tokens` only.

| Entry point                | Exports                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `@ems/ui/button`           | `Button` (`button[uiButton]`, `a[uiButton]`)                 |
| `@ems/ui/theme`            | `ThemeService`, `THEME_NO_FLASH_SCRIPT`, `THEME_STORAGE_KEY` |
| `@ems/ui/styles/index.css` | global stylesheet (cascade layers, reset, base, utilities)   |

See `frontend/projects/README.md` for the architecture and the component definition of done.
