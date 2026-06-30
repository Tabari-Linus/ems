CREATE TABLE user_accounts
(
    id                 BIGSERIAL PRIMARY KEY,
    user_id            UUID         NOT NULL UNIQUE,
    email              VARCHAR(255) NOT NULL UNIQUE,
    password_hash      VARCHAR(255) NOT NULL,
    enabled            BOOLEAN      NOT NULL DEFAULT TRUE,
    employee_id        BIGINT UNIQUE REFERENCES employees (id),
    created_by         BIGINT,
    created_date       TIMESTAMP,
    last_modified_by   BIGINT,
    last_modified_date TIMESTAMP
);

CREATE TABLE refresh_tokens
(
    id                 BIGSERIAL PRIMARY KEY,
    token              VARCHAR(500) NOT NULL UNIQUE,
    expiry_date        TIMESTAMP    NOT NULL,
    user_account_id    BIGINT       NOT NULL REFERENCES user_accounts (id),
    created_by         BIGINT,
    created_date       TIMESTAMP,
    last_modified_by   BIGINT,
    last_modified_date TIMESTAMP
);
