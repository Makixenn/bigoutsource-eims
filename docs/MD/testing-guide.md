# Testing Guide

## 1. Overview
Currently, the Big Outsource EIMS repository does not have an automated testing framework (like Jest, Vitest, Cypress, or Playwright) configured for either the frontend or backend.

## 2. Static Analysis
The project relies on static typing and linting to catch errors before runtime.
- **Frontend:** Uses TypeScript (`tsc --noEmit`) to verify type safety. Run `npm run lint` in the `frontend/` directory to check for type errors.

## 3. Manual Testing Recommendations
Until an automated test suite is implemented, the following critical paths should be manually verified before deploying changes:

1. **Authentication Flow:**
   - Login with and without MFA.
   - Verify that inactive users cannot log in.
2. **Permission Gating:**
   - Verify that users without the `employees.create` capability cannot access the Add Employee form.
   - Verify that backend routes return `403 Forbidden` if accessed without the correct capability.
3. **Employee Lifecycle:**
   - Create an employee, update their details, and archive them.
   - Verify that archiving correctly records an entry in the Audit Log and triggers the appropriate email notifications.
4. **Employee Import:**
   - Upload an Excel file with duplicates and missing departments.
   - Verify that the duplicate resolution logic works and that missing departments are created automatically upon import.
5. **Report Generation:**
   - Export the Employee Master List and ensure the Excel file downloads correctly and contains the expected scoped data.
