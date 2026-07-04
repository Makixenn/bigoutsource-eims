# Date Hired Feature & Bug Fixes

This document summarizes the changes made to implement the `dateHired` feature, along with the subsequent bug fixes and UI improvements. This can be used as a reference when creating a Pull Request (PR) or commit message for GitHub.

## 🗄️ Database Changes
- **`backend/prisma/schema.prisma`**: Added the `dateHired` field as an optional String (`String? @map("date_hired")`) to the `Employee` model.

## ⚙️ Backend Changes
- **`backend/src/utils/employeeSecurity.js`**: Added `dateHired` to the `HR_WRITE_FIELDS` array. This ensures the security filter allows the frontend to write/update this field.
- **`backend/src/services/employee.service.js`**: Added `dateHired` to the `trackedFields` array so that any changes to this field are properly captured in the Audit Logs.
- **Prisma Client**: Regenerated the Prisma client inside the `backend` Docker container to sync the new schema with the runtime environment.

## 💻 Frontend Changes

### 1. Employee Profile & Creation
- **`frontend/src/pages/EmployeeProfile.tsx`**: 
  - Added the "Date Hired" date picker to the Employee Information section.
  - Updated the API submission payload to include `dateHired`.
  - **Bug Fix**: Changed how optional fields are sent to the backend. Previously, clearing a field sent `undefined` (which the backend ignored). Now, clearing a field sends an empty string (`""`), allowing users to successfully clear `dateHired`, `phone`, `address`, and other optional fields.
- **`frontend/src/pages/Directory.tsx`**:
  - Added the "Date Hired" date picker to the New Employee Creation form.
  - Included `dateHired` in the initial payload when creating a new employee.

### 2. Dashboard & Modals
- **`frontend/src/pages/Dashboard.tsx`**:
  - Updated the "New Hires" logic to prioritize the new `dateHired` field. If an employee lacks a `dateHired`, it gracefully falls back to their `createdAt` timestamp.
  - Renamed the "New Hires (30d)" stat card to simply "New Hires" to accommodate custom filtering.
  - Changed the props passed to the `NewHiresModal` so it receives the complete employee list (`allEmployees`) instead of a truncated list.
- **`frontend/src/features/dashboard/components/modals/NewHiresModal.tsx`**:
  - Added a Month/Year picker (e.g., `<input type="month" />`) next to the search bar.
  - Rewrote the internal logic to filter the "Total New Hires", "Hires This Week", the hiring trend chart, and the table based on the selected month and year.
  - Ensured the UI defaults back to the "Last 30 Days" when the month filter is cleared.

### 3. Workforce Analytics
- **`frontend/src/pages/Reports.tsx`**:
  - Updated the workforce metrics, attrition calculations, and employee sorting to use `dateHired` (with `createdAt` as a fallback) to ensure historical accuracy in the reports.
