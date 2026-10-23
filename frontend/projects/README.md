# EMS design system (`frontend/projects/`)

Three packages, built and versioned independently, consumed by the app through path mappings
(from source in development) so the design system can later leave the repo unchanged. Spec:
`docs/spec-and-plan.md` §2.6 and Slice DS.

> **Status (Slice DS foundation): Daylight.** Direction D, "Daylight" (decision D30): clean,
> light-first, friendly HR software with one indigo accent. Approved reference:
> `docs/design/direction-board/direction-d.html`. Rules: `docs/design/redesign-plan.md`. The CSS
> variable names are fixed in `docs/design/token-contract.md`; components build against those.

| Package       | Path               | What                                                            | Build                                  |
| ------------- | ------------------ | --------------------------------------------------------------- | -------------------------------------- |
| `@ems/tokens` | `projects/tokens/` | W3C DTCG tokens → CSS custom properties, TS, JSON               | Style Dictionary 5 + `ng build tokens` |
| `@ems/icons`  | `projects/icons/`  | `ui-icon` over a curated Lucide set (`@lucide/angular`)         | `ng build icons` (ng-packagr, APF)     |
| `@ems/ui`     | `projects/ui/`     | Angular components, one secondary entry point each + global CSS | `ng build ui` (ng-packagr, APF)        |

```text
projects/
├── tokens/
│   ├── tokens/{primitive,foundation,semantic,component}/*.json   DTCG sources (edit these)
│   ├── contrast-pairs.json                             pairs the contrast gate checks
│   ├── scripts/build-tokens.mjs                        Style Dictionary build
│   ├── scripts/check-contrast.mjs                      WCAG gate (culori)
│   ├── src/generated/tokens.{css,ts,json}              build output (committed, do not edit)
│   └── stories/                                        Foundations pages (generated from tokens.json)
├── icons/src/{icon.ts,registry.ts}
└── ui/
    ├── styles/{index,fonts,reset,base,overlay,utilities}.css   global stylesheet (cascade layers)
    ├── <name>/src/                                     @ems/ui/<name>, one per component (catalogue below)
    ├── src/public-api.ts                               EMS_UI_ENTRY_POINTS (every entry point)
    ├── patterns/                                       composed page stories (Home, People) + demo chrome
    ├── testing/keyboard.ts                             shared keydown helper for specs and play functions
    └── scripts/lint-css.mjs                            `npm run ds:lint-css`
```

## Commands (run in `frontend/`)

| Command                         | Does                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run tokens:build`          | DTCG sources → `projects/tokens/src/generated/`                                                            |
| `npm run tokens:check`          | rebuild and fail if the committed output is stale (CI)                                                     |
| `npm run tokens:check-contrast` | contrast table for every declared pair, both themes; exit 1 on a failure                                   |
| `npm run ds:lint-css`           | tokens-only gate for component CSS and inline styles (see "Tokens-only CSS lint")                          |
| `npm run lib:build`             | tokens → icons → ui into `dist/{tokens,icons,ui}`                                                          |
| `npm run lib:test`              | Vitest unit tests for ui and icons, coverage gate 90% lines                                                |
| `npm run storybook`             | docs site on http://localhost:6006 (light/dark toolbar toggle)                                             |
| `npm run storybook:build`       | static site in `storybook-static/`                                                                         |
| `npm run storybook:test`        | every story in Chromium, **light and dark**: render + `play` + axe (any violation fails)                   |
| `npm run test:visual`           | Playwright screenshots of every component and pattern story, light + dark, + axe (needs `storybook:build`) |
| `npm run changeset`             | record a change to a package (Changesets)                                                                  |

Playwright needs Chromium once: `npx playwright install chromium`.

## Tokens

### Tiers

1. **Primitive** (`tokens/primitive/`): raw material for the build only. Colour ramps in OKLCH named
   by hue (`color.neutral.*` indigo-tinted at hue 272, `color.indigo.*`, `color.{green,amber,red,blue}.*`,
   `color.pastel.{indigo,rose,sky,mint,sand,lime}.*`, `color.scrim.*`, `color.transparent`), literal
   shadow stacks (`shadow.{light,dark}.*`) and type scales (`font.size.<px>`, `font.weight.*`,
   `font.line-height.*`, `font.tracking.*`). **Components never use these.**
2. **Foundation** (`tokens/foundation/`): theme-independent scales that components **may** use:
   `space.*`, `radius.*`, `border-width.*`, `duration.*`, `easing.*`, `z.*`, `font.family.*`.
   Emitted once on `:root`.
3. **Semantic** (`tokens/semantic/`): roles. `light.json` and `dark.json` must declare exactly the
   same paths (the build fails otherwise): `color.*` roles and `elevation.*`. `base.json` holds
   theme-independent roles (`focus.ring.*`, `control.*`, `motion.*`, `type.*`) and is part of both
   theme builds, so a reference like `focus.ring.color` still resolves per theme.
4. **Component** (`tokens/component/`): per-component decisions that reference semantic tokens,
   e.g. `button.primary.bg → {color.accent.solid}`.

### Catalogue (what to use when)

All names below are CSS variables, `--ems-` + the dotted path with dashes.

| Group           | Tokens                                                                                                                                               | Use                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Surfaces        | `color-bg-canvas`                                                                                                                                    | the page behind everything (faint indigo tint)                                                              |
|                 | `color-bg-surface`                                                                                                                                   | cards, panels, inputs, sidebar (white in light)                                                             |
|                 | `color-bg-sunken`                                                                                                                                    | wells inside a card: tracks, notes, segmented controls, row hover                                           |
|                 | `color-bg-raised`                                                                                                                                    | menus, popovers, dialogs, drawers (lighter than surface in dark)                                            |
|                 | `color-bg-overlay`                                                                                                                                   | translucent scrim behind modal layers                                                                       |
|                 | `color-bg-inverse`                                                                                                                                   | tooltips, toasts (with `color-text-inverse`)                                                                |
| Text            | `color-text-primary` / `-secondary` / `-muted`                                                                                                       | content / supporting lines / meta and hints. All ≥ 4.5:1 on every surface                                   |
|                 | `color-text-link`                                                                                                                                    | inline links, ghost buttons                                                                                 |
|                 | `color-text-on-accent`                                                                                                                               | text on `color-accent-solid`                                                                                |
|                 | `color-text-disabled`                                                                                                                                | disabled controls only (exempt from contrast)                                                               |
| Borders         | `color-border-subtle`                                                                                                                                | dividers (decorative, not a boundary)                                                                       |
|                 | `color-border-default`                                                                                                                               | control outlines: inputs, selects, filter pills (≥ 3:1)                                                     |
|                 | `color-border-strong`                                                                                                                                | hovered control outline                                                                                     |
|                 | `color-border-focus`                                                                                                                                 | focus ring and focused-field outline (≥ 3:1)                                                                |
| Accent          | `color-accent-solid` (+ `-hover`, `-active`, `-on-solid`)                                                                                            | the one primary action, the current nav item, badges                                                        |
|                 | `color-accent-soft` (+ `-hover`, `-soft-text`)                                                                                                       | selected tabs, filters, secondary buttons, counts, icon tiles                                               |
| Status          | `color-status-{success,warning,danger,info}-{text,bg,border,solid,solid-hover,on-solid}`                                                             | alerts, toasts, validation; always with an icon and words                                                   |
| Employee status | `color-employee-status-{active,pending,inactive,archived}-{bg,text}`                                                                                 | status pills, with a dot shape and the word                                                                 |
| Avatars         | `color-avatar-{1..6}-{bg,text}`                                                                                                                      | department pastel tint for initials avatars; the only place department colour appears                       |
| Selection       | `color-selection-bg`                                                                                                                                 | `::selection`                                                                                               |
| Elevation       | `elevation-card` / `-raised` / `-overlay`                                                                                                            | box-shadow for cards / menus, popovers / dialogs, drawers                                                   |
|                 | `elevation-focus`                                                                                                                                    | outer glow around a focused text field (with a `color-border-focus` outline)                                |
| Radius          | `radius-sm` 6 · `radius-md` 10 · `radius-lg` 12 · `radius-xl` 14 · `radius-pill`                                                                     | tags · inputs · inner panels, menus · cards, dialogs · buttons, filters, tabs, pills, avatars               |
| Space           | `space-{0,1,2,3,4,5,6,8,10,12,16}`                                                                                                                   | 4-pt scale, `space-N` = N × 4px                                                                             |
| Lines           | `border-width-hairline` (1px), `border-width-thick` (2px)                                                                                            | dividers and outlines; focus ring                                                                           |
| Motion          | `duration-{fast,base,slow}` (120/180/240 ms), `easing-{standard,emphasized}`                                                                         | colour/hover: fast + standard; overlays entering: base/slow + emphasized                                    |
| Layers          | `z-{sticky,dropdown,overlay,modal,toast}`                                                                                                            | 100 / 900 / 1000 (CDK overlay container) / 1100 / 1200                                                      |
| Fonts           | `font-family-sans` (Plus Jakarta Sans), `font-family-mono` (Geist Mono)                                                                              | everything / employee numbers, codes, dates, counts (tabular)                                               |
| Type roles      | `type-{display,title,headline,body,body-strong,label,caption,mono}-{size,weight,line-height,letter-spacing}`                                         | see below; or the `.ui-type-<role>` utility class                                                           |
| Focus           | `focus-ring-{color,width,offset}`                                                                                                                    | `:focus-visible` outline (already global)                                                                   |
| Controls        | `control-{sm,md,lg}-height` (32/40/48px), `control-border-width`, `control-min-target` (24px)                                                        | buttons, inputs, selects and pills share heights so a filter bar lines up; outlines; WCAG 2.5.8 target size |
| Icons           | `icon-size-{sm,md,lg}` (16/20/24px)                                                                                                                  | in buttons and meta lines / nav, icon buttons, inputs / empty states                                        |
| Neutral status  | `color-status-neutral-{bg,text,border}`                                                                                                              | tags, neutral status pills                                                                                  |
| Skeleton        | `color-skeleton-{base,highlight}`                                                                                                                    | loading shapes pulse between the two (decorative)                                                           |
| Layout          | `layout-sidebar-width` 232 · `-sidebar-collapsed-width` 72 · `layout-drawer-width` 288 · `layout-topbar-height` 68 · `layout-content-max-width` 1120 | the app shell                                                                                               |
| Sizes           | `size-dialog-{sm,md,lg}` 416/512/704 · `size-drawer-{md,lg}` 480/640 · `size-tooltip-max-width` 256 · `size-popover-min-width` 192                   | overlay widths                                                                                              |
| Breakpoints     | `breakpoint-{narrow,compact}` 640/900 (reference only; `BREAKPOINTS` / `MEDIA_QUERIES` in TS)                                                        | compact: shell drawer; narrow: full-screen dialogs/drawers, table cards, full-width toasts                  |

| Type role     | Size / weight / line-height / tracking | For                                                                      |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| `display`     | 46 / 800 / 1.05 / −0.045em             | the Home greeting only                                                   |
| `title`       | 28 / 800 / 1.15 / −0.035em             | page titles, the name on a profile (h1)                                  |
| `headline`    | 17 / 700 / 1.3 / −0.01em               | section, card and dialog titles                                          |
| `body`        | 15 / 400 / 1.55                        | running text, table cells                                                |
| `body-strong` | 15 / 600 / 1.55                        | names and values inside body text                                        |
| `label`       | 14 / 600 / 1.2                         | buttons, nav items, tabs, form labels                                    |
| `caption`     | 13 / 500 / 1.4                         | hints, meta lines, timestamps, table headers                             |
| `mono`        | 13 / 500 / 1.4 (Geist Mono)            | employee numbers, codes, dates; add `font-variant-numeric: tabular-nums` |

Storybook → **Foundations** shows all of this generated from `tokens.json`: Colour (both themes
side by side, with every contrast ratio), Typography, Space and shape, Motion, Token reference.

### Output

`tokens.css` (all names prefixed `--ems-`, everything inside `@layer tokens`):

- primitives and foundation scales on `:root`, with an sRGB hex fallback block for colours under
  `@supports not (color: oklch(0% 0 0))` (Style Dictionary's `color/hex` transform, gamut-mapped);
- light semantic + component tokens on `:root, [data-theme='light']`;
- dark on `[data-theme='dark']` and under `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`.

Semantic and component tokens are emitted as `var(--ems-…)` references, so only primitives carry
literal values. Component tokens are re-declared in every theme block because a custom property's
`var()` is resolved on the element that declares it; this also makes nested `[data-theme]`
scopes work. Shadows use DTCG `shadow` (layered arrays, `inset` supported).

`tokens.json` and `tokens.ts` (`tokens`, `cssVar(name)`, `TokenName`) list every token with its
CSS variable, tier and resolved value(s) per theme (OKLCH and hex), plus the referenced token.

### Add or change a token

1. Check `docs/design/token-contract.md`: add names, never rename or drop contract names.
2. Edit the DTCG JSON (`$value`, `$type`; colours as
   `{ "colorSpace": "oklch", "components": [L, C, H] }`, dimensions as `{ "value": 1, "unit": "rem" }`).
   New semantic colour: add it to **both** `light.json` and `dark.json`.
3. If it is a foreground/background or boundary pair, add it to `contrast-pairs.json`
   (`text` 4.5:1, `large-text` 3:1, `ui` 3:1).
4. `npm run tokens:build && npm run tokens:check-contrast`, then commit the sources **and**
   `src/generated/`.
5. Add a changeset (`npm run changeset`) for `@ems/tokens`.

## Global styles (`@ems/ui/styles/index.css`)

Load order in an app: `tokens.css`, then `ui/styles/index.css`, then app styles (see
`angular.json`). Layers, lowest precedence first: `reset, tokens, base, components, utilities`.
Unlayered CSS beats every layer, which is why the legacy `src/styles.scss` still wins everywhere
it has an opinion. The reset deliberately omits `display: block` on media and `font: inherit` on
form controls, and `base.css` gives headings no type role, for the same reason.

| File                | What                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fonts.css`         | `@font-face` for Plus Jakarta Sans (variable 200–800, latin + latin-ext) and Geist Mono (variable, latin), `font-display: swap`, from `@fontsource-variable/*` (the bundler copies the woff2 files; no third-party requests). Metric-matched local fallbacks (`… Fallback`: Arial / Courier New with `size-adjust` and ascent/descent overrides from Capsize) limit layout shift on swap. |
| `reset.css`         | minimal reset (`@layer reset`)                                                                                                                                                                                                                                                                                                                                                            |
| `base.css`          | body type and colours from tokens, `color-scheme` per theme, `:focus-visible` ring, `::selection`, scrollbar colour, `prefers-reduced-motion`, `forced-colors`                                                                                                                                                                                                                            |
| `overlay.css` + CDK | Angular CDK `overlay-prebuilt.css` and `a11y-prebuilt.css` (in `@layer components`), `.cdk-overlay-container` on `z-overlay`, and `.ui-overlay-backdrop` (scrim) / `.ui-overlay-panel` (raised surface) to pass as `backdropClass` / `panelClass`                                                                                                                                         |
| `utilities.css`     | `.ui-visually-hidden`, `.ui-type-<role>`, `.ui-tabular`                                                                                                                                                                                                                                                                                                                                   |

## Theming (`@ems/ui/theme`)

`ThemeService.theme` (`light | dark | system`), `resolved` (`light | dark`), `setTheme()`.
`light`/`dark` set `<html data-theme>` and persist in `localStorage` (`ems-theme`); `system`
removes the attribute so the media query decides. Storage errors are ignored.

The app has the no-flash snippet (`THEME_NO_FLASH_SCRIPT`) inline in `<head>` of
`src/index.html`. The production CSP (`docker/40-ems-runtime-config.sh`) allows it by hash
(`script-src 'self' 'sha256-…'`), and `src/theme-no-flash.spec.ts` recomputes the hash from
`index.html` and fails if the CSP is stale. **If you touch that script (even whitespace), update
`THEME_SCRIPT_HASH`**; the failing test prints the expected value. The legacy pages still follow the
OS theme until they move to the design system.

## Icons (`@ems/icons`)

`<ui-icon name="search" />` is decorative (`aria-hidden`); `<ui-icon name="circle-alert" label="Error" />`
is `role="img"` with an accessible name. Only icons listed in `EMS_ICONS` (`registry.ts`) are
bundled; add one by importing its `Lucide<Name>` class there. Brand glyphs can be added as
`LucideIconData` objects.

Size with `size="sm|md|lg"` (the icon-size tokens), a px number or any CSS length. Without `size`
the icon takes `--ui-icon-size` from its context, which is how components size what they project:
`uiButton` sets `sm`, nav items `md`, empty states `lg`. `--ui-icon-stroke-width` overrides the
stroke (checkbox mark: 3). `STATUS_ICONS` maps a status tone to its one icon (alerts, toasts).

`@ems/ui` imports `@ems/icons` and `@ems/tokens` like any consumer. The library build resolves them
to `dist/` (`projects/ui/tsconfig.lib.json`; `npm run lib:build` builds tokens → icons → ui): a TS
path to another package's **sources** makes ng-packagr compile them inside a secondary entry point,
which crashes with "Cannot destructure property 'pos' of 'file.referencedFiles[index]'". The app,
unit tests and Storybook keep the source mappings.

## Component catalogue (`@ems/ui/<entry>`)

| Entry point        | Selector(s)                                                | Purpose                                               | Accessibility pattern                                                      |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| `button`           | `button[uiButton]`, `a[uiButton]`                          | primary / secondary / ghost / danger actions, loading | native button/link; `aria-disabled`, `aria-busy`                           |
| `form-field`       | `ui-form-field`                                            | label, hint, error, required for one control          | `<label for>`, `aria-describedby`, error `role="alert"` on submit          |
| `input`            | `input[uiInput]`, `textarea[uiInput]`, `ui-input-group`    | text entry, with leading/trailing slots               | native input; `aria-invalid`                                               |
| `select`           | `ui-select`, `select[uiSelect]`                            | single select (CDK listbox) and styled native select  | APG select-only combobox + listbox                                         |
| `checkbox`         | `ui-checkbox`                                              | boolean / indeterminate choice                        | native checkbox                                                            |
| `switch`           | `ui-switch`                                                | instant on/off setting                                | native checkbox `role="switch"`                                            |
| `password-input`   | `ui-password-input`                                        | password with reveal and strength meter               | toggle button `aria-pressed`; strength as text                             |
| `search-input`     | `ui-search-input`                                          | debounced search, ⌘K shortcut, clear                  | `type="search"`, `aria-keyshortcuts`                                       |
| `filter-pill`      | `ui-filter-pill`                                           | "Office · All" filter, single or multiple             | button + CDK listbox popup (APG listbox)                                   |
| `view-toggle`      | `ui-view-toggle`                                           | grid / list switch                                    | APG radio group (roving tabindex)                                          |
| `alert`            | `ui-alert`                                                 | inline notice with icon, heading, actions, dismiss    | `role="alert"` (danger/warning) or `status`; `live="off"` for page content |
| `toast`            | `ToastService`, `ui-toaster`                               | transient confirmation with optional action           | labelled region + polite live region; Escape closes; timers pause on focus |
| `spinner`          | `ui-spinner`                                               | indeterminate progress                                | `role="status"` with a label, else `aria-hidden`                           |
| `skeleton`         | `ui-skeleton`                                              | loading placeholders (lines, avatar, card)            | `aria-hidden`; the region carries `aria-busy`                              |
| `empty-state`      | `ui-empty-state`                                           | nothing here yet, invite the next action              | heading + text; action is a real button/link                               |
| `error-state`      | `ui-error-state`                                           | 403 / 404 / 500 / offline with one recovery action    | focusable heading (`focus()` after rendering)                              |
| `status-pill`      | `ui-status-pill`                                           | employee status or tone: dot shape + label            | text label (colour never alone)                                            |
| `tag`              | `ui-tag`                                                   | short metadata, optionally removable                  | remove button "Remove {label}"                                             |
| `dialog`           | `DialogService`, `ui-dialog`, confirm                      | modal task or yes/no question                         | APG dialog (modal) on CDK Dialog; focus trap and restore; Escape           |
| `drawer`           | `DrawerService`, `ui-drawer`                               | side sheet for create/edit forms                      | APG dialog (modal) on CDK Dialog                                           |
| `menu`             | `[uiMenuTrigger]`, `ui-menu`, `button[uiMenuItem]`         | actions menu, user menu                               | APG menu button on CDK Menu                                                |
| `tooltip`          | `[uiTooltip]`                                              | short label for an icon-only control                  | `aria-describedby`; hover + focus; Escape                                  |
| `nav-item`         | `a[uiNavItem]`                                             | sidebar link with badge count                         | link, `aria-current="page"`                                                |
| `tabs`             | `ui-tabs` (in-page), `nav[uiTabNav]` + `a[uiTab]` (routed) | pill tabs                                             | APG tabs (in-page) / links with `aria-current` (routed)                    |
| `pagination`       | `ui-pagination`                                            | previous/next with summary, or "load more"            | `<nav>` with a label; live summary                                         |
| `avatar`           | `ui-avatar`                                                | initials on department pastel, photo, status dot      | `role="img"` with the name, or `decorative`                                |
| `person-card`      | `a[uiPersonCard]`                                          | directory grid card                                   | one link; status projected                                                 |
| `data-table`       | `ui-data-table` + `DATA_TABLE` column directives           | table with templates, sort UI, row actions, card mode | native `<table>`, `aria-sort`, activatable rows                            |
| `description-list` | `dl[uiDescriptionList]`, `div[uiDescriptionItem]`          | label/value pairs, copyable values                    | native `<dl>`; copy feedback in `role="status"`                            |
| `app-shell`        | `ui-app-shell`                                             | sidebar + top bar + main                              | skip link, landmarks, modal drawer below 900px                             |
| `page-header`      | `ui-page-header`                                           | page title (h1), count, description, actions          | heading level input                                                        |
| `card`             | `ui-card`                                                  | titled section card with count, actions, footer       | heading level input                                                        |
| `theme`            | `ThemeService`, `THEME_NO_FLASH_SCRIPT`                    | light / dark / system                                 | `color-scheme`, `prefers-color-scheme`                                     |

The list of entry points is `EMS_UI_ENTRY_POINTS` in `ui/src/public-api.ts` (`ds:lint-css` checks it).

### Usage rules

- **One family per role.** Controls are 40px (`control-md-height`, 32 for `sm`) with `radius-md`
  (text fields) or `radius-pill` (buttons, filters, search, tabs, status pills); cards `radius-xl`;
  floating panels `radius-lg` with `radius-md` items; tags `radius-sm`.
- **Focus.** Non-text controls use the `focus-ring-*` outline; text fields (input, select, the
  search/password group) show `border-focus` + `elevation-focus` instead.
- **Disabled** controls: `bg-sunken`, `border-subtle`, `text-disabled`, `cursor: not-allowed`.
  **Invalid**: `status-danger-border` outline plus a `ui-form-field` error with the icon and words.
- **Icon-only buttons** are round, `accent-soft` on hover, and always have an `aria-label`.
- **Overlays** render in the CDK overlay container (`z-overlay`) on `bg-raised` with `elevation-raised`
  (menus, listboxes) or `elevation-overlay` (dialogs, drawers) over the `bg-overlay` scrim; the
  toaster is above them (`z-toast`), the shell's top bar below (`z-sticky`).
- **Motion**: colour changes `duration-fast` + `easing-standard`; overlays entering `duration-base`
  (drawers `slow`) + `easing-emphasized` (drawers stay `standard`: no overshoot at a screen edge).
- One primary (`accent-solid`) action per view; stories import sibling entry points as
  `@ems/ui/<entry>`, never by relative path.

### Compose a page

```html
<ui-app-shell>
  <a uiShellBrand href="/">…</a>
  <ng-container uiShellNav>
    <a uiNavItem routerLink="/people" routerLinkActive ariaCurrentWhenActive="page">
      <ui-icon uiNavIcon name="users" /> People
    </a>
  </ng-container>
  <ui-search-input uiShellSearch placeholder="Search people, offices, requests" shortcut />
  <button uiShellUser type="button" [uiMenuTrigger]="userMenu">…</button>

  <ui-page-header title="People" count="9 people">
    <button uiPageHeaderActions uiButton><ui-icon name="plus" /> Add person</button>
  </ui-page-header>
  <ui-card flush>
    <ui-data-table caption="People" [rows]="people">…</ui-data-table>
    <ui-pagination uiCardFooter … />
  </ui-card>
</ui-app-shell>
<ui-toaster />
```

The shell bounds the page at `layout-content-max-width`. Storybook → **Patterns** has the two
reference pages (Home, People directory), built only from these components with Akwaaba Labs data;
their chrome lives in `ui/patterns/chrome.ts`.

### Tokens-only CSS lint

`npm run ds:lint-css` (CI, design-system job) reads every component stylesheet and inline `styles:`
block under `projects/{ui,icons}/**/src` and rejects: raw colours (hex, `rgb()`, `oklch()`, named),
literal `px`/`rem`/`em`/`ms`/`s` values (zero is fine), numeric `z-index`, `!important`, `--ems-*`
names that are not tokens or are primitives, and `@media` widths other than the breakpoint queries.
When a literal is unavoidable, say why on the line or the line above:
`/* ds-lint-allow: visually hidden */`.

### Tests

Specs and `play` functions dispatch CDK-handled keys with `press()` from `ui/testing/keyboard.ts`
(CDK key managers read the legacy `keyCode`, which `userEvent` leaves at 0). Storybook pre-bundles
every dependency the stories import (`PREBUNDLED_DEPS` in `.storybook/main.ts`), so the first
`storybook:test` on a cold Vite cache does not re-optimise and reload mid-run.

## Design rules that apply to every component

From `docs/design/redesign-plan.md` (Daylight):

- **Calm by default.** White cards on the faint canvas, separated by `elevation-card`, not
  borders. No gradients, decoration or illustrations. Boldness lives in one place (the Home greeting).
- **Type carries the personality.** Use the type roles; 800 only for `display`/`title`. Geist Mono
  with tabular numerals for employee numbers, codes, dates and counts. Sentence case.
- **Indigo is the next step.** `accent-solid` only for the one primary action per view and the
  current nav item; selected tabs, filters and secondary actions use `accent-soft`. Pills for
  buttons, filters and tabs. Department colour only as avatar tints. Status pills pair colour with
  a dot shape and a label.
- **Copy from the employee's side.** People (not Staff), Requests, Access levels. Buttons say what
  happens ("Add person", "Save changes", "Approve", "Decline"); errors say what went wrong and how
  to fix it; empty states invite the next action.
- **Quality floor.** Tokens only, both themes designed, WCAG 2.2 AA, visible focus, keyboard paths,
  reduced motion, responsive to 360px, no horizontal page scroll.
- **Critique visually.** Screenshot in light and dark, look, and remove one accessory before handing back.

## Add a component (definition of done)

1. **Entry point**: `projects/ui/<name>/ng-package.json` + `src/public-api.ts`; import it as
   `@ems/ui/<name>`. Standalone, `ChangeDetectionStrategy.OnPush`, signal APIs
   (`input()`, `model()`, `output()`), host bindings in `host: {}` (no `@HostBinding`/`@HostListener`).
   Prefer enhancing native elements (attribute selectors) where semantics come for free; behaviour
   for complex widgets on Angular CDK (`@angular/cdk` is a peer dependency of `@ems/ui`).
2. **Tokens-only styling**: the component stylesheet is wrapped in `@layer components` and uses
   only `--ems-*` **foundation, semantic or component** tokens from the catalogue above (add
   component tokens in `tokens/component/<name>.json` when a decision is component-specific). No
   raw colours, no primitives, no `!important`; logical properties; `prefers-reduced-motion` and
   `forced-colors` handled; 24×24 px minimum target.
3. **Accessibility**: follow the WAI-ARIA APG pattern for the widget; visible `:focus-visible`;
   new colour pairs added to `contrast-pairs.json` and passing in both themes.
4. **Story** (`<name>.stories.ts`, CSF3): every variant and state with realistic EMS copy, docs
   description with a11y notes and do/don't, and `play` tests for keyboard interaction and ARIA
   state. `npm run storybook:test` passes with **zero axe violations in light and in dark** (the
   runner executes every story once per theme).
5. **Visual baseline**: light + dark screenshots (stories are picked up by their sidebar group in
   `visual/*.visual.spec.ts`, built on `visual/support.ts`),
   `npm run test:visual -- --update-snapshots` for win32, and the Linux ones in Docker (below);
   review and commit both.
6. **Unit tests** (`*.spec.ts`, Vitest): inputs → DOM/ARIA, edge cases; `npm run lib:test` keeps
   **≥ 90% line coverage**.
7. **Changeset** for `@ems/ui` (and `@ems/tokens` if tokens changed).

### Linux visual baselines (Docker)

CI compares against committed `*-chromium-linux.png` baselines and fails on a missing one. Generate
them with the Playwright image matching `@playwright/test` (currently 1.64.1), from `frontend/`
after `npm run storybook:build`. A named volume keeps Linux `node_modules` apart from the Windows
ones, and `--output /tmp/…` keeps traces off the slow Windows bind mount:

```powershell
docker run --rm -v "${PWD}:/work" -v ems-ds-linux-node-modules:/work/node_modules -w /work `
  mcr.microsoft.com/playwright:v1.64.1-noble `
  bash -lc "npm ci && npx playwright test -c playwright.visual.config.ts --update-snapshots --output /tmp/visual"
```

## Known limits

- Clicks on a disabled/loading `uiButton` are blocked by a capture-phase listener on the host,
  which runs before the consumer's `(click)` bindings (unit-tested). Listeners added by other
  directives on the same element (e.g. `routerLink`) should be blocked the same way but are not
  tested yet.
- The legacy app (`src/styles.scss`) keeps its own palette until Phase B; it now renders in Plus
  Jakarta Sans (its Geist font came from Google Fonts, which the CSP no longer allows).
- Shadows have no hex fallback: in engines without OKLCH support they are dropped (flat cards).
