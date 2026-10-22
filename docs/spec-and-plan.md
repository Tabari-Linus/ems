# EMS: Specification and Implementation Plan

| | |
|---|---|
| **Status** | Draft v1 (2026-10-22). Waiting on the open decisions in §9, then "go on an implementation". |
| **Inputs** | `EMS_REVIEW_2026-10-22.md` (findings, referenced below as I1…I15, C1/C2, G1…) and the answers to the 18 review questions. |
| **Goal** | A portfolio-quality employee management system: Spring Boot GraphQL backend and Angular frontend in one repo. It should run end to end with `docker compose up`, built feature by feature with each slice verifiable before the next. |

---

## 1. Decisions already made

| # | Decision |
|---|---|
| D1 | Learning/CV project. Aim for production *practices* without production *operations* (no k8s, no multi-region). |
| D2 | Deliver **vertical feature slices** (backend + frontend + tests). Each slice ends with a demo checklist. |
| D3 | **Make the API consistent**: the schema can change freely, and the frontend follows the schema via codegen. |
| D4 | Refresh token in an **HttpOnly cookie**, with **silent refresh on app start**. |
| D5 | **Multi-device sessions.** A login does not end other sessions. |
| D6 | A **`me` query** returns the user, employee and effective permissions. **Permissions leave the JWT**: the server resolves them per request. |
| D7 | **Access levels are the only authorization model.** Remove the role-like permissions (`*_ADMIN`, `*_MANAGER`, `*_DIRECTOR`, `*_ROLE`). |
| D8 | Department names are **unique per office**. |
| D9 | Lifecycle: `PENDING` → `ACTIVE` on first successful login, after a **forced password change**. `INACTIVE` is blocked. Add explicit **activate/deactivate**. |
| D10 | Employees edit **their own addresses**. The **employee number** (generated, office-prefixed) is admin-managed. |
| D11 | Colleagues can **view** each other's directory info, including the employee number, but cannot modify it. The internal database id is not exposed to users. |
| D12 | **Apollo Angular + GraphQL Code Generator** (typed documents generated from the backend schema). |
| D13 | Redesign on the **Unified Experience Design System** (the organisation default). |
| D14 | **Shared UI component library + routed settings**, following Angular best practice. |
| D15 | Tests: **Vitest** (frontend unit), **Playwright** (E2E), JUnit/Mockito + **GraphQlTester + Testcontainers** (backend). |
| D16 | **One repository** during development, but frontend and backend are **deployed independently** (separate hosts, separate pipelines, separate artefacts). Nothing may assume the two share an origin in production, and either side must be splittable into its own repo later without code changes. |
| D17 | **Commit the pending backend work first**, before any new change. |
| D18 | **docker-compose** for the whole stack. |
| D20 | **Soft delete only.** No hard-delete mutations; `archiveX` sets `ARCHIVED` and `deletedAt`, and data is retained. |
| D21 | Employee number carries the **company location** as well as the office (format in §3.4). |
| D22 | Identification documents (and other sensitive data) are visible to the **employee, their manager, and admins/HR**. |
| D23 | **Every employee can browse colleagues read-only.** Only admins and employee managers edit. |
| D24 | **Password reset is requested from the employee's immediate manager** (flow in §3.5). This introduces a **reporting line** (`Employee.manager`). |
| D25 | **Light and dark themes**, following the OS setting by default, with a user toggle. |
| D26 | **We build our own design system package** (§2.6): industry-standard engineering, a distinctive modern visual identity. No generic or template look. |
| D27 | `certificates.zip` and all key material are deleted and gitignored. Keys are generated locally by script. |
| D28 | The project moves out of OneDrive to **`C:\Users\LinusTabari\Downloads\ems`**. |
| D29 | ~~Visual direction: B — Kente Modern~~ **Withdrawn** (owner rejected it). Round 2 brief: clean, minimal, light-first, Rippling/Deel-like, blue/indigo accent (`docs/design/direction-board/BRIEF-round2.md`). Original entry: (Direction Board, `docs/design/direction-board/`). Kente gold is the single action colour (ink lettering); forest green and oxblood are structure only (woven band, department colours, avatar rings); Syne / Manrope / IBM Plex Mono; crisp 4–6px radii; woven-band, stepped-notch and kente-panel motifs used sparingly. |
| D30 | Visual direction: **D — Daylight** (`docs/design/direction-board/direction-d.html`). Light-first, friendly HR software: faint indigo-tinted canvas, white rounded cards (12–14px) with soft layered shadows, pill buttons and filters, one indigo accent (oklch ~52% 0.2 272; lifted in dark) used only as solid fill on the next step, soft indigo tint for selected/secondary, subtle pastel department tints on avatars; Plus Jakarta Sans + Geist Mono. Signature: the employee Home (greeting + "Needs your attention"). |
| D19 | Production runs on a **custom domain**: frontend at `app.<domain>`, API at `api.<domain>`. These are same-site, so the refresh cookie is first-party: `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`, host-only on `api.<domain>`. The `SameSite=None` fallback is not used. |

---

## 2. Target architecture

```
ems/                                  (existing repo github.com/Tabari-Linus/ems, history kept)
├── backend/                          Spring Boot 4, Java 21 — self-contained (own mvnw, Dockerfile, README, .env.example)
├── frontend/                         Angular 21, Apollo Angular — self-contained (own package.json, Dockerfile, nginx.conf, README)
├── docs/                             review, this spec, ADRs, architecture diagram
├── docker-compose.yml                local only: postgres · mailpit · backend · frontend (two origins, like prod)
├── .github/workflows/                backend.yml, frontend.yml (path-filtered, each builds+tests+publishes its own artefact), e2e.yml
└── README.md                         quick start, architecture, screenshots (CV-facing)
```

### 2.1 Runtime topology (independent deployments)

```
 Browser ──► Frontend host (static: nginx container / Netlify / Vercel / S3+CDN)   e.g. https://app.<domain>
    │
    └──────► Backend host (Spring Boot container: Render / Fly / Railway / VM)      e.g. https://api.<domain>
                 └── PostgreSQL (managed) · SMTP provider
```

**Two independently deployable artefacts:**

| | Frontend | Backend |
|---|---|---|
| Artefact | Static bundle (+ an optional nginx image with SPA fallback; no API proxy) | Spring Boot image |
| Release | Own pipeline, triggered by `frontend/**` | Own pipeline, triggered by `backend/**` |
| Coupling | None at build time | — |

The only shared contract is the GraphQL schema, plus the REST auth endpoints.

**Runtime configuration of the frontend.** The API URL is **not baked into the build**.
- The SPA loads `/config.json` (`{ "apiUrl": "https://api.<domain>" }`) in `main.ts` *before* `bootstrapApplication` and provides it as an immutable `APP_CONFIG` value (so Apollo and services can read it synchronously, and it cannot race the session initializer).
- The same bundle can therefore be promoted from staging to prod.
- The nginx image writes `config.json` from env vars at container start.

**CORS (backend)**
- Explicit allow-list from `ALLOWED_ORIGINS` (comma-separated, no wildcards), `allowCredentials=true`.
- Methods `GET, POST, OPTIONS`.
- Headers `Authorization, Content-Type, X-Requested-With, apollo-require-preflight`.
- Preflight cache `maxAge` 1 h.
- Configured in the **base** profile, not just dev.

**Cookies across origins.** The refresh cookie is the one piece that is sensitive to where each side is hosted:
- **Same site** (recommended): `app.<domain>` and `api.<domain>` share a registrable domain. The cookie is `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`, with no `Domain` attribute, so it is host-only on the API. This is first-party, so browsers' third-party-cookie blocking does not affect it.
- **Different sites** (e.g. `*.vercel.app` + `*.onrender.com`): the cookie must be `SameSite=None; Secure`. Safari ITP, Firefox and Chrome's third-party-cookie restrictions can then block it, and **silent refresh breaks for some users**. Avoid it, or accept the fallback below.
- All cookie attributes are env-driven: `AUTH_COOKIE_SAMESITE`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_PATH`.

**CSRF.** Only the cookie-authenticated endpoints (`/api/v1/auth/refresh-token`, `/logout`, `/logout-all`) need protection.
- They require a custom header (`X-Requested-With: ems-web`) plus an `Origin` header check against the allow-list.
- A cross-site form post cannot set custom headers, and a cross-origin `fetch` with one is preflighted and rejected by CORS.
- GraphQL uses the Bearer header, which is not ambient, so it needs no CSRF token. Apollo sends `apollo-require-preflight` to keep simple-request CSRF off `/graphql`.

**Local development mirrors production's cross-origin setup**, so problems surface early.
- `ng serve` runs on `http://localhost:4200`; the API runs on `http://localhost:8080`; CORS is enabled with `ALLOWED_ORIGINS=http://localhost:4200`.
- There is no dev proxy that would hide CORS or cookie issues.
- Note: localhost ports are the *same site*, so local testing behaves like the recommended same-site deployment.

**Mailpit** captures outgoing email locally (welcome / temporary password, password reset) and shows it at `http://localhost:8025`. Production uses an SMTP provider configured by env.

**JWT keys** come from env or a secret mount (`JWT_PRIVATE_KEY` PEM content or `*_PATH`), never from `src/main/resources` (fixes H4).

**Health**
- The backend exposes `/actuator/health/{liveness,readiness}` for the host's probes.
- The frontend image exposes `/healthz` from nginx.

### 2.2 Backend conventions (apply to every module as it is touched)

| Concern | Convention |
|---|---|
| GraphQL endpoint | Move from `POST /` to **`/graphql`** (standard; keeps `/` free for the SPA). |
| Types | **One type per entity**: `Company`, `Office`, `Department`, `Position`, `AccessLevel`, `Employee`. Relations resolve through `@SchemaMapping`/**`@BatchMapping`**, not hand-built nested DTOs. This removes the `XResult` / `XListItemResult` / `XDetailResult` triplets and the N+1 problems. |
| Pagination | `XPage { items: [X!]!, pageInfo: PageInfo! }` and `PageInfo { page, size, totalElements, totalPages, hasNext, hasPrevious }`. Inputs are `page: PageInput`, `sort: SortInput`, and `filter: XFilter` (always the same three names and order). Size default 20, max 100, default sort `createdDate DESC`. Sort fields are validated against an allow-list per entity. |
| Mutations | Return the **affected object** (`createCompany(input): Company!`), so Apollo's normalized cache updates automatically. No `ApiResponse{success}` and no `ActionResult`. |
| Lifecycle | Uniform `activateX(id)`, `deactivateX(id)`, `archiveX(id)`. Archive is the soft delete (D20): hidden from default lists, cannot be assigned, retained for history. Existing `deleteX` mutations are removed. |
| Field naming | `status` (not `companyStatus`), `email`, `phoneNumber`, `address`. Real `Date`/`DateTime` scalars. Booleans are `Boolean`. |
| IDs | The GraphQL `ID` stays the opaque primary key for routing and caching. It is **never shown in the UI**. The human-facing identifier is `employeeNumber` (§3.4). |
| Errors | One shape: `extensions { code, errorType, violations? }`. `code` is one of `VALIDATION_ERROR`, `NOT_FOUND`, `DUPLICATE`, `BUSINESS_RULE`, `FORBIDDEN`, `UNAUTHENTICATED`, `CONFLICT`, `INTERNAL`. Every module uses the same exceptions. Access denied becomes `FORBIDDEN/FORBIDDEN`. |
| Validation | Jakarta validation on **every** input, including updates and nested inputs (`@Valid`). Updates use **patch semantics**: an omitted field is unchanged, and explicit `null` clears it only where allowed. |
| Soft delete | Every read path filters out `deletedAt`/archived unless an explicit `includeArchived`/status filter is given. Assignments reject archived targets. |
| Module layout | `controller → service → helper(s) → repository`, with one `XValidator` and one `XMapper` per module. Delete the `XUtil.validateNotNull` copies. Lowercase the `pagination` package. |
| Persistence | DB constraints back every uniqueness rule (no app-only checks). Index every FK and status column. `ddl-auto: validate` in all profiles. Tests run Flyway migrations on Testcontainers Postgres, and the forked test migrations are deleted. |
| Time | Store `TIMESTAMPTZ` / `Instant` (fixes the fake-UTC labelling). |

### 2.3 Security model

**Access token**
- Claims: `sub` = user-account public id, `iss`, `aud`, `iat`, `exp`, `jti`. No permissions.
- 15-minute life.
- The decoder validates `iss` and `aud`.

**Per-request authorization**
- A `JwtAuthenticationConverter` loads the account. It denies the request if the account is not `ENABLED` or the employee is `INACTIVE`/`ARCHIVED`. It then loads the effective permissions of the employee's **active** access level.
- The result is held in a Caffeine cache (TTL around 60 s). The cache is **evicted on any access-level, employee-status or assignment change**, so revocation is effectively immediate. This fixes H1, H2 and H3.

**Sessions**
- Table `auth_sessions(id, user_id, token_hash SHA-256, family_id, user_agent, ip, created_at, last_used_at, expires_at, revoked_at, replaced_by)`.
- **Rotation on refresh.** If a revoked token is reused, the whole family is revoked (reuse detection).
- Multiple concurrent sessions are allowed (D5).
- Endpoints: `logout` (this session) and `logoutAll`.

**Cookie**
- `refresh_token`, `HttpOnly; Secure (prod); SameSite=Lax; Path=/api/v1/auth`, host-only on `api.<domain>` (D19). This fixes C1.
- CSRF is handled by the custom header + `Origin` check (§2.1).

**Passwords**
- BCrypt.
- Policy: at least 10 characters, plus a breached/common-list check (optional).
- `mustChangePassword` flag. The temporary password expires (72 h).
- Login rate limit and lockout: Bucket4j per IP+email; lock after 5 failures for 15 min.
- Email is case-insensitive (citext or lower-cased unique index).
- Changing `workEmail` updates the login email too.

**Privilege escalation fix (C2)**
- Assigning an access level requires `MANAGE_ACCESS_LEVEL` (or a dedicated `ASSIGN_ACCESS_LEVEL`).
- Nobody can change their own access level.
- A guard prevents removing the last holder of `MANAGE_ACCESS_LEVEL` and archiving that level (no lockout).

**Hardening**
- Introspection and GraphiQL in dev only.
- Max query depth (10) and complexity limits.
- No TRACE bind logging.
- Actuator health only.

### 2.4 Permission catalogue (after D7)

Each module has a `VIEW_*`/`MANAGE_*` pair:

| Area | Permissions |
|---|---|
| Company | `VIEW_COMPANY` / `MANAGE_COMPANY` |
| Office | `VIEW_OFFICE` / `MANAGE_OFFICE` |
| Department | `VIEW_DEPARTMENT` / `MANAGE_DEPARTMENT` |
| Position | `VIEW_POSITION` / `MANAGE_POSITION` |
| Access level | `VIEW_ACCESS_LEVEL` / `MANAGE_ACCESS_LEVEL` |
| Employee | `VIEW_EMPLOYEE` (directory) / `MANAGE_EMPLOYEE`, plus **`VIEW_EMPLOYEE_SENSITIVE`** (new, for HR/admin; line managers get the same visibility over their reports through the reporting line, §3.3) |
| Dashboard | `VIEW_DASHBOARD` |
| Self | `VIEW_SELF` / `MANAGE_SELF` |

- **Removed:** `VIEW/MANAGE_ADMIN`, `_MANAGER`, `_DIRECTOR`, `_ROLE`, `MANAGE_DASHBOARD`.
- A `permissionCatalog` query returns `{ code, group, label, description }`, so the UI never hard-codes the enum.

**Seeded access levels** (Flyway, editable afterwards):

| Level | Grants |
|---|---|
| **Administrator** | Everything |
| **HR** | Employee + org view, employee manage, sensitive view |
| **Employee** (default for new hires) | `VIEW_SELF`, `MANAGE_SELF`, `VIEW_EMPLOYEE` |

### 2.5 Frontend architecture

```
frontend/src/app/
├── core/            auth (session store, interceptor/Apollo links, guards), apollo setup, error handling, layout shell
├── (consumes @ems/ui, @ems/tokens, @ems/icons from frontend/projects/* — see §2.6)
├── shared/          app-specific compositions (page header, people picker), pipes, permission directive
├── shared/util/     pipes (initials, date), validators, permission directive (*hasPermission)
├── graphql/         *.graphql operation files + generated/ (codegen output, committed or generated in CI)
└── features/
    ├── auth/        login, change-password, (forgot/reset)
    ├── dashboard/
    ├── directory/   employee list + read-only colleague profile
    ├── employees/   admin employee management (create, edit, lifecycle)
    ├── my-profile/  self-service sections (bio, contact, addresses, identifications)
    └── settings/    routed: companies, offices, departments, positions, access-levels
```

Each feature has a `routes.ts` (lazy), page components (smart), presentational components (dumb), and a small data-access service wrapping generated Apollo operations.

| Concern | Convention |
|---|---|
| Data fetching | Apollo `watchQuery` turned into signals via `toSignal`, or a small `query()` helper that returns `{ data, loading, error }` signals. One pattern everywhere, with normalized cache and refetch-on-mutation through cache updates. |
| Auth flow | `provideAppInitializer` calls `POST /api/v1/auth/refresh-token`, then `me`. The session store (signal) holds `me`. Guards read `session.permissions()`. The Apollo `ErrorLink` and the HttpClient interceptor share a **single-flight refresh** and retry once on `UNAUTHENTICATED`/401. A proactive refresh runs about 60 s before `exp`. |
| Errors | A central `GraphQLError → AppError` mapper. Field `violations` are shown on the form controls; everything else goes to a toast. |
| Forms | Angular **signal forms** (already in use), with validators mirroring server rules. Server violations map back onto fields. |
| Routing | Settings sub-routes (`/settings/companies` …), `title` per route, a `canMatch` permission guard, and a 404 page. |
| Config | Runtime `config.json` (`apiUrl`) loaded before bootstrap and exposed through an `APP_CONFIG` injection token. No API URL in `environment.ts`; no dev proxy (dev is cross-origin, like prod). All HTTP/Apollo calls use `withCredentials` only for the auth endpoints. |
| Quality | ESLint (angular-eslint), Prettier, strict TS (already on), `OnPush` everywhere, a11y: labelled controls, focus management in dialogs, keyboard menus. |

### 2.6 Our design system package (D26)

The UEDS package is private and unreachable, so we build our own. It is a first-class sub-project with its own quality bar, not a folder of styled components. The working name **"Kente"** is a placeholder (§9 Q4).

**Packaging (industry standard, independently versionable)**

| Package | What | Built with |
|---|---|---|
| `@ems/tokens` | Design tokens in **W3C DTCG JSON** (the standard format), in three tiers: *primitive* (raw palette, scales) → *semantic* (`color.bg.surface`, `color.text.muted`, `color.border.focus`…) → *component* (`button.primary.bg`…). Emits CSS custom properties per theme, a TS export and a JSON export. | **Style Dictionary v4** |
| `@ems/ui` | Angular component library: standalone, signals-first APIs (`input()`, `model()`, `output()`), `OnPush`, SSR-safe, tree-shakeable secondary entry points (`@ems/ui/button`, `@ems/ui/table` …). | Angular CLI library + **ng-packagr** (Angular Package Format) |
| `@ems/icons` | Thin wrapper over **Lucide**, plus our own few brand glyphs, so the icon set can be swapped in one place. | ng-packagr |

- All three live in the Angular workspace (`frontend/projects/*`), use **Changesets** for semver/changelogs, and can be published to GitHub Packages.
- The app consumes them as packages (path-mapped in dev), so the design system can later leave the repo unchanged.

**Engineering standards**

- **Behaviour on Angular CDK** (`a11y`, `overlay`, `dialog`, `menu`, `listbox`, `portal`, `scrolling`). CDK is the same foundation Angular Material uses, so focus trapping, keyboard navigation and screen-reader semantics are battle-tested rather than hand-rolled.
- **WAI-ARIA Authoring Practices** pattern for every interactive component.
- **WCAG 2.2 AA**:
  - Contrast is verified **automatically on the token pairs in both themes**: a CI script fails on any text/background pair below 4.5:1, or 3:1 for large text, UI borders and focus rings.
  - Visible `:focus-visible` rings; 24×24 px minimum targets.
  - `prefers-reduced-motion` and `forced-colors` (Windows High Contrast) support.
- **Forms**:
  - Every control implements `ControlValueAccessor` and works with Angular **signal forms**.
  - A single `ui-form-field` handles label, hint, error, required marker and `aria-describedby` wiring, so server `violations` render consistently.
- **Theming**:
  - `[data-theme="light|dark"]` on `<html>`; default follows `prefers-color-scheme`. The user's choice is persisted, with no flash of the wrong theme (an inline script sets the attribute before paint).
  - `color-scheme` is set so native controls and scrollbars match.
  - Density (`comfortable` / `compact`) is a token switch, for data-heavy screens.
- **Modern CSS**:
  - Cascade layers (`@layer reset, tokens, base, components, utilities`), logical properties (RTL-ready), container queries for responsive components, `:has()`.
  - No `!important`, no global leakage: component styles are encapsulated and consume only semantic/component tokens, never raw hex.
- **Documentation and tests**:
  - **Storybook** (Angular) is the living docs site: every component has its variants, states, a11y notes, do/don't, and a light/dark toggle. A token gallery is generated from `@ems/tokens`.
  - Storybook **interaction tests**, **axe** checks on every story (test-runner), **visual regression** (Playwright screenshots of stories in both themes), and Vitest unit tests for logic.
  - Coverage gate is at least 90% for the library.

**Visual identity: modern and distinctive, not template-default**

A **Direction Board** comes before any component code:
- 2–3 distinct directions, each with palette (light + dark), type pairing, radius and elevation language, motion, density, iconography, and 3 real EMS screens (login, directory, employee profile) rendered with it.
- You pick one, or mix them; it is then frozen into tokens.

Constraints every direction must meet:
- An ownable accent and a **neutral ramp tuned in OKLCH**, so light/dark are designed (not inverted) and the steps are perceptually even.
- **Variable-font typography**, a display/text pairing with tabular numerals for data, and a modular type scale.
- A deliberate **elevation and surface system** (layered surfaces in dark mode, not just grey shadows).
- Purposeful motion: 150–250 ms, spring-like easing, view transitions between routes.
- Signature details that make it recognisable:
  - a **⌘K command palette** for navigation and people search
  - data-dense but calm **tables**
  - **avatar-first** people UI
  - expressive **empty/error states** with custom illustrations
- No generic tropes: no default-blue SaaS look, purple gradients, emoji, glassmorphism-everywhere or left-border cards.

**Component inventory** (built in this order, as slices need them)

| Tier | Components |
|---|---|
| Foundations | Tokens, themes, typography, layout primitives (`Stack`, `Cluster`, `Grid`), `Icon`, `VisuallyHidden`, focus ring |
| Actions & inputs | Button, IconButton, ButtonGroup, Link, FormField, Input, Textarea, PasswordInput (strength meter), Select (CDK listbox), Combobox/Autocomplete (people search), MultiSelect, Checkbox, Radio/RadioGroup, Switch, DatePicker, SegmentedControl |
| Feedback | Alert/Banner, Toast (live region), Badge, StatusPill, Skeleton, Spinner, ProgressBar, EmptyState, ErrorState (403/404/500) |
| Overlays | Dialog, ConfirmDialog, Drawer (side sheet), Menu, Popover, Tooltip, CommandPalette |
| Navigation | AppShell (collapsible sidebar + topbar + content), NavItem, Tabs (routed), Breadcrumbs, Pagination, Stepper |
| Data display | DataTable (server sort/paging, column visibility, row actions, selection, sticky header, responsive card mode), DescriptionList, Card, StatCard (with trend), Avatar/AvatarGroup, Tag, Timeline, PermissionMatrix |

---

## 3. Domain rules

### 3.1 Organisation

**Company**
- `name` and `code` (2–10 alphanumerics) are unique, case-insensitive.
- `locationCode` (2–3 uppercase letters, e.g. `GH`) is used in employee numbers (§3.4).

**Office**
- Belongs to a company.
- `name` is unique per company.
- `prefix`: 2–4 uppercase letters, unique **per company**. It is suggested from the name (Accra → `ACC`) and editable only while the office has no employees.
- `code` is `{companyCode}-{seq}`, unique per company (fixes I15).

**Department**
- Belongs to an office.
- `name` is unique per office (D8).
- `code` is generated per office.

**Position**
- `name` is unique.
- `level` comes from the enum.

**All of these** use `PENDING | ACTIVE | INACTIVE | ARCHIVED`. Archiving is blocked while active children or assigned employees exist (business-rule error with a clear message).

### 3.2 Employee lifecycle

```
            create (admin)                first login + password change
  ──────────────────────────► PENDING ───────────────────────────────► ACTIVE
                                 │                                      │  ▲
                                 │ deactivate                deactivate │  │ activate
                                 ▼                                      ▼  │
                              INACTIVE ◄────────────────────────────────────┘
                                 │
                       archive (from any state, admin) → ARCHIVED (terminal; account disabled, sessions revoked)
```

- **INACTIVE**: login refused ("Your account is deactivated"); existing sessions are revoked immediately.
- **activate** from INACTIVE returns to ACTIVE, or to PENDING if the user never completed first login.
- **Create**:
  1. Generates `employeeNumber` (§3.4).
  2. Creates the user account.
  3. Assigns the default "Employee" access level, unless someone with `MANAGE_ACCESS_LEVEL` picks another.
  4. Sets the manager (§3.5).
  5. After commit, emails the welcome message.
- **Welcome credential.** Two options:
  - *Recommended:* a **one-time "set your password" link**, not a plain-text temporary password. The token is hashed in the DB, single-use, and expires in 72 h. Setting the password through the link *is* the forced first-login change (D9), so PENDING → ACTIVE happens there. No password ever travels by email.
  - *Alternative:* keep the temporary password + `mustChangePassword` (§9 Q2).
- Admins can **resend the welcome**, which invalidates the previous link or password.

### 3.3 Employee data and visibility

**Viewers:**
- **Self** is the employee.
- **Manager** is anyone above the employee in their reporting line; whether this means direct only or the full chain is §9 Q3.
- **Admin/HR** holds `VIEW_EMPLOYEE_SENSITIVE` / `MANAGE_EMPLOYEE`.
- **Colleague** is everyone else. All employees get `VIEW_EMPLOYEE` by default (D23).

| Data | Colleague | Self | Manager | Admin/HR | Who can edit |
|---|---|---|---|---|---|
| Name, employee number, work email, position, department, office, manager, status, photo | ✅ | ✅ | ✅ | ✅ | `MANAGE_EMPLOYEE` (employee number is generated, never edited) |
| Bio (DOB, gender, nationality, marital status…), personal phone/email | — | ✅ | ✅ | ✅ | Self |
| Addresses | — | ✅ | ✅ | ✅ | **Self only** (D10) |
| Identification documents (type + number) | — | ✅ | ✅ | ✅ | Self adds/removes; admin can correct (§9 Q3) |
| Date hired, position, department, manager | ✅ | ✅ | ✅ | ✅ | `MANAGE_EMPLOYEE` |
| Access level | — | ✅ | ✅ | ✅ | `MANAGE_ACCESS_LEVEL` |

The database id is never displayed. The employee number is the human-facing identifier (D11).

**Implementation:**
- Sensitive fields live on `Employee.privateDetails: EmployeePrivateDetails`.
- They are resolved by a `@SchemaMapping` guarded by an `EmployeeAccessPolicy`: `isSelf || isInManagementChain || has(VIEW_EMPLOYEE_SENSITIVE)`. Otherwise it returns `null`, with no error, so colleague views simply omit the section.
- The policy is one unit-tested class, used by both the resolvers and the UI's `me.can*` flags.

### 3.4 Employee number (D10, D21)

**Format:** `{COMPANY_LOCATION}-{OFFICE_PREFIX}-{SEQ}`

- Example: `GH-ACC-0042` is the 42nd employee hired into the Accra office of a company located in Ghana.
- `SEQ` is a per-office counter, zero-padded to 4 digits, growing to 5+ if needed. It is allocated under a row lock on the office (`SELECT … FOR UPDATE`), so concurrent hires never collide.
- A DB `UNIQUE` constraint backs it.
- **Immutable.** It never changes on transfer, re-hire or prefix edit; it records where the person was hired.
- Requires an office at creation, so **department becomes required when creating an employee**. The department determines the office.
- Visible to every colleague, never editable by anyone. Admins can only *view* it.

§9 Q1 asks whether "company location" means a country code (`GH`) or the company code (`AMT`).

### 3.5 Reporting line and manager-approved password reset (D24)

**Reporting line**
- `Employee.manager: Employee` (nullable, self-referencing). Set by `MANAGE_EMPLOYEE` on create/edit.
- Validation rejects self and cycles (walk up the chain).
- The manager must be ACTIVE and not archived.
- When a manager is archived, their reports are flagged in the admin UI as "needs new manager".
- `Employee.directReports` is resolved with `@BatchMapping`.
- An org-chart view becomes cheap later.

**Password reset flow.** There is no self-service email link; the request goes to a human.

1. On the login page, "Forgot password?" → the employee enters their work email.
   - The response is always the same generic message ("If the account exists, your manager has been notified"), so there is no account enumeration.
   - Rate-limited per IP and per email.
2. The backend creates a `PasswordResetRequest(PENDING)` and routes it to the **approver**:
   - the employee's manager if ACTIVE;
   - otherwise anyone with `MANAGE_EMPLOYEE`.

   Approvers get an email and an in-app badge.
3. The approver opens **Requests** (a new nav item, shown only to people with pending requests), sees who asked and when, and **Approves** or **Declines** (with an optional note).
   - Nobody can approve their own request.
   - Requests expire after 72 h.
4. **On approve:**
   - The employee gets a **one-time reset link** at their work email (same mechanism as the welcome link: hashed token, single use, 1 h).
   - **The manager never sees or sets the password.**
   - All the employee's sessions are revoked.
5. **On decline**, the employee is emailed that the request was declined and told to contact their manager.
6. Every step is recorded in an append-only `audit_events` table (actor, action, target, timestamp, IP).
7. Admins with `MANAGE_EMPLOYEE` can also **issue a reset directly** from the employee's page. The same link is sent, with no request step.

**Logged-in password change:** `changePassword(current, new)` also stays available.

---

## 4. Implementation plan (feature slices)

Every slice follows the project's own flow:

1. Design note.
2. Your approval.
3. Branch `feat/<slice>` off `develop`.
4. Backend, then regenerate types, then frontend.
5. Tests.
6. Demo checklist run in docker compose.
7. PR into `develop`.
8. Contribution log entry.

### Slice 0: Foundations (no feature behaviour change)

**0.0 Relocate out of OneDrive (D28)**
- `git clone` the backend repo to `C:\Users\LinusTabari\Downloads\ems`, then carry over the uncommitted working-tree changes (the 4 modified + 3 untracked files listed in the review; **not** `certificates.zip`, `target/`, `.env`).
- Copy `ems-fn` source (without `node_modules`, `dist`, `.angular`, the empty `ems-frontend/`) to a staging folder for 0.2.
- Copy your local `.env` and the PEM keys to `backend/.keys/` (gitignored), so the app still runs.
- The OneDrive folders stay untouched as a backup until you delete them.
- Verify: `git status` matches, and `./mvnw -q -DskipTests package` builds in the new location.

**0.1 Commit pending work (D17, D27)**
- Branch `chore/commit-pending-work` off `develop`.
- Commit the `VIEW_SELF`/`MANAGE_SELF` change, the `ARCHIVED` enum fix, V10, `employee-welcome.txt` and the new controller tests.
- Delete `certificates.zip`; add `*.zip`, `*.pem`, `*.key`, `.keys/`, `.env` patterns to `.gitignore`.
- Verify no key material is in history (`git log --all -- '*.pem' '*.zip'`).
- PR into `develop`.

**0.2 Monorepo**
- In the existing repo: `git mv` backend → `backend/` (history kept).
- Import `ems-fn` → `frontend/`, without `node_modules`, `dist`, `.angular` or the empty `ems-frontend/`.
- Add root `.gitignore`, `README.md`, `docs/` (review + this spec).
- `ems-fn/` stays on disk until you delete it.

**0.3 CI/CD (independent pipelines)**
- `backend.yml` (paths `backend/**`):
  1. Generate throwaway RSA keys in a step.
  2. `mvn verify` with JaCoCo (report now, gate later) and Testcontainers.
  3. Build and push the backend image to GHCR on `main`.
- `frontend.yml` (paths `frontend/**` + `backend/src/main/resources/graphql/**`, since the schema drives codegen):
  1. Lint, test.
  2. Codegen check: the generated types must match the schema.
  3. Build, then push the frontend image / static bundle on `main`.
- Each pipeline releases alone.
- A schema change that breaks the frontend fails the **frontend** pipeline in the same PR, so the contract is checked without coupling the deployments.
- Deploy targets are added in Slice 7 (§9 Q5).
- Fixes the red CI.

**0.4 Config hygiene (12-factor: everything deploy-specific comes from env)**
- Base `application.yaml` holds every required property with env placeholders. Profiles: `dev`, `prod`, `test`.
- Default profile is **not** dev.
- Keys come from `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` (PEM) or `*_PATH`.
- `ALLOWED_ORIGINS`, `AUTH_COOKIE_*`, `MAIL_*`, `APP_FRONTEND_URL` (used for links in emails) are all env.
- Graceful shutdown; respect `PORT`.
- Complete `.env.example` per app.
- Remove leftover loggers and TRACE logging.

**0.5 docker-compose (local only, mirrors prod topology)**
- `postgres:17` (volume) and `mailpit`.
- `backend` on `:8080`: multi-stage Dockerfile; keys from `./backend/.keys`, generated by `scripts/generate_jwt_keys.py`.
- `frontend` on `:4200`: multi-stage build of `ng build`, then nginx with SPA fallback and `config.json` from env. **No API proxy.**
- These are two origins, exactly like prod.
- Health checks and `depends_on: service_healthy`.
- Each app also runs without compose (`./mvnw spring-boot:run`, `npm start`) against a compose-provided DB.

**0.6 Backend test infrastructure**
- `GraphQlTester` base class.
- Testcontainers Postgres running real Flyway migrations.
- Delete H2 and `test-migration`.

**0.7 Frontend tooling**
- angular-eslint, Prettier script, Vitest working (fix the broken spec), Playwright skeleton against compose.
- Apollo Angular + graphql-codegen (`client` preset, schema read from `backend/src/main/resources/graphql/**/*.graphqls`), so codegen needs no running server.

**0.8 Design-system workspace scaffold**
- Angular workspace projects `tokens`, `ui`, `icons` and Storybook, with empty components.
- Changesets, CI job for the library (build, test, Storybook build).

**Demo:**
- `docker compose up` gives a working (old-UI) app: frontend at `http://localhost:4200`, API at `http://localhost:8080`.
- CI is green on both apps.

### Slice DS: Design system v1 (before any UI slice)

1. **Direction Board.**
   - 2–3 visual directions, each rendered on login, directory and profile in light and dark, published as a page you can review.
   - You choose; that is the gate for steps 2–4.
2. **Tokens:**
   - The chosen direction becomes the DTCG token set: primitive → semantic → component tokens, light + dark.
   - Style Dictionary build and the automated contrast check.
   - Fonts self-hosted (variable WOFF2, `font-display: swap`, subset).
3. **Foundation + first components:**
   - Layout primitives, Icon, Button family, FormField, Input, PasswordInput, Checkbox, Switch, Alert, Toast, Spinner, Skeleton, Dialog, Menu, Tooltip, AppShell, NavItem, Avatar, Badge/StatusPill, EmptyState/ErrorState, theme toggle.
   - That is everything Slice 1 needs.
4. **Storybook docs site** with a token gallery and every component's states. a11y, visual and interaction tests are green in CI.
5. Remaining components (DataTable, Select/Combobox, DatePicker, Drawer, Tabs, Pagination, Stepper, CommandPalette, PermissionMatrix, StatCard…) are built **at the start of the slice that first needs them**, to the same bar.

**Demo:** the Storybook site in both themes; axe reports zero violations; a contrast report for every token pair.

### Slice 1: Auth & session

Covers I1, I13, C1, H1, H3, H5, H6, M4, M5, D4, D5, D6, D9.

**Backend**
- Minimal-claim JWT (15 min) plus per-request permission and status loading with cache.
- `auth_sessions` with hashing, rotation, reuse detection and multi-device.
- Fixed cookie path.
- Login refuses INACTIVE/ARCHIVED.
- One-time token service: hashed, single-use and expiring. It is shared by welcome/set-password and reset links (§3.2, §3.5). `POST /api/v1/auth/set-password` (token) and `POST /api/v1/auth/change-password` (current + new). The first password set moves PENDING → ACTIVE.
- `audit_events` table and an `AuditService` (login success/failure, logout, password set/change, session revoke).
- `logout` and `logout-all`.
- Rate limit and lockout.
- Case-insensitive email.
- `me` query: `{ account { email, mustChangePassword, lastLoginAt }, employee: Employee, permissions: [Permission!]! }`.
- (Manager-approved reset needs the reporting line, so it ships in Slice 4. Until then, admins issue resets directly.)

**Frontend**
- Login page (design system), with a theme toggle.
- Set-password page (from the email link) with a strength meter.
- Change-password page.
- App initializer with silent refresh, then `me`.
- Session store, Apollo + HttpClient auth links with single-flight refresh.
- Guards and `*hasPermission` driven by `me`.
- New shell: design-system AppShell with user menu (profile, theme, logout, logout everywhere).

**Tests**
- Session rotation/reuse, lockout, status gates, cookie attributes (MockMvc).
- `me` (GraphQlTester).
- Interceptor single-flight (Vitest).
- Playwright: first login, then forced password change, then dashboard; reload keeps the session; logout.

**Demo**
- Reloading keeps you logged in.
- Two browsers stay logged in at once.
- Deactivating a user kicks them out on their next request.

### Slice 2: Access levels & permissions

Covers C2, H2, I4, I6, I8, D7.

**Backend**
- Migration removes the dropped permissions from enum and DB.
- Seed Administrator / HR / Employee.
- `permissionCatalog` query.
- `updateAccessLevel(id, input { name, description, permissions: [Permission!] })` with **set semantics**. The add/remove mutations are removed.
- Assignment requires `MANAGE_ACCESS_LEVEL`; self-assignment is forbidden.
- Lockout guard.
- Archived levels grant nothing.
- Cache eviction.
- Fix the seeded null `createdDate` (G3).

**Frontend**
- `/settings/access-levels`: table, drawer editor with a permission matrix grouped by catalogue group, member picker (Autocomplete), confirmations.

**Tests**
- Escalation attempts are denied.
- Lockout guard.
- Matrix component.

**Demo**
- Remove a permission from a level; an affected user loses that UI and API access on their next request.

### Slice 3: Organisation structure (companies, offices, departments, positions)

Covers I3, I7, I11, I15, G1, G2, G5, G6, soft delete, uniqueness, indexes.

**Backend**
- New unified types, `XPage`, filters/sort.
- Fix the `id` argument and the self-excluding uniqueness checks.
- Per-company office codes and office `prefix`.
- Department unique per office.
- Lifecycle mutations.
- DB constraints and indexes migration.
- `@BatchMapping` for `company.offices`, `office.departments`, `office.company`, `department.office`.

**Frontend**
- Routed settings pages built on a reusable `app-data-table`: server pagination, sort, search, status filter.
- Create/edit in Drawer.
- Archive/activate with a confirmation Modal.
- Cascading Selects (company → office).

**Tests**
- GraphQlTester per module (covers the bugs that slipped).
- Table component.
- Playwright CRUD for one entity.

**Demo**
- Two companies, each with office `…-001`.
- "HR" department in two offices.
- Edit and save unchanged values.
- Lists above 20 items paginate.

### Slice 4: Employee management (admin) & directory

Covers I2, I9, I10, M5, M7, D9, D10, D11, D21–D24.

**Backend**
- `employeeNumber` generation (§3.4): `{LOCATION}-{OFFICE}-{SEQ}`, row-locked, immutable. Department is required on create.
- Reporting line: `manager` / `directReports`, with cycle validation (§3.5).
- `Employee` type with `@BatchMapping` relations and `privateDetails` gated by `EmployeeAccessPolicy` (self / manager chain / HR).
- Lifecycle `activate`/`deactivate`/`archive` (account disable + session revoke + cache evict).
- `resendWelcome`.
- **Manager-approved password reset** (§3.5): `requestPasswordReset` (public REST), `pendingResetRequests` query, `approveResetRequest` / `declineResetRequest`, and admin `issuePasswordReset`. Approver notification emails and audit events.
- `workEmail` change syncs the login email.
- `dateHired` persisted.
- Lazy-loading fix through batch mapping.
- Admin cannot edit addresses.

**Frontend**
- `/directory`: card/table toggle, search, filters (department, position, office, status), pagination.
- Read-only colleague profile, showing private sections only when the policy allows.
- ⌘K command palette for people search.
- `/employees` (admin): create (Stepper: basics, then placement + manager, then access), edit placement/manager, lifecycle actions with confirmations, resend welcome, issue reset.
- Forgot-password page.
- `/requests` inbox for approvers, with a nav badge count.

**Tests**
- Number generation concurrency.
- Visibility matrix (self / colleague / manager / HR / admin).
- Reset flow: no enumeration, no self-approval, fallback approver, expiry, sessions revoked.
- Manager cycle rejection.
- Lifecycle effects on login.
- Playwright: create employee, read the email in Mailpit, first login.

### Slice 5: My profile (self-service)

**Backend**
- `updateMyBio` and `updateMyContact` with patch semantics.
- Address CRUD, with a single `isCurrent` enforced.
- Identification documents: self add/remove, visible per §3.3.
- `@Transactional` throughout.
- Real `Date` types.

**Frontend**
- `/me`, split into section components (`bio-section`, `contact-section`, `addresses-section`, `identifications-section`), each with view/edit mode.
- Design-system DatePicker, FormField and DescriptionList.

**Tests**
- Section components.
- Self-scoping (IDOR) GraphQlTester tests.

### Slice 6: Dashboard

**Backend**
- `companyId` filter applied to every count.
- Exclude archived records.
- Validate the period.
- `Date` inputs.
- Single aggregated query where practical.

**Frontend**
- StatCards with trend, company breakdown DataTable, period picker.
- Recent hires list linking to the directory.

### Slice 7: Hardening & portfolio polish

- Query depth/complexity limits; introspection off in prod.
- Coverage gates: backend 85% on touched modules, frontend 80% on core/shared.
- Accessibility pass (axe in Playwright) on every page, in both themes.
- README with an architecture diagram, screenshots and a "run in 1 command" section; ADRs in `docs/adr/`.
- Seed demo data profile (`demo`) for screenshots.
- **Deployment** (§9 Q5): CD jobs deploy each app to its host on `main`, with a smoke test of login → `me` against the deployed pair, and a staging environment if the hosts allow it.

---

## 5. Definition of done (every slice)

- [ ] Backend unit + GraphQlTester tests are green; new code is at or above the coverage target.
- [ ] Codegen is regenerated; `ng build` is strict with no `any` around GraphQL data.
- [ ] Frontend unit tests, plus the slice's Playwright scenario, run against compose.
- [ ] The demo checklist passes in `docker compose up`.
- [ ] No schema field the UI uses is unimplemented, and no UI call references a missing field (guaranteed by codegen + a CI build).
- [ ] README/ADR updated if behaviour or setup changed.
- [ ] Contribution log entry.

## 6. Risks

| Risk | Mitigation |
|---|---|
| Schema overhaul breaks the old UI mid-way | Slices replace UI and API together. The old pages for untouched areas keep working, because each slice only changes its own schema area. |
| Design system grows into a project of its own and stalls feature work | Build only what the next slice needs (Slice DS step 5). The Direction Board decision is the only up-front design cost. |
| Spring Boot 4 / Framework 7 ecosystem gaps (spring-retry, Bucket4j versions) | Pin versions; verify in Slice 0; replace spring-retry with Spring Framework 7's built-in `@Retryable` if needed. |
| Previews or staging on provider subdomains (cross-site) break silent refresh there | Give staging its own subdomains on the custom domain (`app-staging.<domain>`, `api-staging.<domain>`). Elsewhere, the user just logs in again after a reload. |
| Schema change breaks the separately deployed frontend | Additive-first schema changes, and `@deprecated` before removal. The frontend pipeline checks codegen against the schema. Deploy the backend before a frontend that depends on new fields. |
| Uncommitted work lost during the move | Clone, then copy the changed files; the OneDrive original is kept until you verify (Slice 0.0). |

## 7. Out of scope (unless you want them)

Profile photo upload, leave/attendance, audit-log UI, i18n, SSO.

## 8. Effort shape

Slice 0 and Slice 1 are the heaviest: they touch everything and build the foundations. Slices 3–5 are mostly repetition of the established pattern. Each slice is one PR.

---

## 9. Open decisions

Answered and recorded: Q-hard-delete (D20), directory (D23), sensitive visibility (D22), reset (D24), theme (D25), design system (D26), certificates (D27), location (D28), domain (D19).

1. **"Company location" in the employee number** (Slice 3). Which do you mean?
   - (a) a **country code** (`GH-ACC-0042`, where `GH` is ISO 3166 alpha-2), or
   - (b) the **company code** (`AMT-ACC-0042`), or
   - (c) a city/site code on the company?

   *Recommendation:* (a). It is short, standard and meaningful, and the office prefix already carries the city.
2. **Welcome credential** (Slice 1). Replace the emailed temporary password with a one-time **set-password link** (§3.2)? It still forces the employee to choose their own password before first use, but no password is ever emailed. *Recommendation:* yes.
3. **What a line manager can do** (Slice 4).
   - (a) Visibility over **direct reports only**, or the **whole chain** below them? *Recommendation:* the whole chain (a director sees their managers' teams).
   - (b) You said only "admins and employee managers" edit. Does "employee managers" mean **line managers** (they edit some fields of their reports, e.g. position/department), or **people holding `MANAGE_EMPLOYEE`** (HR)? *Recommendation:* line managers *view* and *approve resets*; edits stay with `MANAGE_EMPLOYEE`.
   - (c) Can admins/HR correct an employee's identification documents, or is that strictly self-service?
4. **Design system identity** (Slice DS, before the Direction Board).
   - A name for the package (the working name is "Kente").
   - Any brand anchors: colours you love or hate, apps whose look you admire (e.g. Linear, Vercel, Stripe, Raycast), and whether it should feel Ghanaian/African-inspired or neutral-global.
   - None is fine too; the Direction Board will propose.
5. **Hosting providers** (Slice 7 only). Which hosts for `app.` and `api.`? Nothing blocks on this until Slice 7.
6. **Branch flow.** `feat/<slice>` → PR into `develop`, with `develop` → `main` for releases. OK?
