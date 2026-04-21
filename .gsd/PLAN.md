---
phase: 3
plan: 1
wave: 1
gap_closure: false
---

# Plan 3.1: Admin Portal Payroll Integration

## Objective

Port the newly developed statutory payroll system from the Manager frontend into the Admin frontend. This involves copying the API utilities, React pages, and wiring them into the Admin's routing and navigation systems.

## Context

Load these files for context:

- admin/src/routes.js (or equivalent routing file)
- admin/src/layout/nav/Menu.js (or equivalent sidebar navigation file)

## Tasks

<task type="auto">
  <name>Port API Utilities to Admin</name>
  <files>
    admin/src/api/inventory.js
  </files>
  <action>
    Steps:
    1. Read `manager/src/api/payrollConfig.js` and copy its exact contents into a new file at `admin/src/api/payrollConfig.js`.
    2. Read any existing payroll API utility in the manager folder (e.g., `manager/src/api/payroll.js`) and ensure a matching file exists in `admin/src/api/` with the exact same functions.
  </action>
  <verify>
    Verify the new files exist in the `admin/src/api` directory and contain valid Axios calls.
  </verify>
  <done>
    Admin portal has the necessary functions to call the backend payroll routes.
  </done>
</task>

<task type="auto">
  <name>Port React Pages to Admin</name>
  <files>
    admin/src/pages/PayrollSettings.jsx
    admin/src/pages/ManagePayroll.jsx
    admin/src/pages/GeneratePayroll.jsx
    admin/src/pages/ViewStaffPayroll.jsx
  </files>
  <action>
    Steps:
    1. Copy the following files exactly from `manager/src/pages/` into `admin/src/pages/`:
       - `PayrollSettings.jsx`
       - `ManagePayroll.jsx`
       - `GeneratePayroll.jsx`
       - `ViewStaffPayroll.jsx`
    2. If `StaffProfile.jsx` or `AddStaff.jsx` was modified in the Manager portal to include the Salary Structure inputs, duplicate those specific UI changes into the equivalent Staff files in the Admin portal.
    
    AVOID: Blindly replacing the Admin's `StaffProfile.jsx` entirely, as the Admin might have super-admin-specific fields the manager doesn't. Only merge the payroll configuration UI.
  </action>
  <verify>
    Ensure all necessary React components exist in the admin pages directory.
  </verify>
  <done>
    All visual UI components are securely ported to the admin workspace.
  </done>
</task>

<task type="auto">
  <name>Wire Up Admin Routing and Navigation</name>
  <files>
    admin/src/routes.js
    admin/src/layout/nav/Menu.js
  </files>
  <action>
    Steps:
    1. Open the primary routing file for the Admin portal. Import the 4 newly copied payroll pages.
    2. Add exact route definitions for them (e.g., `/payroll/settings`, `/payroll/:month?/:year?`, `/payroll/generate`, `/payroll/view/:staffId`).
    3. Open the Admin sidebar/menu navigation file. Add a new section or links for "Payroll" and "Payroll Settings" so the user can navigate to them.
  </action>
  <verify>
    Syntax check the routing and menu files.
  </verify>
  <done>
    Admin users can click the sidebar and load the copied payroll views.
  </done>
</task>

## Success Criteria

- [ ] Admin portal successfully compiles.
- [ ] Admin sidebar contains working links to Payroll.
- [ ] Admin can generate and view payroll exactly like the Manager.
