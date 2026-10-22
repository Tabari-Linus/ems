INSERT INTO access_level_permissions (access_level_id, permission_name)
SELECT al.id, 'VIEW_DASHBOARD'
FROM access_levels al
WHERE al.access_level_name = 'ADMINISTRATOR';
