-- ============================================================
-- V8: Offboarding records and employee documents
-- ============================================================

CREATE TABLE offboarding_records (
    id                      UUID        NOT NULL DEFAULT gen_random_uuid(),
    employee_id             UUID        NOT NULL,
    exit_reason             VARCHAR(20) NOT NULL,
    last_working_day        DATE        NOT NULL,
    exit_interview_notes    TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'INITIATED',
    initiated_by_user_id    UUID        NOT NULL,
    employee_checklist_id   UUID,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_offboarding_records PRIMARY KEY (id),
    CONSTRAINT uq_offboarding_employee UNIQUE (employee_id),
    CONSTRAINT fk_offboarding_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE RESTRICT,
    CONSTRAINT fk_offboarding_initiator FOREIGN KEY (initiated_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_offboarding_checklist FOREIGN KEY (employee_checklist_id)
        REFERENCES employee_checklists (id) ON DELETE SET NULL,
    CONSTRAINT chk_offboarding_exit_reason CHECK (
        exit_reason IN ('RESIGNATION','TERMINATION','RETIREMENT','REDUNDANCY')
    ),
    CONSTRAINT chk_offboarding_status CHECK (
        status IN ('INITIATED','IN_PROGRESS','COMPLETED')
    )
);

CREATE INDEX idx_offboarding_records_status ON offboarding_records (status);

-- ────────────────────────────────────────────────────────────

CREATE TABLE employee_documents (
    id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
    employee_id             UUID         NOT NULL,
    document_type           VARCHAR(20)  NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    file_url                VARCHAR(500) NOT NULL,
    file_size_bytes         BIGINT,
    mime_type               VARCHAR(100),
    expiry_date             DATE,
    is_visible_to_employee  BOOLEAN      NOT NULL DEFAULT FALSE,
    uploaded_by_user_id     UUID         NOT NULL,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    deleted_at              TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_employee_documents PRIMARY KEY (id),
    CONSTRAINT fk_employee_documents_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_documents_uploader FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT chk_employee_documents_type CHECK (
        document_type IN ('CONTRACT','NATIONAL_ID','CERTIFICATE','CV','PASSPORT','OTHER')
    ),
    CONSTRAINT chk_employee_documents_status CHECK (
        status IN ('PENDING_REVIEW','APPROVED','REJECTED')
    )
);

CREATE INDEX idx_employee_documents_employee ON employee_documents (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employee_documents_expiry   ON employee_documents (expiry_date)  WHERE expiry_date IS NOT NULL AND deleted_at IS NULL;
