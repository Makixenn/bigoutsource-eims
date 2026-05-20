# Security Specification - Nexus EIMS

## Data Invariants
- An employee must have a unique `employeeId`.
- Roles must be one of: `super_admin`, `hr_admin`, `it_admin`, `viewer`.
- Audit logs must record at least the timestamp, user ID, and action.
- Sensitive data (Windows keys, etc.) should only be accessible for viewing by authorized roles and must trigger an audit log.

## Role Tiers
1. **Super Admin**: Access to everything. Can manage users.
2. **HR Admin**: Manage `/employees` HR fields. Cannot modify IT fields (Windows key, RustDesk, etc.).
3. **IT Admin**: Manage `/employees` IT fields. Cannot modify HR fields (Site, Phone, etc.).
4. **Viewer**: Read-only access to records.

## Dirty Dozen Payloads (Rejection Criteria)
1. HR Admin trying to update `windowsKey`.
2. IT Admin trying to update `address`.
3. Anonymous user trying to read any data.
4. User trying to delete an audit log.
5. User trying to promote themselves to `super_admin` in `/users`.
6. Viewer trying to create an employee record.
7. IT Admin trying to archive an employee (HR action).
8. Creating an employee with a duplicate ID (Logic handled by document ID structure).
9. Updating `createdAt` or `updatedBy` with a false timestamp.
10. Reading sensitive IT data without `super_admin` or `it_admin` access (controlled by visibility).
11. Disabling the `super_admin` account (Logic check).
12. Bulk deleting employees (Permission check).

## Validation Logic
- All writes must include proper timestamps.
- Fields must match specified types and sizes.
