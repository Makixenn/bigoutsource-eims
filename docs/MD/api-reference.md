# API Reference

The EIMS backend is built on Express.js and provides a RESTful JSON API. All routes are prefixed with `/api` (configured by the `PORT` variable in `.env`).

## Global Middleware & Authentication

All endpoints (except login/password resets) are protected by a JWT verification middleware (`verifyToken`). The token must be passed in the `Authorization` header as a Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

Many routes also implement Role-Based Access Control (RBAC) middlewares (e.g., `requireCapability('manage_users')`) to ensure the authenticated user has permission to perform the action.

## Route Groupings

The API endpoints are modularized in the `backend/src/routes` directory. Here is a high-level overview of the major route groups:

### `/api/auth`
Handles all authentication logic.
- `POST /login` - Issues a JWT token and session.
- `POST /logout` - Invalidates the active session.
- `POST /setup-password` - For users setting their password from an invite link.
- `POST /forgot-password` & `POST /reset-password` - Self-service recovery.

### `/api/employees`
The core directory of employee records.
- `GET /` - Fetches all employees (supports pagination and filtering).
- `POST /` - Creates a new employee record.
- `GET /:id` - Fetches a single employee by ID.
- `PUT /:id` - Updates an employee.
- `DELETE /:id` - Marks an employee for archiving/deletion.
- `POST /:id/archive` - Executes the archiving workflow.

### `/api/imports` (`employeeImport.routes.js`)
Manages the bulk CSV upload workflow.
- `POST /upload` - Accepts a multipart/form-data CSV/Excel file.
- `GET /staging` - Retrieves the staging area records.
- `POST /commit` - Moves validated staging records into the main `employees` table.

### `/api/users`
Manages system administrators and their profiles.
- `GET /` - Lists all EIMS users.
- `POST /` - Invites a new user to the system.
- `PUT /:id/capabilities` - Modifies a user's specific permissions.

### `/api/roles`
RBAC configuration endpoints.
- `GET /` - Lists all roles (Super Admin, HR, IT, etc.) and their assigned capabilities.

### `/api/notifications`
Manages the in-app notification bell.
- `GET /` - Fetches the current user's notifications.
- `PUT /:id/read` - Marks a notification as read.
- `PUT /mark-all-read` - Clears the bell.

### `/api/audit-logs`
Security and accountability logs.
- `GET /` - Fetches all system actions (create, update, delete) sorted chronologically.

### `/api/accounts`, `/api/devices`, `/api/sites`, `/api/settings`
Helper endpoints to fetch drop-down options, manage site lists, query device assignments, and toggle global application settings.

## Standard Response Format

The API generally follows a standard JSON response structure:

**Success Response (200/201)**
```json
{
  "message": "Operation successful",
  "data": { ... } 
}
```

**Error Response (400/401/403/404/500)**
```json
{
  "message": "Error description here",
  "error": "Detailed stack trace or validation error array (only in development environment)"
}
```
