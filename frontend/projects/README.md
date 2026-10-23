# EMS design system (`frontend/projects/`)

Three packages, built and versioned independently, consumed by the app through path mappings
(from source in development) so the design system can later leave the repo unchanged. Spec:
`docs/spec-and-plan.md` §2.6 and Slice DS.

> **Status (Slice 0.8): infrastructure only.** Every token value is a **placeholder** (neutral
> greys, one teal accent, system fonts). The visual identity is decided in Slice DS from the
> Direction Board and then frozen into the token sources; nothing else should need to change.

| Package       | Path               | What                                                            | Build                                  |
| ------------- | ------------------ | --------------------------------------------------------------- | -------------------------------------- |
| `@ems/tokens` | `projects/tokens/` | W3C DTCG tokens → CSS custom properties, TS, JSON               | Style Dictionary 5 + `ng build tokens` |
| `@ems/icons`  | `projects/icons/`  | `ui-icon` over a curated Lucide set (`@lucide/angular`)         | `ng build icons` (ng-packagr, APF)     |
| `@ems/ui`     | `projects/ui/`     | Angular components, one secondary entry point each + global CSS | `ng build ui` (ng-packagr, APF)        |

```text
projects/
├── tokens/
│   ├── tokens/{primitive,semantic,component}/*.json   DTCG sources (edit these)
│   ├── contrast-pairs.json                             pairs the contrast gate checks
│   ├── scripts/build-tokens.mjs                        Style Dictionary build
│   ├── scripts/check-contrast.mjs                      WCAG gate (culori)
│   ├── src/generated/tokens.{css,ts,json}              build output (committed, do not edit)
│   └── stories/                                        generated token gallery (Storybook)
├── icons/src/{icon.ts,registry.ts}
└── ui/
    ├── styles/{index,reset,base,utilities}.css          global stylesheet (cascade layers)
    ├── button/src/                                     @ems/ui/button
    └── theme/src/                                      @ems/ui/theme (ThemeService, no-flash snippet)
```

## Commands (run in `frontend/`)

| Command                         | Does                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `npm run tokens:build`          | DTCG sources → `projects/tokens/src/generated/`                                         |
| `npm run tokens:check`          | rebuild and fail if the committed output is stale (CI)                                  |
| `npm run tokens:check-contrast` | contrast table for every declared pair, both themes; exit 1 on a failure                |
| `npm run lib:build`             | tokens → icons → ui into `dist/{tokens,icons,ui}`                                       |
| `npm run lib:test`              | Vitest unit tests for ui and icons, coverage gate 90% lines                             |
| `npm run storybook`             | docs site on http://localhost:6006 (light/dark toolbar toggle)                          |
| `npm run storybook:build`       | static site in `storybook-static/`                                                      |
| `npm run storybook:test`        | every story in Chromium: render + `play` + axe (any violation fails)                    |
| `npm run test:visual`           | Playwright screenshots of Button stories, light + dark, + axe (needs `storybook:build`) |
| `npm run changeset`             | record a change to a package (Changesets)                                               |

Playwright needs Chromium once: `npx playwright install chromium`.

## Tokens

### Tiers

1. **Primitive** (`tokens/primitive/`): raw scales with no meaning: colour ramps in OKLCH
   (`color.neutral.*`, `color.accent.*`, `color.{green,amber,red,blue}.*`), `space.*`, `radius.*`,
   `border-width.*`, `font.{family,size,weight,line-height}.*`, `duration.*`, `easing.*`.
   **Components never use these.**
2. **Semantic** (`tokens/semantic/`): roles. `light.json` and `dark.json` must declare exactly the
   same paths (the build fails otherwise): `color.bg.*`, `color.text.*`, `color.border.*`,
   `color.accent.*`, `color.status.{success,warning,danger,info}.{text,bg,border,solid,solid-hover,on-solid}`.
   `base.json` holds theme-independent roles (`focus.ring.*`, `control.*`, `motion.*`, `text.body.*`)
   and is part of both theme builds, so a reference like `focus.ring.color` still resolves per theme.
3. **Component** (`tokens/component/`): per-component decisions that reference semantic tokens,
   e.g. `button.primary.bg → {color.accent.bg}`. Only `button.json` exists so far.

### Output

`tokens.css` (all names prefixed `--ems-`, everything inside `@layer tokens`):

- primitives on `:root`, with an sRGB hex fallback block under `@supports not (color: oklch(0% 0 0))`
  (Style Dictionary's `color/hex` transform, gamut-mapped);
- light semantic + component tokens on `:root, [data-theme='light']`;
- dark on `[data-theme='dark']` and under `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) }`.

Semantic and component tokens are emitted as `var(--ems-…)` references, so only primitives carry
literal values. Component tokens are re-declared in every theme block because a custom property's
`var()` is resolved on the element that declares it; this also makes nested `[data-theme]`
scopes work.

`tokens.json` and `tokens.ts` (`tokens`, `cssVar(name)`, `TokenName`) list every token with its
CSS variable, tier and resolved value(s) per theme (OKLCH and hex), plus the referenced token.

### Add or change a token

1. Edit the DTCG JSON (`$value`, `$type`; colours as
   `{ "colorSpace": "oklch", "components": [L, C, H] }`, dimensions as `{ "value": 1, "unit": "rem" }`).
   New semantic colour: add it to **both** `light.json` and `dark.json`.
2. If it is a foreground/background or boundary pair, add it to `contrast-pairs.json`
   (`text` 4.5:1, `large-text` 3:1, `ui` 3:1).
3. `npm run tokens:build && npm run tokens:check-contrast`, then commit the sources **and**
   `src/generated/`.
4. Add a changeset (`npm run changeset`) for `@ems/tokens`.

## Global styles (`@ems/ui/styles/index.css`)

Load order in an app: `tokens.css`, then `ui/styles/index.css`, then app styles (see
`angular.json`). Layers, lowest precedence first: `reset, tokens, base, components, utilities`.
Unlayered CSS beats every layer, which is why the legacy `src/styles.scss` still wins everywhere
it has an opinion; the login screen was checked pixel-identical with and without these files.
The reset deliberately omits `display: block` on media and `font: inherit` on form controls for
that reason (see the comment in `reset.css`).

## Theming (`@ems/ui/theme`)

`ThemeService.theme` (`light | dark | system`), `resolved` (`light | dark`), `setTheme()`.
`light`/`dark` set `<html data-theme>` and persist in `localStorage` (`ems-theme`); `system`
removes the attribute so the media query decides. Storage errors are ignored.

To avoid a flash of the wrong theme, put the snippet exported as `THEME_NO_FLASH_SCRIPT` inline
in `<head>` of `index.html`, before the stylesheets:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('ems-theme');
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    } catch (e) {}
  })();
</script>
```

The nginx Content-Security-Policy must then allow it by hash (`script-src 'sha256-…'`). Not wired
into the app yet (the legacy UI is dark-first and would ignore it).

## Icons (`@ems/icons`)

`<ui-icon name="search" />` is decorative (`aria-hidden`); `<ui-icon name="circle-alert" label="Error" />`
is `role="img"` with an accessible name. Only icons listed in `EMS_ICONS` (`registry.ts`) are
bundled; add one by importing its `Lucide<Name>` class there. Brand glyphs can be added as
`LucideIconData` objects.

## Add a component (definition of done)

1. **Entry point**: `projects/ui/<name>/ng-package.json` + `src/public-api.ts`; import it as
   `@ems/ui/<name>`. Standalone, `ChangeDetectionStrategy.OnPush`, signal APIs
   (`input()`, `model()`, `output()`), host bindings in `host: {}` (no `@HostBinding`/`@HostListener`).
   Prefer enhancing native elements (attribute selectors) where semantics come for free; behaviour
   for complex widgets on Angular CDK.
2. **Tokens-only styling**: the component stylesheet is wrapped in `@layer components` and uses
   only `--ems-*` **semantic or component** tokens (add component tokens in
   `tokens/component/<name>.json` when a decision is component-specific). No raw colours, no
   primitives, no `!important`; logical properties; `prefers-reduced-motion` and `forced-colors`
   handled; 24×24 px minimum target.
3. **Accessibility**: follow the WAI-ARIA APG pattern for the widget; visible `:focus-visible`;
   new colour pairs added to `contrast-pairs.json` and passing in both themes.
4. **Story** (`<name>.stories.ts`, CSF3): every variant and state, docs description with a11y notes
   and do/don't, and `play` tests for keyboard interaction and ARIA state. `npm run storybook:test`
   passes with **zero axe violations**.
5. **Visual baseline**: light + dark screenshots (extend `visual/` if it is not a Button story),
   `npm run test:visual -- --update-snapshots`, review and commit the images.
6. **Unit tests** (`*.spec.ts`, Vitest): inputs → DOM/ARIA, edge cases; `npm run lib:test` keeps
   **≥ 90% line coverage**.
7. **Changeset** for `@ems/ui` (and `@ems/tokens` if tokens changed).

## Known limits

- Visual baselines are per platform (system fonts). Only `*-chromium-win32.png` baselines are
  committed; CI writes the Linux ones on its first run (`--update-snapshots=missing`) and uploads
  them as the `visual-regression` artifact, to be reviewed and committed. Until then the Linux
  visual job cannot catch regressions.
- `storybook:test` runs axe in the light theme; the dark theme is axe-checked by `test:visual` for
  Button stories only.
- Clicks on a disabled/loading `uiButton` are blocked by a capture-phase listener on the host,
  which runs before the consumer's `(click)` bindings (unit-tested). Listeners added by other
  directives on the same element (e.g. `routerLink`) should be blocked the same way but are not
  tested yet.
