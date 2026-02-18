-- ============================================================
-- V4: Resolve the circular FK between departments ↔ employees,
--     then create the users table.
-- ============================================================

-- Now that employees exists, we can add the department head FK
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head FOREIGN KEY (department_head_id)
        REFERENCES employees (id) ON DELETE SET NULL;

CREATE INDEX idx_departments_head ON departments (department_head_id);

-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
    id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
    employee_id             UUID,
    email                   VARCHAR(255) NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    role                    VARCHAR(20)  NOT NULL,
    failed_login_attempts   INT          NOT NULL DEFAULT 0,
    locked_at               TIMESTAMP WITH TIME ZONE,
    must_change_password    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email       UNIQUE (email),
    CONSTRAINT uq_users_employee_id UNIQUE (employee_id),
    CONSTRAINT fk_users_employee    FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE RESTRICT,
    CONSTRAINT chk_users_role CHECK (role IN ('SUPER_ADMIN','HR_MANAGER','DEPT_MANAGER','EMPLOYEE'))
);

CREATE INDEX idx_users_employee ON users (employee_id);
CREATE INDEX idx_users_role     ON users (role) WHERE deleted_at IS NULL;

-- Also add the deferred FK from company_profile to users
ALTER TABLE company_profile
    ADD CONSTRAINT fk_company_profile_updated_by FOREIGN KEY (updated_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL;
