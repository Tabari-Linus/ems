CREATE TABLE office
(
    id                   BIGSERIAL PRIMARY KEY,
    office_name          VARCHAR(255) UNIQUE,
    office_code          VARCHAR(255) UNIQUE,
    office_email         VARCHAR(255) UNIQUE,
    office_phone_number  VARCHAR(255) UNIQUE,
    office_address       VARCHAR(255),
    office_status        VARCHAR(50),
    company_id           BIGINT REFERENCES company (id),
    deleted_at           TIMESTAMP,
    created_by           BIGINT,
    created_date         TIMESTAMP,
    last_modified_by     BIGINT,
    last_modified_date   TIMESTAMP
);
