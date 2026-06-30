-- employees: FKs to access_levels, department, positions
-- address_id and identification_id are added at the end to resolve circular FK dependency
CREATE TABLE employees
(
    id                 BIGSERIAL PRIMARY KEY,
    first_name         VARCHAR(255),
    last_name          VARCHAR(255),
    work_email         VARCHAR(255) UNIQUE,
    status             VARCHAR(50),
    deleted_at         TIMESTAMP,
    access_level_id    BIGINT REFERENCES access_levels (id),
    department_id      BIGINT REFERENCES department (id),
    position_id        BIGINT REFERENCES positions (id),
    created_by         BIGINT,
    created_date       TIMESTAMP,
    last_modified_by   BIGINT,
    last_modified_date TIMESTAMP
);

-- employee_bios: 1:1 per employee
CREATE TABLE employee_bios
(
    id             BIGSERIAL PRIMARY KEY,
    employee_id    BIGINT NOT NULL UNIQUE REFERENCES employees (id),
    full_name      VARCHAR(255),
    other_name     VARCHAR(255),
    gender         VARCHAR(50),
    nationality    VARCHAR(100),
    marital_status VARCHAR(50),
    date_of_birth  VARCHAR(50),
    place_of_birth VARCHAR(255),
    profile_picture VARCHAR(500),
    date_hired     TIMESTAMP,
    is_expert      VARCHAR(50)
);

-- employee_contacts: 1:1 per employee
CREATE TABLE employee_contacts
(
    id          BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL UNIQUE REFERENCES employees (id)
);

-- element collection tables for employee_contacts
CREATE TABLE employee_phone_numbers
(
    contact_id   BIGINT NOT NULL REFERENCES employee_contacts (id),
    phone_number VARCHAR(50)
);

CREATE TABLE employee_personal_emails
(
    contact_id     BIGINT NOT NULL REFERENCES employee_contacts (id),
    personal_email VARCHAR(255)
);

-- employee_addresses: many per employee
CREATE TABLE employee_addresses
(
    id                 BIGSERIAL PRIMARY KEY,
    employee_id        BIGINT NOT NULL REFERENCES employees (id),
    street             VARCHAR(255),
    city               VARCHAR(100),
    state              VARCHAR(100),
    zip_code           VARCHAR(50),
    country            VARCHAR(100),
    digital_address    VARCHAR(100),
    is_current_address BOOLEAN
);

-- employee_identifications: many per employee
CREATE TABLE employee_identifications
(
    id                      BIGSERIAL PRIMARY KEY,
    identification_number   VARCHAR(255) NOT NULL UNIQUE,
    identification_type     VARCHAR(50),
    employee_id             BIGINT NOT NULL REFERENCES employees (id)
);

-- H2-compatible: two separate ALTER TABLE statements (H2 does not support multi-column ADD COLUMN in one statement)
ALTER TABLE employees ADD COLUMN address_id        BIGINT REFERENCES employee_addresses (id);
ALTER TABLE employees ADD COLUMN identification_id BIGINT REFERENCES employee_identifications (id);
