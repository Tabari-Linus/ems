# Frontend redesign — Daylight

Visual redesign of every existing page onto the `@ems/*` design system (direction **D — Daylight**,
decision D30). Behaviour and GraphQL calls stay as they are; contract bugs (deactivate, company edit,
access-level edit, pagination) are fixed in their feature slices, not here.

Reference: `docs/design/direction-board/direction-d.html` (approved screens: sign in, home,
people directory, profile). Guide: the Anthropic *frontend-design* skill — applied as the rules below.

## Rules every agent follows

1. **One signature, used in one place.** Daylight's boldness is the employee **Home**: a large
   greeting and a "Needs your attention" list with inline actions. Everything else is calm and
   effortless: faint indigo-tinted canvas, white cards (12–14px radius) separated by soft layered
   shadow rather than borders, generous spacing, no decoration, no gradients, no illustrations.
2. **Type carries the personality.** Plus Jakarta Sans for everything, with real contrast in size
   and weight: 800 with tight tracking only for the Home greeting and page titles; 600–700 for
   section titles and names; 400–500 for UI and body. Geist Mono (tabular) for employee numbers,
   codes, dates and counts. Sentence case throughout.
3. **Indigo is the next step.** Solid indigo only for the primary action and the current nav item;
   one primary action per view. Selected tabs, secondary buttons and filters use the soft indigo tint.
   Pill shape for buttons, filters and tabs. Department colour appears only as soft pastel avatar
   tints. Status pills pair colour with a dot shape and a label.
4. **Copy from the employee's side.** *People* (not Staff), *Requests*, *Access levels*. Buttons say
   what happens: "Add person", "Save changes", "Approve", "Decline". Errors state what went wrong and
   how to fix it; empty states invite the next action.
5. **Structure is information.** Counts, office codes and employee numbers are real data; no
   decorative numbering or eyebrows that say nothing.
6. **Quality floor.** Tokens only (no raw colours), both themes designed, WCAG 2.2 AA, visible focus,
   keyboard paths, reduced motion, responsive to 360px, no horizontal page scroll.
7. **Critique visually.** Screenshot each page in light and dark at 1440 and 390 wide, look, and
   remove one accessory before handing back.

## Phase A — shared components (`frontend/projects/ui/*`, one secondary entry point each)

| Agent | Entry points |
|---|---|
| A1 Forms | `form-field` (label, hint, error, required, `aria-describedby`), `input` (`input[uiInput]`, `textarea[uiInput]`), `select` (CDK listbox-based single select + native styled `select[uiSelect]`), `checkbox`, `switch`, `password-input` (reveal toggle, strength meter), `search-input` (with ⌘K hint slot), `filter-pill` (pill dropdown filter "Office · All") |
| A2 Feedback & overlays | `alert` (inline notice), `toast` (service + live region), `spinner`, `skeleton`, `empty-state`, `error-state` (403/404/500), `status-pill` (employee status: dot shape + label), `tag`, `dialog` + `confirm-dialog` (CDK Dialog), `drawer` (side sheet), `menu` (CDK Menu), `tooltip` |
| A3 Layout & identity | `app-shell` (light sidebar + top bar with search and user menu; collapsible; mobile drawer), `nav-item` (indigo pill when current, badge count), `page-header` (title, count, description, actions), `card` (titled section card), `description-list`, `data-table` (header/cell templates, sortable header UI, responsive card mode, row actions slot), `pagination`, `tabs` (routed pill tabs), `avatar` (initials on department pastel tint, sizes), `person-card` (directory grid card), `view-toggle` (grid/list) |

Each component meets `frontend/projects/README.md`'s definition of done: tokens-only styling, WAI-ARIA
pattern, stories with `play` tests, axe clean in light and dark, visual baselines (win32 + linux),
unit tests ≥ 90% lines, a changeset.

## Phase B — pages (`frontend/src/app/features/*`), after Phase A merges

| Agent | Pages | Notes |
|---|---|---|
| B1 Shell & entry | `shell`, `auth/login`, `unauthorized`, new 404, `dashboard` → **Home** | Shell = `app-shell` (Home, People, Requests, Settings, My profile). Login = calm, centred form (direction-d screen 1). The current dashboard becomes the employee Home (direction-d screen 2): greeting with date, "Needs your attention" from data already loaded, your team / recent people, quick links; HR stat figures move below in a quiet row for users who can see them. Owns `app.routes.ts` except the settings entry. |
| B2 People | `staff` → **People directory**, `profile` → colleague/admin profile | Directory (direction-d screen 3): page header with count, `search-input`, `filter-pill`s, `view-toggle` (grid default with `person-card`, list with `data-table`); "Add person" opens a `drawer` form. Profile (screen 4): header card + pill `tabs` (Overview active; others show what exists today), `card` + `description-list`, inline edit via `select` + Save/Cancel, lifecycle actions in a `menu` with `confirm-dialog`. |
| B3 Self-service & settings | `my-profile`, `settings` + 5 tabs | My profile: same header language as profile; sections as `card`s with view/edit modes using `form-field`s; contact chips as `tag`s. Settings: routed pill `tabs` (`/settings/companies` …) via `settings.routes.ts` + one-line `loadChildren` in `app.routes.ts`; each tab = `page-header` + `data-table` + create/edit `drawer`; access-level editor = permission matrix grouped by area. |

All page agents: remove the legacy `styles.scss` rules their pages relied on; delete per-page SCSS
that duplicates components; replace hand-made SVG icons with `@ems/icons`; keep component logic and
GraphQL calls unchanged; keep/extend unit tests; add a Playwright visual snapshot per page (light +
dark) using mocked GraphQL responses (`page.route`) so screenshots are deterministic.

## Checkpoints for review

1. Foundation (tokens, fonts, theming, Button) — Storybook in both themes.
2. Phase A — Storybook with every new component.
3. Phase B — the running app in the browser, every page in light and dark.
