# Feature: Roles and Permissions

The system uses a capability-based permission architecture rather than strict role-based access control (RBAC). Roles still exist, but they function as a collection of capabilities.

## 1. Overview
Instead of checking if a user is an "Admin" or "HR", the system checks if the user has a specific capability (e.g., `employees.view`, `auditlogs.undo`). This allows for highly granular access control, where specific users can be granted or denied specific capabilities overriding their base role.

## 2. Capabilities (`frontend/src/lib/permissions.ts`)
The client maintains a type union of all available capabilities. This mirrors the backend catalog. The server is the absolute source of truth.
Capabilities are grouped logically:
- `employees.*` (e.g., `employees.create`, `employees.it.view`)
- `archiving.*`
- `departments.*`
- `imports.*`
- `reports.*`
- `auditlogs.*`
- `notifications.*` (which actions trigger email notifications for the user)

## 3. Frontend Implementation (`AuthContext.tsx`)
The user's effective capabilities are returned in the `/me` and login payloads. 
The `AuthContext` provides a helper function `can(capability: Capability)` to check if the current user has the required permission.

**Example Usage:**
```tsx
const { can } = useAuth();

if (!can('employees.create')) {
  // Hide creation button
}
```
*Note: Client-side capability checks are strictly for UX gating (hiding buttons, redirecting pages). The backend middleware is the actual security boundary.*

## 4. Backend Implementation (`auth.middleware.js`)
API routes are secured using the `requirePermission` middleware.

**Example Usage:**
```javascript
import { requirePermission } from '../middleware/auth.middleware.js';

router.post('/stage', requirePermission('imports.manage'), EmployeeImportController.stage);
```
The backend calculates the effective capabilities by taking the user's role capabilities and applying any user-specific `capabilityOverrides`.
