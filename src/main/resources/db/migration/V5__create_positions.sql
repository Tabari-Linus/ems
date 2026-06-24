CREATE TABLE positions
(
    id                 BIGSERIAL PRIMARY KEY,
    position_name      VARCHAR(255) NOT NULL UNIQUE,
    level              VARCHAR(50),
    description        VARCHAR(255),
    status             VARCHAR(50),
    deleted_at         TIMESTAMP,
    created_by         BIGINT,
    created_date       TIMESTAMP,
    last_modified_by   BIGINT,
    last_modified_date TIMESTAMP
);
