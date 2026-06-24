CREATE TABLE department
(
    id                      BIGSERIAL PRIMARY KEY,
    department_name         VARCHAR(255),
    department_code         VARCHAR(255) UNIQUE,
    department_prefix       VARCHAR(255),
    department_email        VARCHAR(255),
    department_phone_number VARCHAR(255),
    department_address      VARCHAR(255),
    department_status       VARCHAR(50),
    office_id               BIGINT REFERENCES office (id),
    deleted_at              TIMESTAMP,
    created_by              BIGINT,
    created_date            TIMESTAMP,
    last_modified_by        BIGINT,
    last_modified_date      TIMESTAMP
);
