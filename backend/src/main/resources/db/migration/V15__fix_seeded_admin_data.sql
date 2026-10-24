-- Review I9/G3: seeded rows violated non-null GraphQL fields.
-- The seeded access levels were inserted without created_date (AccessLevel.createdDate is DateTime!).
UPDATE access_levels SET created_date = now() WHERE created_date IS NULL;

-- Employees linked to an account but without a work email (the seeded administrator) take the
-- login email, so EmployeeDetailResult.workEmail (String!) resolves.
UPDATE employees e
SET work_email = u.email
FROM user_accounts u
WHERE u.employee_id = e.id
  AND e.work_email IS NULL
  AND NOT EXISTS (SELECT 1 FROM employees other WHERE other.work_email = u.email);
