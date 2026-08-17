# Database Schema Guide

This document provides a high-level overview of the PostgreSQL database schema defined via [Prisma](https://www.prisma.io/). The single source of truth for the schema is located in `backend/prisma/schema.prisma`.

## Core Entities

The database consists of 7 primary models. All models map their camelCase properties to `snake_case` in the actual PostgreSQL database using Prisma's `@map` attribute (e.g., `createdAt` becomes `created_at`).

### 1. `UserProfile` (table: `user_profiles`)
Represents administrators and users who can log into the EIMS platform (HR, IT, Managers).
- **Authentication**: Stores the `email`, `password_hash`, and tokens for password setup and resets.
- **Roles & Capabilities**: Contains a `role` (e.g., `Super Admin`, `HR`) and an array of `capability_overrides` for fine-grained permissions.
- **Self-Relation**: Includes `approvedBy` and `approvedUsers` to track which Super Admin approved a new user account.

### 2. `Employee` (table: `employees`)
The central entity of the system. This represents an actual employee whose data is being managed. This is a massive "flat" table containing over 40 fields covering:
- **Personal Info**: Name, Sex, Birthdate, Address, Civil Status, Emergency Contacts.
- **Employment Info**: Department/Account, Position, Employee Status, Date Hired, Separation records.
- **IT Assets**: PC Name, Device Type, BIOS Date, Windows License Key, RustDesk ID (Remote ID), Disk Encryption, MAC Addresses (stored as JSON).
- **Accounts**: BigOutsource Email, Outlook Email, Mattermost, Teams, LMS Account.
- **Archiving Workflow**: Tracks `isArchived`, `provisioningStatus`, and specific department clearances (`archiveHrClearance`, `archiveItClearance`, etc.).
- **Evaluations**: Specific milestone dates (e.g., `eval_first_month`, `eval_anniversary`).

### 3. `Notification` (table: `notifications`)
Powers the in-app notification bell.
- **Relationships**: Belongs to a `Recipient` (UserProfile). Can optionally have an `Actor` (the UserProfile who triggered the notification).
- **Metadata**: Stores `entityType` and `entityId` to link a notification to a specific Employee or Action. Additional context is stored in a `details` JSON field.

### 4. `AuditLog` (table: `audit_logs`)
Maintains an immutable record of all write/delete actions in the system.
- **Tracking**: Logs the `userId`, `userEmail`, `action` (e.g., "Employee Create"), the target `entityId`, and the exact JSON payload of the changes in `details`.
- **Security**: Captures `ipAddress` and `userAgent`.

### 5. `Role` (table: `roles`)
Defines the capabilities available in the RBAC system.
- `slug` serves as the primary key.
- `capabilities` is an array of strings dictating exactly what the role can do.

### 6. `Account` (table: `accounts`)
Represents the various Departments or Client Accounts an employee can be assigned to.
- Includes a 1-letter `departmentCode` used to automatically generate Employee IDs.

### 7. `EmployeeImportStaging` (table: `employee_import_staging`)
A temporary table used to hold data during bulk CSV uploads.
- Stores `rawData` directly from the CSV and the parsed `normalizedData` (both JSON).
- Allows administrators to resolve validation errors asynchronously before committing records to the main `Employee` table.

## Common Patterns
- **UUIDs**: All primary keys (`id`) default to standard UUIDs (except `Role` which uses a slug string, and `AppSettings` which is a singleton).
- **Timestamps**: Every table includes `createdAt` and `updatedAt` managed automatically by Prisma.
