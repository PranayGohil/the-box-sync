---
phase: 1
plan: 1
wave: 1
gap_closure: false
---

# Plan 1.1: Advanced Inventory Management System

## Objective
Upgrade the existing inventory system for admin and manager portals to allow real-time stock tracking, manual stock deduction, and bulk Excel import/export functionality.

## Context
Load these files for context:
- .gsd/ARCHITECTURE.md
- server/models/Inventory.js
- server/routes/inventory.js

## Tasks

<task type="auto">
  <name>Setup Backend Data and Dependencies</name>
  <files>
    server/package.json
    server/models/Inventory.js
    server/models/StockUsageLog.js
  </files>
  <action>
    Steps:
    1. Install `multer` and `xlsx` in the /server directory.
    2. Update the Inventory schema to include `currentStock` (Number) in items.
    3. Create a new StockUsageLog schema to track inventory deductions (linked to user_id and item).
    
    AVOID: Modifying other schemas. 
    USE: Multi-tenant structure ensuring all schemas require `user_id`.
  </action>
  <verify>
    Check package.json for multer/xlsx and verify schema files exist and compile without syntax errors.
  </verify>
  <done>
    Dependencies installed and DB schemas are ready for data.
  </done>
</task>

<task type="auto">
  <name>Build Express API Routes</name>
  <files>
    server/routes/inventory.js
    server/controllers/inventoryController.js
  </files>
  <action>
    Steps:
    1. Create POST `/api/inventory/use` to deduct stock and log usage.
    2. Create GET `/api/inventory/export` to generate an Excel buffer of current stock using `xlsx`.
    3. Create POST `/api/inventory/import` using `multer` to accept Excel uploads and execute bulk updates on the db.
    
    AVOID: Forgetting to filter DB queries by the authenticated user's `user_id`.
  </action>
  <verify>
    Ensure routes are properly mounted in the main Express app file.
  </verify>
  <done>
    Endpoints are created and correctly handling Excel parsing/generation.
  </done>
</task>

<task type="auto">
  <name>Update Frontend State and API layer</name>
  <files>
    admin/src/api/inventory.js
    manager/src/api/inventory.js
  </files>
  <action>
    Steps:
    1. Add axios calls for `/api/inventory/use`, `/export`, and `/import`.
    2. Ensure the export function correctly handles blob/buffer responses to trigger a browser file download.
  </action>
  <verify>
    Syntax check the API utility files.
  </verify>
  <done>
    Frontend is ready to communicate with the new Express routes.
  </done>
</task>

<task type="checkpoint:human-verify">
  <name>Build Frontend React UI</name>
  <files>
    admin/src/pages/Inventory.jsx
    manager/src/pages/Inventory.jsx
  </files>
  <action>
    Steps:
    1. Build a data table displaying current stock levels.
    2. Add a "Mark as Used" modal/form for stock deduction.
    3. Add an "Export Excel" button and an "Import Excel" file dropzone.
  </action>
  <verify>
    Start the React dev server and visually inspect the new UI components.
  </verify>
  <done>
    User interface is fully functional and connected to the API layer.
  </done>
</task>

## Must-Haves
After all tasks complete, verify:
- [ ] Excel files can be successfully downloaded and re-uploaded.
- [ ] Stock quantities update correctly based on Excel imports.

## Success Criteria
- [ ] All tasks verified passing
- [ ] No regressions in existing inventory features