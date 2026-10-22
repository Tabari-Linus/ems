# EMS — Employee Management System

Monorepo for development; each app is built, tested and deployed **independently**.

| Path | What | Stack |
|---|---|---|
| [`backend/`](backend/) | GraphQL API + REST auth | Spring Boot 4, Java 21, Spring GraphQL, Spring Security (JWT), PostgreSQL, Flyway |
| [`frontend/`](frontend/) | Web app | Angular 21, Apollo Angular, signals |
| [`docs/`](docs/) | Review, spec & plan, ADRs | — |

Production topology: frontend at `app.<domain>`, API at `api.<domain>` (same-site, separate deployments).
See [`docs/spec-and-plan.md`](docs/spec-and-plan.md) for the architecture and roadmap.

## Quick start

Setup instructions land with Slice 0 (docker-compose, key generation, env files).
