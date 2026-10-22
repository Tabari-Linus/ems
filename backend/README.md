# EMS backend

Spring Boot 4 · Java 21 · Spring GraphQL · Spring Security (self-issued RSA JWT) · PostgreSQL + Flyway.

| Endpoint | Purpose |
|---|---|
| `POST /graphql` | GraphQL API (Bearer access token) |
| `POST /api/v1/auth/login`, `/refresh-token`, `/logout` | REST auth; the refresh token travels in an `HttpOnly` cookie scoped to `/api/v1/auth` |
| `GET /actuator/health/liveness`, `/readiness` | Health probes |
| `GET /graphiql` | GraphiQL UI (`dev` profile only) |

All commands below run from `backend/`.

## Prerequisites

- JDK 21 (the Maven wrapper downloads Maven itself)
- Docker: needed for the integration tests (Testcontainers) and for building the image; unit tests run without it
- `openssl` (Git Bash ships it on Windows) to generate the JWT keys
- PostgreSQL 17 for running locally: use `docker compose up postgres mailpit` from the repo root, or your own instance

## 1. Generate JWT keys

```sh
scripts/generate-jwt-keys.sh          # writes ./.keys/jwt-private-key.pem and jwt-public-key.pem
scripts/generate-jwt-keys.sh --force  # rotate (invalidates issued tokens)
```

`.keys/` is gitignored. Keys are never read from the classpath and never baked into the image.
The private key is written with mode `600`; on a Linux Docker host the container user (uid 10001) cannot
read a bind-mounted `600` file owned by you, so for local compose use `chmod 644 .keys/jwt-private-key.pem`
(local throwaway keys only; deployed keys belong in the host's secret store).

## 2. Configure

```sh
cp .env.example .env   # then edit; at least DB_PASSWORD and ADMIN_PASSWORD
```

Every setting comes from environment variables; `.env.example` documents each one with its default.
Profiles: `dev` (GraphiQL, introspection, DEBUG app logs), `prod` (graceful shutdown, forwarded headers,
secure cookie by default). No profile is active by default.

| Variable | Default | Notes |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | none | `dev` locally, `prod` when deployed |
| `PORT` | `8080` | |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `jdbc:postgresql://localhost:5432/ems` / `ems` / required | |
| `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` | `./.keys/jwt-*-key.pem` | |
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | unset | inline PEM, overrides the paths |
| `JWT_EXPIRATION_MS` / `JWT_REFRESH_EXPIRATION_MS` | 8 h / 7 d | |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@ems.local` / required for seeding | |
| `ALLOWED_ORIGINS` | `http://localhost:4200` | comma-separated |
| `APP_FRONTEND_URL` | `http://localhost:4200` | links in emails |
| `AUTH_COOKIE_SECURE` / `AUTH_COOKIE_SAMESITE` / `AUTH_COOKIE_PATH` | `false` (`true` in prod) / `Lax` / `/api/v1/auth` | |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_FROM` | `localhost` / `1025` / empty / empty / `no-reply@ems.local` | Mailpit defaults |
| `MAIL_SMTP_AUTH` / `MAIL_SMTP_STARTTLS` | `false` / `false` | `true` for real SMTP providers |

## 3. Run locally

```sh
set -a; . ./.env; set +a     # load .env into the shell (or use your IDE's env-file support)
./mvnw spring-boot:run       # Windows PowerShell: .\mvnw.cmd spring-boot:run
```

Flyway applies `src/main/resources/db/migration` on startup and Hibernate validates the schema
(`ddl-auto: validate`). The administrator account is seeded on first start.

## 4. Test

Tests are split by naming convention:

| Kind | Name | Runner | Needs |
|---|---|---|---|
| Unit | `*Test` | Surefire, `test` phase | nothing (Mockito, no Spring context) |
| Integration | `*IT` | Failsafe, `integration-test` phase | a running Docker daemon |

```sh
./mvnw test                       # unit tests only — fast, no Docker
./mvnw verify                     # unit + integration tests
./mvnw verify -DskipUnitTests     # integration tests only
./mvnw verify -DskipITs           # unit tests only, plus packaging
```

Integration tests start PostgreSQL 17 with Testcontainers, apply the real Flyway migrations, and generate a
throwaway RSA key pair in-JVM, so no local database, keys or `.env` are needed.

JaCoCo writes unit-test coverage to `target/site/jacoco/index.html` and combined unit + integration
coverage to `target/site/jacoco-merged/index.html`.

Anything that boots a Spring context (`@SpringBootTest`, Testcontainers) is an integration test and must be
named `*IT`. New end-to-end GraphQL tests extend `AbstractGraphQlIntegrationTest`, which provides an
anonymous `graphQlTester()` and an `adminGraphQlTester()` authenticated through the real login endpoint.

## 5. Build the image

```sh
docker build -t ems-backend:local .
docker run --rm -p 8080:8080 --env-file .env \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/ems \
  -e JWT_PRIVATE_KEY_PATH=/run/keys/jwt-private-key.pem \
  -e JWT_PUBLIC_KEY_PATH=/run/keys/jwt-public-key.pem \
  -v "$PWD/.keys:/run/keys:ro" \
  ems-backend:local
```

The image runs as a non-root user, exposes `8080`, honours `JAVA_OPTS` (default
`-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError`) and has a `HEALTHCHECK` on
`/actuator/health/liveness`. CI (`.github/workflows/backend.yml`) runs `./mvnw verify` on every change
under `backend/` and pushes `ghcr.io/<owner>/ems-backend` on `main`.
