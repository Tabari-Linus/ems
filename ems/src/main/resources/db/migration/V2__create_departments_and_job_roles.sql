-- ============================================================
-- V2: Departments and Job Roles
-- Note: departments.department_head_id FK to employees is added
--       in V4 after the employees table is created.
-- ============================================================

CREATE TABLE departments (
    id                    UUID         NOT NULL DEFAULT gen_random_uuid(),
    name                  VARCHAR(100) NOT NULL,
    code                  VARCHAR(20)  NOT NULL,
    description           TEXT,
    parent_department_id  UUID,
    department_head_id    UUID,                 -- FK to employees added in V4
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_departments PRIMARY KEY (id),
    CONSTRAINT uq_departments_code UNIQUE (code),
    CONSTRAINT fk_departments_parent FOREIGN KEY (parent_department_id)
        REFERENCES departments (id) ON DELETE RESTRICT,
    CONSTRAINT chk_departments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_departments_parent ON departments (parent_department_id);
CREATE INDEX idx_departments_status ON departments (status) WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────

CREATE TABLE job_roles (
    id                    UUID         NOT NULL DEFAULT gen_random_uuid(),
    title                 VARCHAR(100) NOT NULL,
    code                  VARCHAR(20)  NOT NULL,
    grade_level           VARCHAR(20)  NOT NULL,
    default_department_id UUID,
    description           TEXT,
    is_managerial         BOOLEAN      NOT NULL DEFAULT FALSE,
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_job_roles PRIMARY KEY (id),
    CONSTRAINT uq_job_roles_code UNIQUE (code),
    CONSTRAINT fk_job_roles_department FOREIGN KEY (default_department_id)
        REFERENCES departments (id) ON DELETE SET NULL,
    CONSTRAINT chk_job_roles_grade CHECK (grade_level IN ('JUNIOR','ASSOCIATE','L3','SENIOR','MANAGER','EXPERT')),
    CONSTRAINT chk_job_roles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_job_roles_department ON job_roles (default_department_id);
CREATE INDEX idx_job_roles_status ON job_roles (status) WHERE deleted_at IS NULL;
