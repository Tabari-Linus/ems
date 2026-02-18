# Employee Management System — User Stories

> **Stack:** Java Spring Boot (Backend) · Angular (Frontend)
> **Scale:** Single Company
> **Format:** Agile — *As a [role], I want [goal], so that [benefit]* with Acceptance Criteria

---

## Roles Defined

| Role | Description |
|------|-------------|
| **Super Admin** | Full system access, configures the platform |
| **HR Manager** | Manages all employee and org data |
| **Department Manager** | Manages their team members |
| **Employee** | Views and manages their own profile |

---

## Epic 1: Authentication & Access Control

### US-101 — User Login
> As a **system user**, I want to log in with my email and password, so that I can securely access the system based on my role.

*Acceptance Criteria:*
- [ ] Login form accepts email and password
- [ ] Invalid credentials show a descriptive error message
- [ ] Successful login redirects to a role-appropriate dashboard
- [ ] A JWT access token and refresh token are issued on success
- [ ] Account is locked after 5 consecutive failed attempts

---

### US-102 — Role-Based Access Control
> As a **Super Admin**, I want to assign roles to users, so that each person only accesses features relevant to their responsibilities.

*Acceptance Criteria:*
- [ ] Roles available: Super Admin, HR Manager, Department Manager, Employee
- [ ] Each role has a predefined set of permissions
- [ ] Unauthorized routes return HTTP 403 and redirect on the frontend
- [ ] A user can hold exactly one role at a time

---

### US-103 — Session Management & Token Refresh
> As a **logged-in user**, I want my session to stay active while I am using the system, so that I am not logged out unexpectedly mid-task.

*Acceptance Criteria:*
- [ ] Access token expires after 15 minutes
- [ ] Refresh token silently renews the access token while the session is active
- [ ] Idle session expires after 30 minutes of inactivity with a warning modal
- [ ] User is redirected to login on full session expiry

---

### US-104 — Logout
> As a **logged-in user**, I want to log out, so that my session is terminated and my data is protected.

*Acceptance Criteria:*
- [ ] Logout button is accessible from all pages
- [ ] Server-side token is invalidated on logout
- [ ] User is redirected to the login page
- [ ] Back navigation after logout redirects back to login

---

### US-105 — Password Reset
> As a **user**, I want to reset my password via email, so that I can regain access if I forget my credentials.

*Acceptance Criteria:*
- [ ] "Forgot password" link is available on the login page
- [ ] A reset link is sent to the registered email and expires in 1 hour
- [ ] New password must meet complexity requirements (min 8 chars, upper, lower, digit, special char)
- [ ] Old password cannot be reused

---

### US-106 — First-Time Password Change
> As a **newly onboarded employee**, I want to be prompted to change my temporary password on first login, so that my account is secure from the start.

*Acceptance Criteria:*
- [ ] System flags new accounts as requiring a password change
- [ ] User cannot access any other page until the password is changed
- [ ] Temporary password is invalidated after the first change

---

## Epic 2: Employee Profile Management

### US-201 — Add New Employee
> As an **HR Manager**, I want to create a new employee record, so that a new hire is registered in the system from day one.

*Acceptance Criteria:*
- [ ] Form captures: first name, last name, email, phone, date of birth, gender, address, national ID
- [ ] Employment fields: employee ID (auto-generated), hire date, employment type (full-time, part-time, contract), status
- [ ] Employee is assigned a department, job role, and line manager
- [ ] A system-generated welcome email with temporary credentials is sent to the employee
- [ ] Duplicate email or national ID is rejected with a clear error

---

### US-202 — View Employee Profile
> As an **HR Manager or Department Manager**, I want to view a complete employee profile, so that I can review all relevant details in one place.

*Acceptance Criteria:*
- [ ] Profile page shows: personal info, employment info, department, role, manager, documents, and employment history
- [ ] Department Managers can only view employees in their department
- [ ] Sensitive fields (e.g., national ID) are masked and require permission to reveal

---

### US-203 — Edit Employee Profile
> As an **HR Manager**, I want to edit an employee's profile, so that I can keep records accurate when employee details change.

*Acceptance Criteria:*
- [ ] All fields from the creation form are editable
- [ ] Changes are saved with a timestamp and the acting user's ID (audit trail)
- [ ] Employee receives an email notification when key fields change (e.g., role, department)

---

### US-204 — Employee Self-Service Profile View
> As an **employee**, I want to view my own profile, so that I can verify my personal and employment information.

*Acceptance Criteria:*
- [ ] Employee can see all their personal and employment details
- [ ] Employee cannot view other employees' profiles
- [ ] Sensitive fields like national ID are partially masked

---

### US-205 — Employee Self-Service Profile Update
> As an **employee**, I want to request updates to my personal information, so that my record stays current without needing to directly contact HR.

*Acceptance Criteria:*
- [ ] Employee can edit: phone number, address, emergency contact, and profile photo
- [ ] Changes to employment-related fields (department, role) are not self-editable
- [ ] HR Manager receives a notification to review and approve personal info changes

---

### US-206 — Upload & Manage Profile Photo
> As an **employee**, I want to upload a profile photo, so that I am visually identifiable in the system.

*Acceptance Criteria:*
- [ ] Accepted formats: JPG, PNG; max size 2MB
- [ ] Photo is cropped to a square aspect ratio before saving
- [ ] Default avatar is shown if no photo is uploaded

---

### US-207 — Deactivate Employee
> As an **HR Manager**, I want to deactivate an employee's account, so that former employees lose system access without deleting their records.

*Acceptance Criteria:*
- [ ] Deactivation sets status to "Inactive" and revokes all active sessions
- [ ] Inactive employees do not appear in active employee lists but are searchable in reports
- [ ] A reason and effective date must be provided before deactivation

---

### US-208 — Reactivate Employee
> As an **HR Manager**, I want to reactivate a previously deactivated employee, so that returning employees regain system access.

*Acceptance Criteria:*
- [ ] Reactivation restores the employee's previous role and department
- [ ] Employee receives a new temporary password
- [ ] History of deactivation and reactivation is logged

---

### US-209 — Employment History Log
> As an **HR Manager**, I want to view a full employment history for each employee, so that I can track changes over time.

*Acceptance Criteria:*
- [ ] Log entries for: department changes, role changes, manager changes, status changes
- [ ] Each entry shows the changed field, old value, new value, changed by, and date
- [ ] Log is read-only and cannot be edited

---

## Epic 3: Department Management

### US-301 — Create Department
> As a **Super Admin**, I want to create departments, so that the organization's structure is reflected in the system.

*Acceptance Criteria:*
- [ ] Department fields: name, code (unique), description, parent department (optional for sub-departments)
- [ ] Department head can be assigned from existing employees
- [ ] Duplicate department name or code is rejected

---

### US-302 — View All Departments
> As an **HR Manager**, I want to view a list of all departments, so that I can understand the company structure at a glance.

*Acceptance Criteria:*
- [ ] List shows: department name, code, head, number of employees, and status (active/inactive)
- [ ] Departments can be filtered by status and sorted by name or employee count

---

### US-303 — Edit Department
> As a **Super Admin**, I want to edit department details, so that I can keep the org structure up to date.

*Acceptance Criteria:*
- [ ] All department fields are editable except the unique code
- [ ] Changing the department head sends a notification to the new head
- [ ] Changes are logged in the audit trail

---

### US-304 — Deactivate Department
> As a **Super Admin**, I want to deactivate a department, so that defunct units no longer appear in active workflows.

*Acceptance Criteria:*
- [ ] A department with active employees cannot be deactivated without reassigning them first
- [ ] System shows a warning listing employees who need to be reassigned
- [ ] Deactivated departments are hidden from dropdowns but visible in historical records

---

### US-305 — Assign Employee to Department
> As an **HR Manager**, I want to assign or transfer an employee to a department, so that reporting lines are always accurate.

*Acceptance Criteria:*
- [ ] Transfer requires selecting the new department and optional effective date
- [ ] The old department, new department, and transfer date are recorded in employment history
- [ ] The employee's line manager defaults to the new department head unless overridden

---

### US-306 — View Department Roster
> As a **Department Manager**, I want to view all employees in my department, so that I can manage my team effectively.

*Acceptance Criteria:*
- [ ] Roster shows: name, role, hire date, employment type, status
- [ ] Searchable and filterable by role, status, and employment type
- [ ] Department Managers can only see their own department

---

## Epic 4: Job Roles & Positions

### US-401 — Create Job Role
> As a **Super Admin or HR Manager**, I want to create job roles, so that every employee's position is clearly defined.

*Acceptance Criteria:*
- [ ] Role fields: title, code (unique), grade/level, department (optional default), description
- [ ] A role can be marked as a managerial role
- [ ] Duplicate role code is rejected

---

### US-402 — View All Job Roles
> As an **HR Manager**, I want to view all job roles, so that I can identify gaps or overlaps in the org structure.

*Acceptance Criteria:*
- [ ] List shows: title, code, grade, department, number of employees in that role, status
- [ ] Filterable by department and grade

---

### US-403 — Edit Job Role
> As a **Super Admin or HR Manager**, I want to edit a job role, so that role definitions stay aligned with company changes.

*Acceptance Criteria:*
- [ ] All fields except the unique code are editable
- [ ] Employees in the role are not automatically updated; HR must review and update individually
- [ ] Changes are logged in the audit trail

---

### US-404 — Deactivate Job Role
> As a **Super Admin**, I want to deactivate a job role that is no longer in use, so that it no longer appears as an option when managing employees.

*Acceptance Criteria:*
- [ ] Roles with active employees cannot be deactivated without reassigning employees
- [ ] Deactivated roles remain visible in historical employee records
- [ ] Warning is shown if active employees hold the role

---

### US-405 — Assign Role to Employee
> As an **HR Manager**, I want to assign or change an employee's job role, so that their title and grade accurately reflect their current position.

*Acceptance Criteria:*
- [ ] Role change is recorded in the employment history log
- [ ] Employee receives a notification of the role change
- [ ] The effective date of the change is captured

---

## Epic 5: Organizational Hierarchy

### US-501 — View Org Chart
> As any **authenticated user**, I want to view the company's organizational chart, so that I can understand reporting lines and team structures.

*Acceptance Criteria:*
- [ ] Org chart is rendered as an interactive tree/hierarchy view in Angular
- [ ] Each node shows: employee name, photo, role, and department
- [ ] Chart is navigable (expand/collapse nodes) and searchable by name
- [ ] Employees can only see the full org chart; sensitive data is not exposed

---

### US-502 — Assign Line Manager
> As an **HR Manager**, I want to assign a line manager to each employee, so that reporting relationships are clearly defined.

*Acceptance Criteria:*
- [ ] Only active employees with a managerial role can be set as a line manager
- [ ] An employee cannot be their own manager
- [ ] Circular reporting chains (A manages B who manages A) are prevented by the system
- [ ] Change is recorded in employment history

---

### US-503 — View Direct Reports
> As a **Department Manager**, I want to see a list of employees who report directly to me, so that I can manage my team.

*Acceptance Criteria:*
- [ ] List shows name, role, department, and employment type
- [ ] Clicking an employee opens their profile (within permitted fields)

---

## Epic 6: Employee Onboarding

### US-601 — Onboarding Checklist Creation
> As an **HR Manager**, I want to define an onboarding checklist template, so that every new hire goes through a consistent process.

*Acceptance Criteria:*
- [ ] Templates contain a list of tasks (e.g., "Sign employment contract", "Complete IT setup")
- [ ] Each task has a title, description, assigned owner (HR, IT, Manager, Employee), and due date offset from start date
- [ ] Multiple templates can be created for different employment types or departments

---

### US-602 — Assign Onboarding Checklist to New Hire
> As an **HR Manager**, I want to assign an onboarding checklist to a new employee, so that all required tasks are tracked from day one.

*Acceptance Criteria:*
- [ ] Checklist can be assigned when creating the employee or separately later
- [ ] Task due dates are calculated from the employee's hire date
- [ ] Assigned owners are notified of their tasks

---

### US-603 — Track Onboarding Progress
> As an **HR Manager or Department Manager**, I want to see the onboarding progress of a new hire, so that I can ensure nothing is missed.

*Acceptance Criteria:*
- [ ] Progress is shown as a percentage and a task-by-task status list
- [ ] Tasks can be marked as complete by their assigned owner
- [ ] Overdue tasks are flagged with a visual indicator

---

### US-604 — Employee Onboarding Task Completion
> As a **new employee**, I want to complete my onboarding tasks, so that I fulfil my responsibilities during my first days.

*Acceptance Criteria:*
- [ ] Employee sees only tasks assigned to them
- [ ] Employee can mark tasks as done and add optional notes
- [ ] Completed tasks are timestamped and cannot be un-completed without HR intervention

---

## Epic 7: Employee Offboarding

### US-701 — Initiate Offboarding Process
> As an **HR Manager**, I want to initiate an offboarding process when an employee leaves, so that the exit is handled systematically.

*Acceptance Criteria:*
- [ ] Offboarding requires: employee selection, exit reason (resignation, termination, retirement, redundancy), and last working day
- [ ] An offboarding checklist (configurable like onboarding) is automatically assigned
- [ ] Line manager and relevant departments are notified

---

### US-702 — Offboarding Checklist Tracking
> As an **HR Manager**, I want to track offboarding checklist completion, so that all exit requirements are fulfilled before the employee leaves.

*Acceptance Criteria:*
- [ ] Tasks include items like: "Return company assets", "Revoke system access", "Conduct exit interview"
- [ ] Tasks are assigned to relevant owners (IT, HR, Finance, Manager)
- [ ] Employee status is changed to "Inactive" only after all mandatory tasks are completed (or overridden by admin)

---

### US-703 — Exit Interview Record
> As an **HR Manager**, I want to record notes from an exit interview, so that employee feedback is preserved for future reference.

*Acceptance Criteria:*
- [ ] HR can record free-text notes linked to the employee's offboarding record
- [ ] Record is confidential and only viewable by HR Managers and Super Admin
- [ ] Record is retained even after the employee is deactivated

---

## Epic 8: Document Management

### US-801 — Upload Employee Documents
> As an **HR Manager**, I want to upload documents to an employee's profile, so that contracts, IDs, and other records are stored centrally.

*Acceptance Criteria:*
- [ ] Accepted types: PDF, JPG, PNG, DOCX; max size 10MB per file
- [ ] Document requires: type (e.g., Contract, ID, Certificate), name, and upload date
- [ ] Documents are linked to the employee profile and access is role-restricted

---

### US-802 — View & Download Employee Documents
> As an **HR Manager**, I want to view and download employee documents, so that I can access them when needed.

*Acceptance Criteria:*
- [ ] List of documents is shown on the employee's profile tab
- [ ] HR Managers can download any document; employees can only download their own
- [ ] Download events are logged in the audit trail

---

### US-803 — Employee Document Self-Upload
> As an **employee**, I want to upload personal documents to my profile, so that HR has my latest records.

*Acceptance Criteria:*
- [ ] Employees can upload documents like a CV, qualification certificates, or updated ID
- [ ] Uploaded documents are visible to HR for review and approval
- [ ] Employees can see their own documents but not documents uploaded by HR (unless HR marks them visible)

---

### US-804 — Document Expiry Alerts
> As an **HR Manager**, I want to be notified when employee documents are approaching expiry, so that I can request renewals in time.

*Acceptance Criteria:*
- [ ] Documents can have an expiry date set on upload
- [ ] System sends a notification 30 days and 7 days before expiry
- [ ] Expired documents are flagged with a red indicator on the employee's profile

---

## Epic 9: Search, Filtering & Reporting

### US-901 — Global Employee Search
> As an **HR Manager**, I want to search for employees by name, ID, or email, so that I can quickly locate any employee's record.

*Acceptance Criteria:*
- [ ] Search works across: full name, employee ID, email, phone
- [ ] Results appear as the user types (debounced search)
- [ ] Inactive employees are excluded by default but can be included with a toggle

---

### US-902 — Advanced Employee Filtering
> As an **HR Manager**, I want to filter the employee list by multiple criteria, so that I can focus on specific subsets of the workforce.

*Acceptance Criteria:*
- [ ] Filterable by: department, job role, employment type, status, hire date range, gender
- [ ] Multiple filters can be applied simultaneously
- [ ] Applied filters are displayed as removable chips

---

### US-903 — Employee Directory Report Export
> As an **HR Manager**, I want to export a filtered employee list to CSV or PDF, so that I can share headcount data with stakeholders.

*Acceptance Criteria:*
- [ ] Exported data respects the currently applied search and filters
- [ ] Export includes: name, employee ID, email, department, role, hire date, status
- [ ] Sensitive fields like national ID are excluded from exports unless explicitly permitted

---

### US-904 — Headcount Dashboard
> As an **HR Manager or Super Admin**, I want to see a dashboard summarising key workforce metrics, so that I have a real-time snapshot of the company's headcount.

*Acceptance Criteria:*
- [ ] Dashboard shows: total active employees, new hires this month, exits this month, headcount by department (chart), headcount by employment type (chart)
- [ ] Data updates in real time as records change
- [ ] Dashboard is the landing page for HR Manager and Super Admin roles

---

### US-905 — Department Headcount Report
> As a **Department Manager**, I want to view a headcount breakdown of my department, so that I can track team size over time.

*Acceptance Criteria:*
- [ ] Report shows total active employees, count by role, count by employment type
- [ ] Exportable as CSV
- [ ] Data is scoped to the manager's own department

---

## Epic 10: Audit & Compliance

### US-1001 — System Audit Log
> As a **Super Admin**, I want to view a complete audit log of all system actions, so that I can investigate changes and ensure accountability.

*Acceptance Criteria:*
- [ ] Every create, update, delete action is logged with: actor, action type, entity type, entity ID, old value, new value, timestamp
- [ ] Audit log is read-only and cannot be modified or deleted
- [ ] Log is searchable and filterable by actor, date range, and action type

---

### US-1002 — Employee Data Audit Trail
> As an **HR Manager**, I want to view the audit trail for a specific employee's record, so that I can see the full history of changes made to their profile.

*Acceptance Criteria:*
- [ ] Trail is accessible from the employee's profile page
- [ ] Shows: field changed, old value, new value, changed by, and timestamp
- [ ] Scoped to the selected employee only

---

## Epic 11: System Administration

### US-1101 — Manage System Users
> As a **Super Admin**, I want to create and manage system user accounts, so that I control who can access the platform.

*Acceptance Criteria:*
- [ ] Super Admin can create, view, edit, and deactivate user accounts
- [ ] Each user account is linked to an employee record
- [ ] Super Admin can reset any user's password

---

### US-1102 — Configure Company Profile
> As a **Super Admin**, I want to configure the company's profile in the system, so that the platform reflects the correct organisational identity.

*Acceptance Criteria:*
- [ ] Configurable fields: company name, logo, address, registration number, contact email
- [ ] Logo is displayed across the application header and exported reports
- [ ] Changes are logged in the audit trail

---

### US-1103 — Manage Employment Types
> As a **Super Admin**, I want to configure the list of employment types, so that the system reflects how our company classifies employees.

*Acceptance Criteria:*
- [ ] Default types: Full-time, Part-time, Contract, Intern
- [ ] Super Admin can add, rename, or deactivate employment types
- [ ] Deactivated types cannot be assigned to new employees

---

### US-1104 — Manage Employee ID Format
> As a **Super Admin**, I want to configure the employee ID auto-generation format, so that IDs match company standards.

*Acceptance Criteria:*
- [ ] Format is configurable (e.g., prefix + zero-padded number: `EMP-0042`)
- [ ] IDs are globally unique and auto-incremented
- [ ] Changing the format applies to new employees only

---

## Epic 12: Notifications & Communication

### US-1201 — In-App Notifications
> As a **system user**, I want to receive in-app notifications for actions that require my attention, so that I do not miss important tasks.

*Acceptance Criteria:*
- [ ] Notification bell icon shows unread count
- [ ] Notification types: onboarding tasks due, offboarding tasks due, document expiry alerts, profile update requests, role/department changes
- [ ] Notifications can be marked as read individually or all at once

---

### US-1202 — Email Notifications
> As a **system user**, I want to receive email notifications for critical events, so that I am informed even when not logged in.

*Acceptance Criteria:*
- [ ] Emails sent for: new account creation, password reset, role changes, department transfers, onboarding task assignments, document expiry warnings
- [ ] Email templates include company name and logo
- [ ] Notification preferences can be configured by the Super Admin

---

## Summary

| Epic | Stories |
|------|---------|
| 1 — Authentication & Access Control | 6 |
| 2 — Employee Profile Management | 9 |
| 3 — Department Management | 6 |
| 4 — Job Roles & Positions | 5 |
| 5 — Organisational Hierarchy | 3 |
| 6 — Employee Onboarding | 4 |
| 7 — Employee Offboarding | 3 |
| 8 — Document Management | 4 |
| 9 — Search, Filtering & Reporting | 5 |
| 10 — Audit & Compliance | 2 |
| 11 — System Administration | 4 |
| 12 — Notifications & Communication | 2 |
| **Total** | **53** |

---

## Suggested Sprint Order

| Sprint | Epics | Rationale |
|--------|-------|-----------|
| 1–2 | 1, 11 | Auth and system config — the foundation everything depends on |
| 3–4 | 3, 4 | Departments and roles — required before employees can be created |
| 5–6 | 2 | Employee CRUD — the core feature of the system |
| 7 | 5 | Org chart — depends on employees and manager relationships |
| 8 | 6, 7 | Onboarding and offboarding — employee lifecycle flows |
| 9 | 8 | Document management |
| 10 | 9, 10 | Reporting and audit |
| 11 | 12 | Notifications — polish and communication layer |
