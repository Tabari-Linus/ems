-- ============================================================
-- V9: Notifications and Audit Logs
-- ============================================================

CREATE TABLE notifications (
    id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id                 UUID         NOT NULL,
    type                    VARCHAR(50)  NOT NULL,
    title                   VARCHAR(200) NOT NULL,
    message                 TEXT,
    reference_entity_type   VARCHAR(50),
    reference_entity_id     UUID,
    is_read                 BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at                 TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_notifications PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT chk_notifications_type CHECK (type IN (
        'ONBOARDING_TASK_DUE','OFFBOARDING_TASK_DUE','DOCUMENT_EXPIRY',
        'PROFILE_UPDATE_REQUEST','ROLE_CHANGE','DEPT_TRANSFER',
        'NEW_ACCOUNT','PASSWORD_RESET','TASK_ASSIGNED'
    ))
);

CREATE INDEX idx_notifications_user   ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;

-- ────────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    actor_user_id   UUID,
    action_type     VARCHAR(20) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT pk_audit_logs PRIMARY KEY (id),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_user_id)
        REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT chk_audit_logs_action CHECK (
        action_type IN ('CREATE','UPDATE','DELETE','VIEW_SENSITIVE','DOWNLOAD')
    )
);

CREATE INDEX idx_audit_logs_actor      ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
