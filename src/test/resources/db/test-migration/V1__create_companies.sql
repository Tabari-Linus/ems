CREATE TABLE company
(
    id                   BIGSERIAL PRIMARY KEY,
    company_name         VARCHAR(255),
    company_code         VARCHAR(255),
    company_email        VARCHAR(255),
    company_phone_number VARCHAR(255),
    company_address      VARCHAR(255),
    company_status       VARCHAR(50),
    next_office_number   BIGINT DEFAULT 1,
    deleted_at           TIMESTAMP,
    created_by           BIGINT,
    created_date         TIMESTAMP,
    last_modified_by     BIGINT,
    last_modified_date   TIMESTAMP
);
