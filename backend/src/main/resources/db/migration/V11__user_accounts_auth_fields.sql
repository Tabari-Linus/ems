-- Slice 1: user accounts get a public id (the JWT subject), an optional password (accounts
-- start PENDING with no password until the welcome link is used), lockout state and
-- last-login tracking. Email becomes case-insensitive: stored lower-case and unique on lower(email).

ALTER TABLE user_accounts RENAME COLUMN user_id TO public_id;

ALTER TABLE user_accounts ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE user_accounts
    ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN locked_until          TIMESTAMPTZ,
    ADD COLUMN last_login_at         TIMESTAMPTZ,
    ADD COLUMN password_changed_at   TIMESTAMPTZ;

UPDATE user_accounts SET email = lower(trim(email)) WHERE email <> lower(trim(email));
UPDATE employees SET work_email = lower(trim(work_email)) WHERE work_email <> lower(trim(work_email));

ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_email_key;
CREATE UNIQUE INDEX ux_user_accounts_email_lower ON user_accounts (lower(email));
ALTER TABLE user_accounts ADD CONSTRAINT ck_user_accounts_email_lower CHECK (email = lower(email));
