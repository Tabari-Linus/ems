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
| Status | `--ems-color-status-{success,warning,danger,info}-{text,bg,border,solid,on-solid}` |
| Employee status | `--ems-color-employee-status-{active,pending,inactive,archived}-{bg,text}` |
| Avatar tints | `--ems-color-avatar-{1..6}-{bg,text}` (department pastel) |
| Elevation (box-shadow) | `--ems-elevation-card`, `-raised`, `-overlay`, `-focus` |
| Radius | `--ems-radius-sm` (6), `-md` (10), `-lg` (12), `-xl` (14), `-pill` |
| Border width | `--ems-border-width-hairline` (1px) |
| Controls | `--ems-control-{sm,md,lg}-height` (32 / 40 / 48px), `--ems-icon-size-{sm,md,lg}` (16 / 20 / 24px) |
| Spacing (4-pt) | `--ems-space-{0,1,2,3,4,5,6,8,10,12,16}` (`space-1` = 4px) |
| Motion | `--ems-duration-{fast,base,slow}`, `--ems-easing-{standard,emphasized}` |
| Layers | `--ems-z-{dropdown,sticky,overlay,modal,toast}` |
| Fonts | `--ems-font-family-sans` (Plus Jakarta Sans), `--ems-font-family-mono` (Geist Mono) |
| Type roles | `--ems-type-{display,title,headline,body,body-strong,label,caption,mono}-{size,weight,line-height,letter-spacing}` |
| Button (component) | `--ems-button-{primary,secondary,ghost,danger}-{bg,bg-hover,fg,border}`, `--ems-button-{sm,md,lg}-{height,padding-inline,font-size}`, `--ems-button-radius` |

Primitive ramps are named by hue (`--ems-color-indigo-500`, `--ems-color-neutral-100`, …) and are for
the token build only.
