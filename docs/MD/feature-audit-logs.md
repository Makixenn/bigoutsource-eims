# Feature: Audit Logs

The Audit Log feature provides a complete historical log of all system activities, changes, and access records for security and compliance purposes.

## 1. Overview
The system automatically logs critical actions (e.g., creations, updates, deletions) across various entities. Administrators can view, search, and filter these logs in the UI, and in some cases, undo specific actions directly.

## 2. API Routes
Audit log routes are located at `/api/audit-logs` and require specific permissions.

- `GET /` - List audit logs (Requires `auditlogs.view`). Supports pagination and limiting.
- `POST /:id/undo` - Undo a specific update action (Requires `auditlogs.undo`).

## 3. Frontend Implementation (`AuditLogs.tsx`)

### Key Features
1. **Filtering & Searching:**
   - Text search across actions, entities, operators, and detailed changes.
   - Date range filtering (Start Date to End Date).
   - Dropdown filters for `Action`, `Entity`, and `User`.
2. **Realtime Updates:**
   - The UI uses `useRealtimeSubscription` to listen for new logs in the `audit_logs` table via Supabase, automatically triggering a refresh so the audit log page is always up to date without manual reloading.
3. **Action Details & Differences:**
   - For update actions, the UI intelligently formats the JSON `details` payload to show a visual diff (e.g., `Field A: "Old" -> "New"`).
   - Expandable arrays are used to handle large lists of IDs or modifications cleanly.
4. **Undo Capability:**
   - Logs with actions ending in `.update` display an "Undo" button (if the user has the `auditlogs.undo` permission).
   - Clicking this button prompts a confirmation modal to revert the specific changes logged in that record.

## 4. Database Schema Context
The `AuditLog` table stores:
- `action` (e.g., `employee.update`, `department.create`)
- `entityType` and `entityId`
- `userEmail`, `userName`, `userRole` (the operator)
- `details` (JSON payload containing the exact changes)
- `ipAddress`
