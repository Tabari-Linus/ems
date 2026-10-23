INSERT INTO access_level_permissions (access_level_id, permission_name)
SELECT al.id, perms.perm
FROM access_levels al,
     (VALUES ('VIEW_SELF'),
             ('MANAGE_SELF')) AS perms(perm)
ON CONFLICT (access_level_id, permission_name) DO NOTHING;
