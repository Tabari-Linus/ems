-- ============================================================
-- V3: Employees
-- Self-referential FK (line_manager_id) is safe in the same table.
-- ============================================================

CREATE TABLE employees (
    id                              UUID         NOT NULL DEFAULT gen_random_uuid(),
    employee_number                 VARCHAR(20)  NOT NULL,
    first_name                      VARCHAR(100) NOT NULL,
    last_name                       VARCHAR(100) NOT NULL,
    email                           VARCHAR(255) NOT NULL,
    phone                           VARCHAR(20),
    date_of_birth                   DATE,
    gender                          VARCHAR(20),
    address_line1                   VARCHAR(255),
    address_line2                   VARCHAR(255),
    city                            VARCHAR(100),
    state                           VARCHAR(100),
    postal_code                     VARCHAR(20),
    country                         VARCHAR(100),
    national_id                     VARCHAR(50),
    profile_photo_url               VARCHAR(500),
    hire_date                       DATE,
    employment_type_id              UUID,
    status                          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    department_id                   UUID,
    job_role_id                     UUID,
    line_manager_id                 UUID,
    emergency_contact_name          VARCHAR(100),
    emergency_contact_phone         VARCHAR(20),
    emergency_contact_relationship  VARCHAR(50),
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at                      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_employees PRIMARY KEY (id),
    CONSTRAINT uq_employees_number  UNIQUE (employee_number),
    CONSTRAINT uq_employees_email   UNIQUE (email),
    CONSTRAINT uq_employees_national_id UNIQUE (national_id),
    CONSTRAINT fk_employees_employment_type FOREIGN KEY (employment_type_id)
        REFERENCES employment_types (id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_department FOREIGN KEY (department_id)
        REFERENCES departments (id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_job_role FOREIGN KEY (job_role_id)
        REFERENCES job_roles (id) ON DELETE RESTRICT,
    CONSTRAINT fk_employees_manager FOREIGN KEY (line_manager_id)
        REFERENCES employees (id) ON DELETE SET NULL,
    CONSTRAINT chk_employees_status CHECK (status IN ('ACTIVE','INACTIVE','PENDING')),
    CONSTRAINT chk_employees_gender CHECK (gender IN ('MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY')),
    CONSTRAINT chk_employees_no_self_manage CHECK (id <> line_manager_id)
);

CREATE INDEX idx_employees_department   ON employees (department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_job_role     ON employees (job_role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_manager      ON employees (line_manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status       ON employees (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_name         ON employees (last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_hire_date    ON employees (hire_date) WHERE deleted_at IS NULL;
