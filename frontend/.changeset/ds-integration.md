---
'@ems/tokens': minor
'@ems/icons': minor
'@ems/ui': minor
---

Design-system integration pass (Daylight, end of Phase A).

- `@ems/tokens`: `layout.*`, `size.*`, `breakpoint.*` (with generated `BREAKPOINTS` /
  `MEDIA_QUERIES`), `color.status.neutral.*` and `color.skeleton.*`; the dark scrim is lighter so
  dialogs read as a raised layer.
- `@ems/icons`: `size` takes the icon scale (`sm | md | lg`) and inherits `--ui-icon-size` when
  omitted; `STATUS_ICONS`; bell, copy, inbox, key, layout-grid, list, lock, panel-left, arrow and
  wifi-off glyphs.
- `@ems/ui`: every component uses `ui-icon` (no inlined SVG) and contract tokens only (checked by
  `npm run ds:lint-css`): one focus ring, shared control heights, radii per role, one disabled and
  one invalid treatment, dialogs and drawers on `bg-raised`, one breakpoint pair (900 / 640px).
  Dialogs (md, lg) go full screen below 640px; the app shell bounds content at
  `layout-content-max-width`. Peer dependencies: `@angular/cdk ^21.2.14`, `@angular/forms`,
  `@ems/icons`, `@ems/tokens`, `rxjs`. `EMS_UI_ENTRY_POINTS` lists every entry point.
