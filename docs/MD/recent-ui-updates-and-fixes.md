# Recent UI Updates & Fixes

## 1. Text Selection Unlocked in Employee Records
* **Files Modified**: `frontend/src/pages/Directory.tsx`
* **Change**: Removed the `cursor-default` and `select-none` CSS utility classes from the data cells (`<td>`) within the main Employee Records table.
* **Result**: Users can now freely highlight, select, and copy text from any table column (e.g., emails, phone numbers, addresses). 

## 2. Password Field Relabeling
* **Files Modified**: 
  * `frontend/src/pages/Directory.tsx`
  * `frontend/src/pages/EmployeeProfile.tsx`
* **Change**: Changed all visual references of the employee's email password field from "Password" or "Email Password" to "**EMAIL DEFAULT PASSWORD**".
* **Result**: Better clarity for administrators filling out or viewing the employee's email login credentials. This updates the table column headers, the "Add Employee" wizard, and the fields in the user's Profile View.

## 3. Department Code Restriction
* **Files Modified**: `frontend/src/pages/Departments.tsx`
* **Change**: Strictly limited the department code input to exactly 1 lowercase letter (previously 2–3 letters).
* **Code Implementation**:
  * Updated `sanitizeDepartmentCode` to slice at `1` character instead of `3`.
  * Updated `isValidDepartmentCode` regex to `/^[a-z]{1}$/`.
  * Updated HTML `maxLength` props on the input fields to `1`.
  * Updated character counter UI from `x/3` to `x/1`.
  * Rewrote tooltip helper messages and toast error messages to say "1 lowercase letter".
* **Result**: Department codes are now strictly single-character letters, resolving any ambiguity in department coding schemes.
