-- ============================================================
-- V1: Foundation lookup tables (no foreign key dependencies)
-- ============================================================

CREATE TABLE company_profile (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    company_name    VARCHAR(200) NOT NULL,
    logo_url        VARCHAR(500),
    address         TEXT,
    registration_number VARCHAR(100),
    contact_email   VARCHAR(255),
    employee_id_prefix          VARCHAR(10)  NOT NULL DEFAULT 'EMP',
    employee_id_padding         INT          NOT NULL DEFAULT 4,
    employee_id_current_sequence INT         NOT NULL DEFAULT 0,
    updated_by_user_id  UUID,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_company_profile PRIMARY KEY (id)
);

-- Enforce singleton: only one company profile row is allowed
ALTER TABLE company_profile
    ADD CONSTRAINT uq_company_profile_singleton UNIQUE (employee_id_prefix)
    DEFERRABLE INITIALLY DEFERRED;

COMMENT ON TABLE company_profile IS 'Singleton table — application enforces at most one row.';

-- ────────────────────────────────────────────────────────────

CREATE TABLE employment_types (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_employment_types PRIMARY KEY (id),
    CONSTRAINT uq_employment_types_name UNIQUE (name)
);

INSERT INTO employment_types (name) VALUES
    ('Full-time'),
    ('Part-time'),
    ('Contract'),
    ('Intern');
