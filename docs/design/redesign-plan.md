# Frontend redesign — Kente Modern

Visual redesign of every existing page onto the `@ems/*` design system (direction **B — Kente
Modern**, decision D29). Behaviour and GraphQL calls stay as they are; contract bugs (deactivate,
company edit, access-level edit, pagination) are fixed in their feature slices, not here.

Reference: `docs/design/direction-board/direction-b.html` (approved screens).
Guide: the Anthropic *frontend-design* skill — applied as the rules below.

## Rules every agent follows

1. **One signature, used sparingly.** The woven band is the identity: page headers of top-level
   pages and the shell brand. The kente panel appears only on sign-in. The stepped notch only on the
   primary action. Everything else is calm: paper/ink surfaces, restrained 1–1.5px borders, crisp
   4–6px radii, no decorative pattern as wallpaper, no gradients, no accent rails on cards.
2. **Type carries personality.** Syne only for page titles, big numbers, person names in headers and
   the product mark. Manrope for all UI and body. IBM Plex Mono (tabular) for employee numbers,
   codes, dates, counts and key hints. Sentence case everywhere except mono eyebrow labels.
3. **Gold is the one action colour** (ink text on gold). One primary action per view. Green and
   oxblood are structure only (department colours, avatar rings, woven band). Status colours come
   from `employee-status` tokens and always pair colour with a shape/label.
4. **Copy from the employee's side.** Name things people recognise: *People* (not Staff),
   *Access levels*, *Requests*. Buttons say what happens: "Add person", "Save changes",
   "Approve password reset". Errors state what went wrong and how to fix it, no apologies.
   Empty states invite the next action.
5. **Structure is information.** Eyebrows, dividers and counts encode real facts (office codes,
   people counts, employee numbers), never decoration. No fake numbering.
6. **Quality floor.** Tokens only (no raw colours), both themes designed, WCAG 2.2 AA, visible focus,
   keyboard paths, reduced motion, responsive to 360px, no horizontal page scroll.
7. **Critique visually.** Screenshot each page in light and dark at 1440 and 390 wide, look, and
   remove one accessory before handing back.

## Phase A — shared components (`frontend/projects/ui/*`, one secondary entry point each)

| Agent | Entry points |
|---|---|
| A1 Forms | `form-field` (label, hint, error, required, `aria-describedby`), `input` (`input[uiInput]`, `textarea[uiInput]`), `select` (CDK listbox-based single select + native styled `select[uiSelect]`), `checkbox`, `switch`, `password-input` (reveal toggle, strength meter), `search-input` (with ⌘K hint slot) |
| A2 Feedback & overlays | `alert` (inline banner), `toast` (service + live region), `spinner`, `skeleton`, `empty-state`, `error-state` (403/404/500), `status-pill` (employee status: dot shape + label), `tag`, `dialog` + `confirm-dialog` (CDK Dialog), `drawer` (side sheet), `menu` (CDK Menu), `tooltip` |
| A3 Layout & identity | `app-shell` (sidebar + topbar + content; collapsible; mobile drawer), `nav-item`, `page-header` (eyebrow, title, description, actions, optional woven band), `panel` (titled section card), `description-list`, `data-table` (header/cell templates, sortable header UI, responsive card mode, row actions slot), `pagination` (pager + "showing x–y of z"), `tabs` (routed nav tabs), `avatar` (initials, sizes, department-segmented ring), `woven-band` |

Each component meets `frontend/projects/README.md`'s definition of done: tokens-only styling, WAI-ARIA
pattern, stories with `play` tests, axe clean in light and dark, visual baselines (win32 + linux),
unit tests ≥ 90% lines, a changeset.

## Phase B — pages (`frontend/src/app/features/*`), after Phase A merges

| Agent | Pages | Notes |
|---|---|---|
| B1 Shell & entry | `shell`, `auth/login`, `unauthorized`, new 404, `dashboard` | Shell = `app-shell` with brand + woven band, nav (Dashboard, People, Settings, My profile), user menu (theme, sign out). Login = split kente panel + form (direction-b screen 1). Dashboard = Syne figures in stat panels, recent people as a compact table with status pills, row actions in a `menu`. Owns `app.routes.ts` except the settings entry. |
| B2 People | `staff` → **People directory**, `profile` → colleague/admin profile | Directory: page header with count, `search-input`, filter row, `data-table` with avatar ring, mono employee numbers, status pills; card mode on mobile; "Add person" opens a `drawer` form. Profile: banner header (direction-b screen 3), `panel` + `description-list` for work details, inline edit via `select` + Save/Cancel, lifecycle actions in a `menu` with `confirm-dialog`. |
| B3 Self-service & settings | `my-profile`, `settings` + 5 tabs | My profile: same header language as profile; sections as `panel`s with view/edit modes using `form-field`s; contact chips as `tag`s. Settings: routed `tabs` (`/settings/companies` …) via `settings.routes.ts` + one-line `loadChildren` in `app.routes.ts`; each tab = `page-header` + `data-table` + create/edit `drawer`; access-level editor = permission matrix grouped by area. |

All page agents: remove the legacy `styles.scss` rules their pages relied on; delete per-page SCSS
that duplicates components; replace hand-made SVG icons with `@ems/icons`; keep component logic and
GraphQL calls unchanged; keep/extend unit tests; add a Playwright visual snapshot per page (light +
dark) using mocked GraphQL responses (`page.route`) so screenshots are deterministic.

## Checkpoints for review

1. Foundation (tokens, fonts, theming, Button) — Storybook in both themes.
2. Phase A — Storybook with every new component.
3. Phase B — the running app in the browser, every page in light and dark.
