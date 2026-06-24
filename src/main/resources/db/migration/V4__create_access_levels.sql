CREATE TABLE access_levels
(
    id                  BIGSERIAL PRIMARY KEY,
    access_level_name   VARCHAR(255) NOT NULL UNIQUE,
    description         VARCHAR(255),
    status              VARCHAR(50),
    deleted_at          TIMESTAMP,
    created_by          BIGINT,
    created_date        TIMESTAMP,
    last_modified_by    BIGINT,
    last_modified_date  TIMESTAMP
);

-- PermissionSet does not extend AuditableEntity — no audit columns
CREATE TABLE access_level_permissions
(
    id              BIGSERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL,
    access_level_id BIGINT       NOT NULL REFERENCES access_levels (id),
    CONSTRAINT uq_access_level_permission UNIQUE (access_level_id, permission_name)
);
