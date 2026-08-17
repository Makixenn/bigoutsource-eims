# Feature: Employee Imports

The Employee Import feature allows bulk uploading and staging of employee records using Excel or CSV files. It includes a comprehensive review and resolution interface to handle data validation, deduplication, and missing departments.

## 1. Overview
The import process is divided into two phases:
1. **Staging:** The uploaded file is parsed and rows are saved to a temporary `EmployeeImportStaging` table.
2. **Review & Import:** Administrators resolve issues (e.g., duplicates, missing fields) and then move valid records into the actual `Employee` table.

## 2. API Routes
All import-related routes are under `/api/imports` and require the `imports.manage` permission.

- `GET /summary` - Get a high-level summary of current import batches.
- `GET /` - List staged records (supports filtering by `status` and `importBatchId`).
- `POST /stage` - Upload a file and stage the records.
- `POST /duplicates/resolve` - Resolve a duplicate record (merge or keep).
- `DELETE /rows` - Bulk delete staging records.
- `PUT /rows/:id` - Edit a staging record.
- `DELETE /rows/:id` - Delete a single staging record.
- `POST /delete-many` - Delete multiple staging records by ID.
- `POST /:importBatchId/import-ready` - Import all "ready" records from a batch into the main employee table.

## 3. Frontend Implementation (`EmployeeImportReview.tsx`)

### Views
The review interface has three main tabs:
- **Issues:** Rows with validation errors (missing required fields, invalid formats, etc.).
- **Duplicates:** Rows where the employee ID already exists in the database.
- **Ready:** Rows that have passed validation and are ready to be imported.

### Key Logic & Features
1. **Duplicate Resolution:** 
   - Administrators can choose to **Merge** the incoming data with the existing record, or **Keep** the incoming data as is.
   - The UI automatically suggests a merged record by prioritizing non-empty fields from the incoming data over the existing data.
2. **On-the-fly Department Creation:** 
   - Before calling `importReady`, the UI checks if any of the ready records belong to a `DEPARTMENT/CAMPAIGN` that doesn't exist yet.
   - If missing departments are found, the UI blocks the import and prompts the user to create them instantly (using an auto-suggested 1-4 letter department code).
3. **Data Normalization:**
   - Site options are normalized automatically (e.g., "can", "cand" -> "Candelaria"; "hq", "san pablo" -> "HQ").
   - Department codes are sanitized (`a-z`, max 4 characters).
4. **Caching Strategy:**
   - `importReviewCache` stores the currently focused batch and rows to prevent unnecessary refetching when navigating between views.

## 4. Database Schema Context
The `EmployeeImportStaging` model handles the temporary rows. 
- It uses JSON fields (`normalizedData`, `existingData`) to store the parsed Excel rows flexibly.
- `issues` is stored as JSON array containing objects with `code`, `message`, and `severity`.
- `duplicateKey` links a staged row to an existing employee record.
