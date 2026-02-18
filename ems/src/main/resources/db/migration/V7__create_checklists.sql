-- ============================================================
-- V7: Checklist tables (shared for onboarding and offboarding)
-- ============================================================

CREATE TABLE checklist_templates (
    id                              UUID         NOT NULL DEFAULT gen_random_uuid(),
    name                            VARCHAR(150) NOT NULL,
    description                     TEXT,
    type                            VARCHAR(20)  NOT NULL,
    applicable_employment_type_id   UUID,
    applicable_department_id        UUID,
    is_active                       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by_user_id              UUID,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_checklist_templates PRIMARY KEY (id),
    CONSTRAINT fk_checklist_templates_employment_type FOREIGN KEY (applicable_employment_type_id)
        REFERENCES employment_types (id) ON DELETE SET NULL,
    CONSTRAINT fk_checklist_templates_department FOREIGN KEY (applicable_department_id)
        REFERENCES departments (id) ON DELETE SET NULL,
    CONSTRAINT fk_checklist_templates_creator FOREIGN KEY (created_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_checklist_templates_type CHECK (type IN ('ONBOARDING','OFFBOARDING'))
);

CREATE INDEX idx_checklist_templates_type ON checklist_templates (type) WHERE is_active = TRUE;

-- ────────────────────────────────────────────────────────────

CREATE TABLE checklist_template_tasks (
    id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
    template_id             UUID         NOT NULL,
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    assigned_owner_type     VARCHAR(20)  NOT NULL,
    due_date_offset_days    INT          NOT NULL DEFAULT 0,
    is_mandatory            BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order              INT          NOT NULL DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_checklist_template_tasks PRIMARY KEY (id),
    CONSTRAINT fk_checklist_template_tasks_template FOREIGN KEY (template_id)
        REFERENCES checklist_templates (id) ON DELETE CASCADE,
    CONSTRAINT chk_checklist_template_tasks_owner CHECK (
        assigned_owner_type IN ('HR','IT','MANAGER','EMPLOYEE','FINANCE')
    )
);

CREATE INDEX idx_checklist_template_tasks_template ON checklist_template_tasks (template_id, sort_order);

-- ────────────────────────────────────────────────────────────

CREATE TABLE employee_checklists (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    employee_id     UUID        NOT NULL,
    template_id     UUID,
    type            VARCHAR(20) NOT NULL,
    reference_date  DATE        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_employee_checklists PRIMARY KEY (id),
    CONSTRAINT fk_employee_checklists_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_checklists_template FOREIGN KEY (template_id)
        REFERENCES checklist_templates (id) ON DELETE SET NULL,
    CONSTRAINT chk_employee_checklists_type   CHECK (type IN ('ONBOARDING','OFFBOARDING')),
    CONSTRAINT chk_employee_checklists_status CHECK (status IN ('IN_PROGRESS','COMPLETED','CANCELLED'))
);

CREATE INDEX idx_employee_checklists_employee ON employee_checklists (employee_id);
CREATE INDEX idx_employee_checklists_status   ON employee_checklists (status) WHERE status = 'IN_PROGRESS';

-- ────────────────────────────────────────────────────────────

CREATE TABLE employee_checklist_tasks (
    id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
    employee_checklist_id   UUID         NOT NULL,
    template_task_id        UUID,
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    assigned_owner_type     VARCHAR(20)  NOT NULL,
    assigned_to_user_id     UUID,
    due_date                DATE,
    is_mandatory            BOOLEAN      NOT NULL DEFAULT TRUE,
    status                  VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    completed_at            TIMESTAMP WITH TIME ZONE,
    completed_by_user_id    UUID,
    notes                   TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_employee_checklist_tasks PRIMARY KEY (id),
    CONSTRAINT fk_checklist_tasks_checklist FOREIGN KEY (employee_checklist_id)
        REFERENCES employee_checklists (id) ON DELETE CASCADE,
    CONSTRAINT fk_checklist_tasks_template_task FOREIGN KEY (template_task_id)
        REFERENCES checklist_template_tasks (id) ON DELETE SET NULL,
    CONSTRAINT fk_checklist_tasks_assignee FOREIGN KEY (assigned_to_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_checklist_tasks_completer FOREIGN KEY (completed_by_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_checklist_tasks_owner CHECK (
        assigned_owner_type IN ('HR','IT','MANAGER','EMPLOYEE','FINANCE')
    ),
    CONSTRAINT chk_checklist_tasks_status CHECK (
        status IN ('PENDING','COMPLETED','OVERDUE','SKIPPED')
    )
);

CREATE INDEX idx_employee_checklist_tasks_checklist ON employee_checklist_tasks (employee_checklist_id);
CREATE INDEX idx_employee_checklist_tasks_assignee  ON employee_checklist_tasks (assigned_to_user_id) WHERE status = 'PENDING';
CREATE INDEX idx_employee_checklist_tasks_due       ON employee_checklist_tasks (due_date) WHERE status = 'PENDING';
