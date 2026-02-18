# Employee Management System (EMS)

A production-ready REST API backend for managing employees, departments, onboarding/offboarding workflows, documents, and audit trails within a single organisation. Built with Spring Boot 4 and Java 21.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Create the Database](#2-create-the-database)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run the Application](#4-run-the-application)
- [Configuration Profiles](#configuration-profiles)
- [Database Migrations](#database-migrations)
- [Domain Model](#domain-model)
- [API Overview](#api-overview)
- [Branch Naming Conventions](#branch-naming-conventions)

---

## Features

| Epic | Description |
|------|-------------|
| Authentication | Login, logout, password change, forgot/reset password, account locking |
| Employee Management | Create, update, deactivate, reactivate employees with auto-generated employee IDs |
| Department Management | Hierarchical departments with a designated head, immutable department codes |
| Job Roles | Grade-levelled roles (Junior → Expert) with immutable role codes |
| Employment Types | Full-time, Part-time, Contract, Intern (configurable) |
| Org Hierarchy | Line manager assignments and org tree traversal |
| Onboarding | Checklist templates auto-assigned on employee creation |
| Offboarding | Initiated workflows with checklists and exit interview recording |
| Documents | Upload, review, and approve employee documents with expiry tracking |
| Profile Update Requests | Employees submit changes; HR approves or rejects |
| Audit Logging | Immutable log of every create/update/delete/sensitive-view action |
| Notifications | In-app alerts for task deadlines, document expiry, role changes, and more |
| System Administration | Company profile settings and employee ID sequence configuration |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Language |
| Spring Boot | 4.0.2 | Application framework |
| Spring Data JPA | (Boot-managed) | ORM / repository layer |
| Hibernate | 7.2.1 | JPA implementation |
| PostgreSQL | 15+ | Primary database |
| Flyway | (Boot-managed) | Database schema migrations |
| Lombok | (Boot-managed) | Boilerplate reduction |
| Jakarta Validation | (Boot-managed) | Bean validation |
| HikariCP | (Boot-managed) | Connection pooling |
| Maven | 3.9+ | Build tool |

---

## Project Structure

```
src/
└── main/
    ├── java/com/mrlii/ems/
    │   ├── EmsApplication.java
    │   ├── config/
    │   │   └── JpaConfig.java               # @EnableJpaAuditing
    │   ├── controller/
    │   │   └── HealthController.java
    │   ├── domain/
    │   │   ├── entity/
    │   │   │   ├── base/                    # BaseEntity, SoftDeletableEntity
    │   │   │   ├── auth/                    # User, RefreshToken, PasswordHistory, PasswordResetToken
    │   │   │   ├── organization/            # Department, JobRole, EmploymentType
    │   │   │   ├── employee/                # Employee, EmploymentHistory, ProfileUpdateRequest
    │   │   │   ├── checklist/               # ChecklistTemplate, ChecklistTemplateTask,
    │   │   │   │                            # EmployeeChecklist, EmployeeChecklistTask
    │   │   │   ├── document/                # EmployeeDocument
    │   │   │   ├── offboarding/             # OffboardingRecord
    │   │   │   ├── notification/            # Notification
    │   │   │   ├── audit/                   # AuditLog
    │   │   │   └── system/                  # CompanyProfile
    │   │   └── enums/                       # 18 enum types
    │   └── dto/
    │       ├── common/                      # PageResponse<T>
    │       ├── auth/                        # Login, ChangePassword, ForgotPassword, ResetPassword
    │       ├── department/
    │       ├── jobrole/
    │       ├── employmenttype/
    │       ├── employee/
    │       ├── employmenthistory/
    │       ├── profileupdate/
    │       ├── checklist/
    │       ├── offboarding/
    │       ├── document/
    │       ├── notification/
    │       ├── audit/
    │       └── system/
    └── resources/
        ├── application.yaml                 # Base config (shared across all profiles)
        ├── application-dev.yaml             # Development overrides
        ├── application-prod.yaml            # Production overrides
        └── db/migration/
            ├── V1__create_company_profile_and_employment_types.sql
            ├── V2__create_departments_and_job_roles.sql
            ├── V3__create_employees.sql
            ├── V4__add_department_head_fk_and_create_users.sql
            ├── V5__create_auth_support_tables.sql
            ├── V6__create_employee_extended_tables.sql
            ├── V7__create_checklists.sql
            ├── V8__create_offboarding_and_documents.sql
            └── V9__create_notifications_and_audit_logs.sql
```

---

## Prerequisites

- **Java 21** — [Download](https://adoptium.net/)
- **Maven 3.9+** — [Download](https://maven.apache.org/download.cgi)
- **PostgreSQL 15+** — [Download](https://www.postgresql.org/download/)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ems
```

### 2. Create the Database

Connect to your PostgreSQL instance and create the database:

```sql
CREATE DATABASE ems_db;
```

Flyway will create all tables automatically on first startup.

### 3. Configure Environment Variables

The application reads credentials from environment variables. For local development, the only required variable is the database password (all others have defaults).

| Variable | Default | Description |
|---|---|---|
| `APP_PROFILE` | `dev` | Active Spring profile (`dev` or `prod`) |
| `SERVER_PORT` | `8080` | HTTP server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `ems_db` | Database name |
| `DB_USERNAME` | `postgres` | Database user |
| `DB_PASSWORD` | _(required)_ | Database password |

Set the password before running:

```bash
# Linux / macOS
export DB_PASSWORD=your_password

# Windows (Command Prompt)
set DB_PASSWORD=your_password

# Windows (PowerShell)
$env:DB_PASSWORD="your_password"
```

> In production, `DB_HOST`, `DB_NAME`, and `DB_USERNAME` have **no defaults** and must be set explicitly.

### 4. Run the Application

**Using Maven:**

```bash
./mvnw spring-boot:run
```

**Using a packaged JAR:**

```bash
./mvnw clean package -DskipTests
java -jar target/ems-0.0.1-SNAPSHOT.jar
```

**With an explicit profile:**

```bash
java -jar target/ems-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

The application starts on `http://localhost:8080` by default.

**Health check:**

```
GET http://localhost:8080/health
```

---

## Configuration Profiles

| Setting | `dev` | `prod` |
|---|---|---|
| `ddl-auto` | `update` | `validate` |
| `show-sql` | `true` | `false` |
| SQL formatting | `true` | `false` |
| Flyway `baseline-on-migrate` | `true` | `false` |
| DB credentials | Defaults provided | All env vars required |
| HikariCP pool | Default | Max 20 connections |
| Log level (application) | `DEBUG` | `INFO` |
| Log level (root) | Default | `WARN` |

Profiles are activated via the `APP_PROFILE` environment variable (defaults to `dev`).

---

## Database Migrations

Schema is managed exclusively by **Flyway**. Migrations live in `src/main/resources/db/migration/` and run automatically on startup.

| Version | Description |
|---|---|
| V1 | Company profile settings and employment types (with seed data) |
| V2 | Departments and job roles |
| V3 | Employees (with self-referential line manager FK) |
| V4 | Department head FK (resolves circular dependency) and users table |
| V5 | Auth support tables: password history, refresh tokens, password reset tokens |
| V6 | Employment history and profile update requests (JSONB) |
| V7 | Checklist templates and employee checklist instances |
| V8 | Offboarding records and employee documents |
| V9 | Notifications and audit logs (JSONB) |

**Notes:**
- Never edit an existing migration file after it has been applied to any environment.
- Add schema changes as new versioned migration files (`V10__...`, etc.).
- In `prod`, `baseline-on-migrate` is disabled — migrations must be sequential and clean.

---

## Domain Model

### Entities (21 classes)

| Group | Entity | Table |
|---|---|---|
| Base | `BaseEntity`, `SoftDeletableEntity` | _(abstract)_ |
| Auth | `User`, `PasswordHistory`, `RefreshToken`, `PasswordResetToken` | `users`, `password_history`, `refresh_tokens`, `password_reset_tokens` |
| Organisation | `Department`, `JobRole`, `EmploymentType` | `departments`, `job_roles`, `employment_types` |
| Employee | `Employee`, `EmploymentHistory`, `ProfileUpdateRequest` | `employees`, `employment_history`, `profile_update_requests` |
| Checklist | `ChecklistTemplate`, `ChecklistTemplateTask`, `EmployeeChecklist`, `EmployeeChecklistTask` | `checklist_templates`, `checklist_template_tasks`, `employee_checklists`, `employee_checklist_tasks` |
| Documents | `EmployeeDocument` | `employee_documents` |
| Offboarding | `OffboardingRecord` | `offboarding_records` |
| Notifications | `Notification` | `notifications` |
| Audit | `AuditLog` | `audit_logs` |
| System | `CompanyProfile` | `company_profile` |

### Key Design Decisions

- **Soft delete** — All employee-facing entities use `deleted_at` + `@SQLRestriction("deleted_at IS NULL")` so deleted records are invisible to standard queries.
- **Immutable codes** — `Department.code` and `JobRole.code` are `@Column(updatable = false)` and setter-restricted per business rules.
- **UUID primary keys** — All entities use `@GeneratedValue(strategy = GenerationType.UUID)`.
- **Audit trail** — Every mutation is recorded in `audit_logs` with old/new values stored as JSONB.
- **JSONB columns** — `audit_logs.old_values/new_values` and `profile_update_requests.requested_changes` use PostgreSQL JSONB.
- **Checklist pattern** — Templates (`ChecklistTemplate` / `ChecklistTemplateTask`) are cloned into employee instances (`EmployeeChecklist` / `EmployeeChecklistTask`) at onboarding/offboarding time. Both share a `type` discriminator (`ONBOARDING` / `OFFBOARDING`).
- **Circular FK resolution** — `departments.department_head_id → employees` is added in V4 (after employees table is created in V3) to break the creation-order deadlock.
- **Session management** — Refresh tokens are stored in the database (`refresh_tokens` table) and delivered via HTTP-only cookies. Access tokens are short-lived JWTs returned in the login response body.

### Enums (18 types)

`UserRole` · `Gender` · `EmployeeStatus` · `GradeLevel` · `DepartmentStatus` · `JobRoleStatus` · `EmploymentHistoryChangeType` · `ChecklistType` · `ChecklistStatus` · `ChecklistTaskStatus` · `OwnerType` · `ExitReason` · `OffboardingStatus` · `DocumentType` · `DocumentStatus` · `ProfileUpdateStatus` · `AuditActionType` · `NotificationType`

---

## API Overview

All endpoints return JSON. Paginated list endpoints return a `PageResponse<T>` wrapper:

```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 100,
  "totalPages": 5,
  "last": false
}
```

| Domain | Base Path | Key Operations |
|---|---|---|
| Auth | `/api/auth` | Login, logout, change password, forgot/reset password |
| Employees | `/api/employees` | CRUD, deactivate, reactivate, employment history |
| Departments | `/api/departments` | CRUD, hierarchy |
| Job Roles | `/api/job-roles` | CRUD |
| Employment Types | `/api/employment-types` | CRUD |
| Profile Updates | `/api/profile-update-requests` | Submit, approve/reject |
| Checklists | `/api/checklist-templates` | Template CRUD, employee checklist tracking |
| Offboarding | `/api/offboarding` | Initiate, track tasks, record exit interview |
| Documents | `/api/employees/{id}/documents` | Upload, approve/reject, download |
| Notifications | `/api/notifications` | List, mark as read |
| Audit Logs | `/api/audit-logs` | Read-only log access (HR / Super Admin) |
| System | `/api/system/company-profile` | View and update company settings |

> Full API specification will be documented via OpenAPI / Swagger once the controller layer is implemented.

---

## Branch Naming Conventions

| Prefix | Purpose |
|---|---|
| `feature/` | New feature |
| `fix/` | Bug fix |
| `hotfix/` | Urgent production fix |
| `refactor/` | Code improvement (no behaviour change) |
| `chore/` | Maintenance (dependencies, configs) |
| `docs/` | Documentation only |
| `test/` | Adding or fixing tests |

**Examples:**
```
feature/employee-crud-endpoints
fix/flyway-baseline-version
chore/add-spring-security-dependency
docs/update-readme
```
