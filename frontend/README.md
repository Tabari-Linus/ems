# EMS frontend

Angular 21 single-page app for the Employee Management System: standalone components, signals,
signal forms, `OnPush` everywhere, Apollo Angular for GraphQL. It is deployed independently of the
backend and talks to it cross-origin; the API URL is runtime configuration, not part of the build.

## Prerequisites

- Node.js 22 LTS (CI and the container use 22; newer versions work locally) and npm 10+
- The backend API running on `http://localhost:8080` for anything beyond the login page
  (`docker compose up` from the repo root, or `./mvnw spring-boot:run` in `backend/`)
- Docker, only to build or run the production image

## Install

```bash
npm ci
```

## Runtime configuration (`config.json`)

`main.ts` fetches `/config.json` **before** bootstrapping and exposes it through the `APP_CONFIG`
injection token (`src/app/core/config/app-config.ts`). Nothing reads the API URL from the build.

```json
{ "apiUrl": "http://localhost:8080" }
```

- Local development uses `public/config.json` (served as `/config.json`). Edit it to point at
  another API.
- `apiUrl` must be an absolute `http(s)` URL; if the file is missing or invalid, the app logs an
  `AppConfigError` in the console and does not start.
- GraphQL goes to `{apiUrl}/graphql`; auth goes to `{apiUrl}/api/v1/auth/{login,refresh-token,logout}`
  with credentials (the refresh token is an HttpOnly cookie).
- In the container the file is generated at start-up from `API_URL` (see below).

## Development server

```bash
npm start            # ng serve on http://localhost:4200
```

There is no dev proxy: the browser calls the API on its own origin, exactly like production, so
the backend must allow `http://localhost:4200` in `ALLOWED_ORIGINS`.

## GraphQL code generation

Operations live in `src/app/**/*.graphql`. GraphQL Code Generator reads the schema straight from
`../backend/src/main/resources/graphql/**/*.graphqls` (no running server needed) and writes typed
Apollo Angular services to `src/app/graphql/generated.ts`, which is committed.

```bash
npm run codegen          # regenerate after changing a .graphql document or the backend schema
npm run codegen:check    # regenerate and fail if generated.ts differs from git (used in CI)
```

Inject the generated service (e.g. `PositionsGQL`) instead of writing query strings by hand.
`core/apollo/apollo.config.ts` configures the client: HTTP link to `{apiUrl}/graphql`, bearer token
and `apollo-require-preflight` headers, and an error link that maps errors to `AppError`
(`core/errors/`). Use `toAppError(err)` to turn any Apollo/HTTP error into that typed shape.

## Lint and format

```bash
npm run lint             # ng lint (angular-eslint, incl. template accessibility rules)
npm run format           # prettier --write .
npm run format:check     # prettier --check .
```

## Tests

### Unit (Vitest)

```bash
npm test                 # ng test, watch mode
npm run test:ci          # single headless run with v8 coverage -> coverage/ems-frontend/
```

### End-to-end (Playwright)

The E2E suite runs against an already running stack; it does not start a server.

```bash
npx playwright install chromium     # once
docker compose up -d                # from the repo root (or run the app yourself)
npm run e2e                         # base URL: E2E_BASE_URL or http://localhost:4200
```

## Design system (`projects/`)

Our own design-system packages live in this Angular workspace (architecture, token tiers and the
component definition of done: [`projects/README.md`](projects/README.md)):

- `@ems/tokens`: W3C DTCG tokens built by Style Dictionary into `--ems-*` CSS custom properties
  (light/dark), TS and JSON, with a WCAG contrast gate. **All values are placeholders** until the
  Slice DS Direction Board.
- `@ems/ui`: Angular library with secondary entry points (`@ems/ui/button`, `@ems/ui/theme`) and a
  global stylesheet built on cascade layers.
- `@ems/icons`: `<ui-icon>` over a curated Lucide set.

The app imports them from source through `tsconfig.json` paths (`@ems/ui/button`, …) and loads
`tokens.css` + `ui/styles/index.css` before `src/styles.scss`. Both are layered, so the legacy
unlayered styles still win and the current UI does not change.

```bash
npm run tokens:build            # DTCG sources -> projects/tokens/src/generated (commit the output)
npm run tokens:check-contrast   # WCAG contrast table for every declared pair, both themes
npm run lib:build               # ng build tokens, icons, ui -> dist/
npm run lib:test                # library unit tests, coverage gate 90% lines
npm run storybook               # docs site on http://localhost:6006
npm run storybook:build         # static Storybook in storybook-static/
npm run storybook:test          # every story: render + play (interactions) + axe
npm run test:visual             # light/dark screenshots of Button stories (after storybook:build)
npm run changeset               # record a change to an @ems/* package
```

## Production build

```bash
npm run build            # dist/ems-frontend/browser
```

## Container

`Dockerfile` builds the app on `node:22-alpine` and serves it with unprivileged nginx on port
8080 (`nginx.conf`): SPA fallback to `index.html`, `/healthz`, immutable caching for hashed assets,
`no-cache` for `index.html` and `config.json`, gzip and security headers. There is no API proxy.

At start-up `docker/40-ems-runtime-config.sh` writes `config.json` from `API_URL` and builds the
Content-Security-Policy with the API origin in `connect-src` (extra sources via
`CSP_CONNECT_EXTRA`, space-separated). The container refuses to start without a valid `API_URL`.

```bash
docker build -t ems-frontend:local .
docker run --rm -e API_URL=http://localhost:8080 -p 4200:8080 ems-frontend:local
# http://localhost:4200, health check: http://localhost:4200/healthz
```

## CI

`.github/workflows/frontend.yml` runs on changes to `frontend/**` or the backend GraphQL schema:
`npm ci`, lint, codegen check, unit tests with coverage (artifact), build. A parallel
`design-system` job runs the token drift check and contrast gate, builds and tests the libraries,
builds Storybook (artifact), runs the Storybook interaction/axe tests and the visual regression.
On `main` it also publishes `ghcr.io/<owner>/ems-frontend`.
