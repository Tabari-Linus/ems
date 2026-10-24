-- Slice 1 (D31): single-use, expiring tokens for the welcome / set-password link and, later,
-- password-reset links. Only the SHA-256 hash (base64url) of the raw token is stored.

CREATE TABLE one_time_tokens
(
    id              BIGSERIAL PRIMARY KEY,
    user_account_id BIGINT      NOT NULL REFERENCES user_accounts (id),
    purpose         VARCHAR(30) NOT NULL,
    token_hash      VARCHAR(64) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_one_time_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT ck_one_time_tokens_purpose CHECK (purpose IN ('WELCOME', 'PASSWORD_RESET'))
);

CREATE INDEX ix_one_time_tokens_account_purpose ON one_time_tokens (user_account_id, purpose);
