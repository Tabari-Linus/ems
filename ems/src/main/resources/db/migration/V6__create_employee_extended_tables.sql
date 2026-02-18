-- ============================================================
-- V6: Employee extended tables
--     employment_history, profile_update_requests
-- ============================================================

CREATE TABLE employment_history (
    id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
    employee_id         UUID        NOT NULL,
    change_type         VARCHAR(40) NOT NULL,
    old_value           TEXT,
    new_value           TEXT,
    changed_by_user_id  UUID,
    effective_date      DATE,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_employment_history PRIMARY KEY (id),
    CONSTRAINT fk_employment_history_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_employment_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_employment_history_type CHECK (change_type IN (
        'DEPARTMENT_CHANGE','ROLE_CHANGE','MANAGER_CHANGE',
        'STATUS_CHANGE','EMPLOYMENT_TYPE_CHANGE'
    ))
);

CREATE INDEX idx_employment_history_employee ON employment_history (employee_id, created_at DESC);

-- ────────────────────────────────────────────────────────────

CREATE TABLE profile_update_requests (
    id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
    employee_id             UUID        NOT NULL,
    requested_by_user_id    UUID        NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    requested_changes       JSONB       NOT NULL,
    reviewed_by_user_id     UUID,
    reviewed_at             TIMESTAMP WITH TIME ZONE,
    rejection_reason        TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_profile_update_requests PRIMARY KEY (id),
    CONSTRAINT fk_profile_requests_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_requests_requester FOREIGN KEY (requested_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_profile_requests_reviewer FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_profile_requests_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))
);

CREATE INDEX idx_profile_requests_employee ON profile_update_requests (employee_id);
CREATE INDEX idx_profile_requests_status   ON profile_update_requests (status) WHERE status = 'PENDING';
