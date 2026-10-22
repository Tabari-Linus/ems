INSERT INTO access_levels (access_level_name, description, status)
VALUES ('ADMINISTRATOR', 'Full system access — all permissions granted', 'ACTIVE');

INSERT INTO access_level_permissions (access_level_id, permission_name)
SELECT al.id, perms.perm
FROM access_levels al,
     (VALUES ('VIEW_ADMIN'),
             ('MANAGE_ADMIN'),
             ('VIEW_MANAGER'),
             ('MANAGE_MANAGER'),
             ('VIEW_DIRECTOR'),
             ('MANAGE_DIRECTOR'),
             ('VIEW_EMPLOYEE'),
             ('MANAGE_EMPLOYEE'),
             ('VIEW_COMPANY'),
             ('MANAGE_COMPANY'),
             ('VIEW_OFFICE'),
             ('MANAGE_OFFICE'),
             ('VIEW_DEPARTMENT'),
             ('MANAGE_DEPARTMENT'),
             ('VIEW_ACCESS_LEVEL'),
             ('MANAGE_ACCESS_LEVEL'),
             ('VIEW_ROLE'),
             ('MANAGE_ROLE'),
             ('VIEW_POSITION'),
             ('MANAGE_POSITION')) AS perms(perm)
WHERE al.access_level_name = 'ADMINISTRATOR';
