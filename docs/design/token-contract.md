# Daylight token contract (CSS custom properties)

Fixed names that the foundation (tokens) and every component agree on, so components can be built in
parallel with the token values. DTCG path `a.b.c` becomes `--ems-a-b-c`. Components use ONLY these
(semantic + component tier), never primitives or raw colours. Themes switch via
`[data-theme="dark"]` / `prefers-color-scheme` on `<html>`; components never branch on theme.

| Group | Variables |
|---|---|
| Surfaces | `--ems-color-bg-canvas`, `-surface` (cards), `-sunken`, `-raised` (popovers), `-overlay` (scrim), `-inverse` |
| Text | `--ems-color-text-primary`, `-secondary`, `-muted`, `-inverse`, `-on-accent`, `-link` |
| Borders | `--ems-color-border-subtle` (dividers), `-default` (controls, ≥3:1), `-strong`, `-focus` |
| Accent (indigo) | `--ems-color-accent-solid`, `-solid-hover`, `-solid-active`, `-on-solid`, `-soft`, `-soft-hover`, `-soft-text` |
| Status | `--ems-color-status-{success,warning,danger,info}-{text,bg,border,solid,on-solid}`, `--ems-color-status-neutral-{bg,text,border}` (tags, neutral pills) |
| Skeleton | `--ems-color-skeleton-{base,highlight}` (decorative loading shapes) |
| Employee status | `--ems-color-employee-status-{active,pending,inactive,archived}-{bg,text}` |
| Avatar tints | `--ems-color-avatar-{1..6}-{bg,text}` (department pastel) |
| Elevation (box-shadow) | `--ems-elevation-card`, `-raised`, `-overlay`, `-focus` |
| Radius | `--ems-radius-sm` (6), `-md` (10), `-lg` (12), `-xl` (14), `-pill` |
| Border width | `--ems-border-width-hairline` (1px) |
| Controls | `--ems-control-{sm,md,lg}-height` (32 / 40 / 48px), `--ems-icon-size-{sm,md,lg}` (16 / 20 / 24px) |
| Spacing (4-pt) | `--ems-space-{0,1,2,3,4,5,6,8,10,12,16}` (`space-1` = 4px) |
| Motion | `--ems-duration-{fast,base,slow}`, `--ems-easing-{standard,emphasized}` |
| Layers | `--ems-z-{dropdown,sticky,overlay,modal,toast}` (the CDK overlay container sits on `z-overlay`; toasts above it) |
| Focus ring | `--ems-focus-ring-{color,width,offset}`: the `:focus-visible` outline of every non-text control |
| Layout | `--ems-layout-sidebar-width` (232px), `-sidebar-collapsed-width` (72px), `-drawer-width` (288px, app-shell drawer), `-topbar-height` (68px), `-content-max-width` (1120px) |
| Sizes | `--ems-size-dialog-{sm,md,lg}` (416 / 512 / 704px), `--ems-size-drawer-{md,lg}` (480 / 640px side sheets), `--ems-size-tooltip-max-width` (256px), `--ems-size-popover-min-width` (192px) |
| Breakpoints | `--ems-breakpoint-{narrow,compact}` (640 / 900px): reference only, see below |
| Fonts | `--ems-font-family-sans` (Plus Jakarta Sans), `--ems-font-family-mono` (Geist Mono) |
| Type roles | `--ems-type-{display,title,headline,body,body-strong,label,caption,mono}-{size,weight,line-height,letter-spacing}` |
| Button (component) | `--ems-button-{primary,secondary,ghost,danger}-{bg,bg-hover,fg,border}`, `--ems-button-{sm,md,lg}-{height,padding-inline,font-size}`, `--ems-button-radius` |

Primitive ramps are named by hue (`--ems-color-indigo-500`, `--ems-color-neutral-100`, …) and are for
the token build only.

## Breakpoints

Custom properties cannot be used inside `@media`, so each breakpoint is one documented constant in
two forms: TS code imports `BREAKPOINTS` / `MEDIA_QUERIES` from `@ems/tokens` (generated from
`breakpoint.*`), and CSS repeats the literal query with a comment naming the token.

| Token | Width | CSS query (below the width) | Used for |
|---|---|---|---|
| `breakpoint.compact` | 900px | `(max-width: 899.98px)` | app-shell sidebar becomes the off-canvas drawer |
| `breakpoint.narrow` | 640px | `(max-width: 639.98px)` | dialogs and drawers full screen, data-table card mode, toasts full width |

`npm run ds:lint-css` rejects any other width in a component `@media` query.

## Changelog

- **Integration pass (Slice DS, Phase A):** added `color.status.neutral.*`, `color.skeleton.*`,
  `layout.*`, `size.*` and `breakpoint.*`. The dark `bg.overlay` scrim is lighter
  (`oklch(12% 0.02 272 / 0.5)`, was 8% at 0.6) so a dialog on `bg.raised` reads as a layer above
  the page rather than a panel floating in black.
