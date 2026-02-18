# Employee Management System — Database Schema Design

> **Database:** PostgreSQL
> **ORM:** Spring Data JPA / Hibernate
> **Delete Strategy:** Soft delete (deleted_at) on all key entities
> **File Storage:** File path / URL reference (files stored externally, e.g., S3 or local disk)
> **Audit Strategy:** Dedicated `audit_logs` table capturing all CREATE / UPDATE / DELETE actions

---

## Entity Inventory

| # | Entity | Package | Purpose |
|---|--------|---------|---------|
| 1 | `company_profile` | system | Company settings and employee ID format config |
| 2 | `employment_types` | organization | Configurable employment types (Full-time, Part-time, etc.) |
| 3 | `departments` | organization | Org structure with self-referential parent/child support |
| 4 | `job_roles` | organization | Job titles with grade levels and managerial flag |
| 5 | `employees` | employee | Core employee record (personal + employment info) |
| 6 | `users` | auth | System user accounts linked to employees |
| 7 | `password_history` | auth | Last 5 password hashes per user (prevents reuse) |
| 8 | `refresh_tokens` | auth | HTTP-only cookie refresh tokens with server-side revocation |
| 9 | `password_reset_tokens` | auth | One-time password reset links (1-hour expiry) |
| 10 | `employment_history` | employee | Structured log of role / dept / manager / status changes |
| 11 | `profile_update_requests` | employee | Employee self-service change requests pending HR approval |
| 12 | `checklist_templates` | checklist | Onboarding and offboarding template definitions |
| 13 | `checklist_template_tasks` | checklist | Task definitions within a template |
| 14 | `employee_checklists` | checklist | Template instance assigned to a specific employee |
| 15 | `employee_checklist_tasks` | checklist | Individual task instances within an employee checklist |
| 16 | `offboarding_records` | offboarding | Exit details including reason, last day, and interview notes |
| 17 | `employee_documents` | document | File references for contracts, IDs, certificates, etc. |
| 18 | `notifications` | notification | In-app notifications for each user |
| 19 | `audit_logs` | audit | Immutable log of all system actions |

---

## Enum Reference

| Enum | Values |
|------|--------|
| `UserRole` | `SUPER_ADMIN`, `HR_MANAGER`, `DEPT_MANAGER`, `EMPLOYEE` |
| `Gender` | `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY` |
| `EmployeeStatus` | `ACTIVE`, `INACTIVE`, `PENDING` |
| `GradeLevel` | `JUNIOR`, `ASSOCIATE`, `L3`, `SENIOR`, `MANAGER`, `EXPERT` |
| `DepartmentStatus` | `ACTIVE`, `INACTIVE` |
| `JobRoleStatus` | `ACTIVE`, `INACTIVE` |
| `EmploymentHistoryChangeType` | `DEPARTMENT_CHANGE`, `ROLE_CHANGE`, `MANAGER_CHANGE`, `STATUS_CHANGE`, `EMPLOYMENT_TYPE_CHANGE` |
| `ChecklistType` | `ONBOARDING`, `OFFBOARDING` |
| `ChecklistStatus` | `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| `ChecklistTaskStatus` | `PENDING`, `COMPLETED`, `OVERDUE`, `SKIPPED` |
| `OwnerType` | `HR`, `IT`, `MANAGER`, `EMPLOYEE`, `FINANCE` |
| `ExitReason` | `RESIGNATION`, `TERMINATION`, `RETIREMENT`, `REDUNDANCY` |
| `OffboardingStatus` | `INITIATED`, `IN_PROGRESS`, `COMPLETED` |
| `DocumentType` | `CONTRACT`, `NATIONAL_ID`, `CERTIFICATE`, `CV`, `PASSPORT`, `OTHER` |
| `DocumentStatus` | `PENDING_REVIEW`, `APPROVED`, `REJECTED` |
| `ProfileUpdateStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `AuditActionType` | `CREATE`, `UPDATE`, `DELETE`, `VIEW_SENSITIVE`, `DOWNLOAD` |
| `NotificationType` | `ONBOARDING_TASK_DUE`, `OFFBOARDING_TASK_DUE`, `DOCUMENT_EXPIRY`, `PROFILE_UPDATE_REQUEST`, `ROLE_CHANGE`, `DEPT_TRANSFER`, `NEW_ACCOUNT`, `PASSWORD_RESET`, `TASK_ASSIGNED` |

---

## Entity Relationship Diagram

```mermaid
erDiagram

    %% ─────────────────────────────────────────
    %% SYSTEM
    %% ─────────────────────────────────────────
    COMPANY_PROFILE {
        UUID id PK
        VARCHAR company_name
        VARCHAR logo_url
        TEXT address
        VARCHAR registration_number
        VARCHAR contact_email
        VARCHAR employee_id_prefix
        INT employee_id_padding
        INT employee_id_current_sequence
        TIMESTAMP updated_at
        UUID updated_by_user_id FK
    }

    %% ─────────────────────────────────────────
    %% ORGANIZATION
    %% ─────────────────────────────────────────
    EMPLOYMENT_TYPES {
        UUID id PK
        VARCHAR name
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    DEPARTMENTS {
        UUID id PK
        VARCHAR name
        VARCHAR code
        TEXT description
        UUID parent_department_id FK
        UUID department_head_id FK
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    JOB_ROLES {
        UUID id PK
        VARCHAR title
        VARCHAR code
        VARCHAR grade_level
        UUID default_department_id FK
        TEXT description
        BOOLEAN is_managerial
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    %% ─────────────────────────────────────────
    %% EMPLOYEE
    %% ─────────────────────────────────────────
    EMPLOYEES {
        UUID id PK
        VARCHAR employee_number
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email
        VARCHAR phone
        DATE date_of_birth
        VARCHAR gender
        VARCHAR address_line1
        VARCHAR address_line2
        VARCHAR city
        VARCHAR state
        VARCHAR postal_code
        VARCHAR country
        VARCHAR national_id
        VARCHAR profile_photo_url
        DATE hire_date
        UUID employment_type_id FK
        VARCHAR status
        UUID department_id FK
        UUID job_role_id FK
        UUID line_manager_id FK
        VARCHAR emergency_contact_name
        VARCHAR emergency_contact_phone
        VARCHAR emergency_contact_relationship
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    EMPLOYMENT_HISTORY {
        UUID id PK
        UUID employee_id FK
        VARCHAR change_type
        TEXT old_value
        TEXT new_value
        UUID changed_by_user_id FK
        DATE effective_date
        TEXT notes
        TIMESTAMP created_at
    }

    PROFILE_UPDATE_REQUESTS {
        UUID id PK
        UUID employee_id FK
        UUID requested_by_user_id FK
        VARCHAR status
        JSONB requested_changes
        UUID reviewed_by_user_id FK
        TIMESTAMP reviewed_at
        TEXT rejection_reason
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% ─────────────────────────────────────────
    %% AUTH
    %% ─────────────────────────────────────────
    USERS {
        UUID id PK
        UUID employee_id FK
        VARCHAR email
        VARCHAR password_hash
        VARCHAR role
        INT failed_login_attempts
        TIMESTAMP locked_at
        BOOLEAN must_change_password
        BOOLEAN is_active
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    PASSWORD_HISTORY {
        UUID id PK
        UUID user_id FK
        VARCHAR password_hash
        TIMESTAMP created_at
    }

    REFRESH_TOKENS {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash
        TIMESTAMP expires_at
        TIMESTAMP revoked_at
        TIMESTAMP created_at
    }

    PASSWORD_RESET_TOKENS {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash
        TIMESTAMP expires_at
        TIMESTAMP used_at
        TIMESTAMP created_at
    }

    %% ─────────────────────────────────────────
    %% CHECKLIST (shared for Onboarding & Offboarding)
    %% ─────────────────────────────────────────
    CHECKLIST_TEMPLATES {
        UUID id PK
        VARCHAR name
        TEXT description
        VARCHAR type
        UUID applicable_employment_type_id FK
        UUID applicable_department_id FK
        BOOLEAN is_active
        UUID created_by_user_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CHECKLIST_TEMPLATE_TASKS {
        UUID id PK
        UUID template_id FK
        VARCHAR title
        TEXT description
        VARCHAR assigned_owner_type
        INT due_date_offset_days
        BOOLEAN is_mandatory
        INT sort_order
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    EMPLOYEE_CHECKLISTS {
        UUID id PK
        UUID employee_id FK
        UUID template_id FK
        VARCHAR type
        DATE reference_date
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    EMPLOYEE_CHECKLIST_TASKS {
        UUID id PK
        UUID employee_checklist_id FK
        UUID template_task_id FK
        VARCHAR title
        TEXT description
        VARCHAR assigned_owner_type
        UUID assigned_to_user_id FK
        DATE due_date
        BOOLEAN is_mandatory
        VARCHAR status
        TIMESTAMP completed_at
        UUID completed_by_user_id FK
        TEXT notes
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% ─────────────────────────────────────────
    %% OFFBOARDING
    %% ─────────────────────────────────────────
    OFFBOARDING_RECORDS {
        UUID id PK
        UUID employee_id FK
        VARCHAR exit_reason
        DATE last_working_day
        TEXT exit_interview_notes
        VARCHAR status
        UUID initiated_by_user_id FK
        UUID employee_checklist_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    %% ─────────────────────────────────────────
    %% DOCUMENTS
    %% ─────────────────────────────────────────
    EMPLOYEE_DOCUMENTS {
        UUID id PK
        UUID employee_id FK
        VARCHAR document_type
        VARCHAR name
        VARCHAR file_url
        BIGINT file_size_bytes
        VARCHAR mime_type
        DATE expiry_date
        BOOLEAN is_visible_to_employee
        UUID uploaded_by_user_id FK
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    %% ─────────────────────────────────────────
    %% NOTIFICATIONS
    %% ─────────────────────────────────────────
    NOTIFICATIONS {
        UUID id PK
        UUID user_id FK
        VARCHAR type
        VARCHAR title
        TEXT message
        VARCHAR reference_entity_type
        UUID reference_entity_id
        BOOLEAN is_read
        TIMESTAMP read_at
        TIMESTAMP created_at
    }

    %% ─────────────────────────────────────────
    %% AUDIT
    %% ─────────────────────────────────────────
    AUDIT_LOGS {
        UUID id PK
        UUID actor_user_id FK
        VARCHAR action_type
        VARCHAR entity_type
        UUID entity_id
        JSONB old_values
        JSONB new_values
        VARCHAR ip_address
        TEXT user_agent
        TIMESTAMP created_at
    }

    %% ─────────────────────────────────────────
    %% RELATIONSHIPS
    %% ─────────────────────────────────────────

    %% Auth
    USERS }o--|| EMPLOYEES : "linked to (1-to-1)"
    USERS ||--o{ PASSWORD_HISTORY : "has"
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "has"

    %% Organization hierarchy
    DEPARTMENTS }o--o| DEPARTMENTS : "child of (parent)"
    JOB_ROLES }o--o| DEPARTMENTS : "default department"
    COMPANY_PROFILE }o--o| USERS : "last updated by"

    %% Employee core
    EMPLOYEES }o--|| EMPLOYMENT_TYPES : "classified as"
    EMPLOYEES }o--|| DEPARTMENTS : "belongs to"
    EMPLOYEES }o--|| JOB_ROLES : "holds"
    EMPLOYEES }o--o| EMPLOYEES : "reports to (manager)"
    DEPARTMENTS }o--o| EMPLOYEES : "headed by"

    %% Employee extended
    EMPLOYEES ||--o{ EMPLOYMENT_HISTORY : "has"
    EMPLOYEES ||--o{ PROFILE_UPDATE_REQUESTS : "requests"
    EMPLOYEES ||--o{ EMPLOYEE_DOCUMENTS : "has"
    EMPLOYEES ||--o{ EMPLOYEE_CHECKLISTS : "assigned"
    EMPLOYEES ||--o| OFFBOARDING_RECORDS : "has"

    %% Checklists
    CHECKLIST_TEMPLATES ||--o{ CHECKLIST_TEMPLATE_TASKS : "contains"
    CHECKLIST_TEMPLATES ||--o{ EMPLOYEE_CHECKLISTS : "instantiated as"
    CHECKLIST_TEMPLATES }o--o| EMPLOYMENT_TYPES : "applicable to"
    CHECKLIST_TEMPLATES }o--o| DEPARTMENTS : "applicable to"
    EMPLOYEE_CHECKLISTS ||--o{ EMPLOYEE_CHECKLIST_TASKS : "contains"
    OFFBOARDING_RECORDS ||--|| EMPLOYEE_CHECKLISTS : "uses"

    %% Notifications & Audit
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "performs"
```

---

## Key Design Decisions

### Soft Deletes
All entities with `deleted_at` support soft deletion. Queries must filter `WHERE deleted_at IS NULL` for active records. Use `@Where(clause = "deleted_at IS NULL")` on entities via Hibernate filters.

### UUID Primary Keys
All tables use `UUID` primary keys generated via `@UuidGenerator` (Hibernate 6+) for distribution-safe IDs.

### Employment History vs Audit Log
- **`audit_logs`** — raw technical log of every field change across the entire system (actor, action, entity, old JSON, new JSON). Used by Super Admin.
- **`employment_history`** — structured HR-focused log scoped to key employment events (department transfer, role change, etc.). Used by HR Manager on an employee's profile tab.

### JSONB Columns
`profile_update_requests.requested_changes`, `audit_logs.old_values`, and `audit_logs.new_values` use PostgreSQL `JSONB` for flexible key-value storage. Mapped using `@JdbcTypeCode(SqlTypes.JSON)` in Hibernate 6+.

### Circular References (Department ↔ Employee)
- `departments.department_head_id` → `employees.id` (a department head is an employee)
- `employees.department_id` → `departments.id` (an employee belongs to a department)

This is a circular FK reference. At the DB level it is valid. At the application level, use `@JsonIgnore` or DTOs to avoid serialization loops.

### Self-Referential Relationships
- `departments.parent_department_id` → `departments.id` (sub-departments)
- `employees.line_manager_id` → `employees.id` (reporting hierarchy)

Circular manager chains (A → B → A) are prevented at the service layer before persisting.

### Checklist Template Pattern
Both onboarding and offboarding use the same two-level template pattern:
```
checklist_templates (type = ONBOARDING | OFFBOARDING)
    └── checklist_template_tasks (with due_date_offset_days)

employee_checklists (instantiated from a template)
    └── employee_checklist_tasks (calculated due_date = reference_date + offset)
```
`reference_date` = hire date for onboarding, last working day for offboarding.

### Company Profile (Single-Row Table)
`company_profile` is a singleton configuration table. Application code enforces that only one row exists. It stores both company identity fields and the employee ID auto-generation config (prefix, padding digits, current sequence).
