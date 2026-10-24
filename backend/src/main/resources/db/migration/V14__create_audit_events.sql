-- Slice 1: append-only security audit trail (logins, lockouts, logouts, session reuse, password changes).
-- Never contains passwords or raw tokens.

CREATE TABLE audit_events
(
    id               BIGSERIAL PRIMARY KEY,
    occurred_at      TIMESTAMPTZ NOT NULL,
    actor_account_id BIGINT REFERENCES user_accounts (id),
    action           VARCHAR(50) NOT NULL,
    target_type      VARCHAR(50),
    target_id        VARCHAR(100),
    ip               VARCHAR(64),
    user_agent       VARCHAR(512),
    details          JSONB
);

CREATE INDEX ix_audit_events_actor ON audit_events (actor_account_id);
CREATE INDEX ix_audit_events_action_time ON audit_events (action, occurred_at);
