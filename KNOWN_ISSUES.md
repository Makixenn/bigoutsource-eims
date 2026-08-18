# EIMS Known Issues & Technical Debt

This document serves as a living backlog of technical debt, known quirks, and bugs encountered during development. If you are taking over this codebase, please review these items before making sweeping architectural changes.

## 1. Docker Line Endings (CRLF vs LF)
**Issue:** If you clone the repository on a Windows machine, Git will default to `CRLF` line endings. If you then run `docker compose up --build`, the Linux containers will fail to execute bash scripts or internal node commands, throwing cryptic `"command not found"` or `\r` errors.
**Workaround:** We staged a git commit fixing this, but always ensure your IDE is set to `LF` for all files (especially Dockerfiles, `.env`, and scripts) before building the containers.

## 2. Legacy Scripts & Old Code
**Issue:** You may find old `.js` scripts or outdated `test` folders that aren't actively running.
**Current State:** During our final OJT cleanup, we moved most legacy, unused code and old test scripts into a `_temp/` directory at the root. We didn't delete them just in case they contained useful logic for future reference, but they are completely disconnected from the active `src/` tree. Feel free to permanently delete `_temp/` if you don't need it.

## 3. Large Payload Import Limits
**Issue:** The Excel Employee Import feature works flawlessly for files under 1MB. However, attempting to upload massive multi-megabyte Excel files with thousands of rows will crash the Node/Express backend with a `413 Payload Too Large` error.
**Technical Debt:** The Express `body-parser` limit is currently hardcoded. If the company scales massively, we recommend offloading the Excel parsing to a background worker queue (like BullMQ) rather than processing it synchronously in the HTTP request.

## 4. Prisma Schema Syncing
**Issue:** If you pull down a git branch where a coworker changed the database schema (`schema.prisma`), your frontend will immediately crash with "column not found" errors.
**Workaround:** Docker does not automatically migrate your local Postgres database. You MUST run `npx prisma db push` inside the `backend/` container terminal every time you pull a schema change.

## 5. UI Quirks
- **Mobile Responsiveness:** EIMS was built primarily as a Desktop Admin Dashboard. Elements like the Resizable Data Tables and IT Assets Board will scroll horizontally and are not heavily optimized for iPhone screens.
- **Avatar Caching:** If a user uploads a new Profile Avatar, the browser might aggressively cache the old image URL. They may need to hard-refresh (`Ctrl+F5`) to see their new avatar immediately.

## 6. Strict Nomenclature Violations
**Issue:** During development, a very common QA failure occurred when developers used inconsistent terminology across the app. 
**Technical Debt:** The codebase still has backend variables named `rustdeskId`, `accountAssignment`, and `accountType`. However, the **Frontend UI MUST strictly render these as:**
- `DEPARTMENT/CAMPAIGN` (Never "Account" or "Account Type")
- `REMOTE ID` (Never "RustDesk ID")
- `EMPLOYEE INFORMATION` (Never "Work & Account Info")
If you build new features, ensure the frontend labels adhere to these rules, or the HR/IT departments will flag it as a bug.

## 7. Library Module Display Syncing
**Issue:** We've encountered recurring issues with the Library Module where newly uploaded documents do not immediately display in the frontend list.
**Workaround:** This is typically due to aggressive React Query caching or delayed state updates. If you notice documents not appearing after a successful upload, double-check that the `invalidateQueries` method is being correctly fired in the mutation's `onSuccess` callback.
