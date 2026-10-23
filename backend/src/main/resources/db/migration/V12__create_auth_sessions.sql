-- Slice 1: multi-device refresh sessions (D5) replace the single plaintext refresh token per user.
-- Only the SHA-256 hash (base64url) of the opaque 256-bit refresh token is stored.
-- A login starts a family; each refresh rotates to a new row in the same family and marks the old
-- row revoked/replaced. Presenting a revoked token revokes the whole family (reuse detection).

CREATE TABLE auth_sessions
(
    id              BIGSERIAL PRIMARY KEY,
    user_account_id BIGINT      NOT NULL REFERENCES user_accounts (id),
    family_id       UUID        NOT NULL,
    token_hash      VARCHAR(64) NOT NULL,
    user_agent      VARCHAR(512),
    ip              VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  VARCHAR(50),
    replaced_by     BIGINT REFERENCES auth_sessions (id),
    CONSTRAINT uq_auth_sessions_token_hash UNIQUE (token_hash)
);

CREATE INDEX ix_auth_sessions_user_account ON auth_sessions (user_account_id);
CREATE INDEX ix_auth_sessions_family ON auth_sessions (family_id);

DROP TABLE refresh_tokens;
