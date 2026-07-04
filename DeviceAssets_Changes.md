# Device Assets & UI Nomenclature Changes

This document summarizes the recent updates made across the application regarding Device Assets, Accounts, and Remote IDs.

## Summary of Changes

### 1. "Device Assets" Fields Removal
We removed the **BIOS Date** and **Windows License Key** from the UI displays and tables to streamline the Device Assets information.
- **`EmployeeProfile.tsx`**: Removed both fields from the "Device Assets" section.
- **`Assets.tsx`**: Removed the columns and edit fields from the main IT Asset Management table.
- **`EmployeeImportReview.tsx`**: Removed both fields from the import review columns and forms.
- **`Reports.tsx`**: Removed both fields from the exported Excel sheets (Employee Master List & IT Asset Report).

### 2. Nomenclature: "ACCOUNT" ➔ "DEPARTMENT/CAMPAIGN."
Updated the terminology used to assign an employee to an account/department.
- **`EmployeeProfile.tsx`**: Changed the label in the EMPLOYEE INFORMATION section from "Department/Account Type" to **"DEPARTMENT/CAMPAIGN."**.
- **`Directory.tsx`**: Updated the table column header from "Account" to **"DEPARTMENT/CAMPAIGN."**.
- **`DirectoryUI.tsx`**: Updated the filter dropdown placeholder from "All Account" to **"All DEPARTMENT/CAMPAIGN."**.
- **`EmployeeImportReview.tsx`**: Updated the import mapping labels to reflect the new nomenclature.
- **`Reports.tsx`**: Updated the export column header to **"DEPARTMENT/CAMPAIGN."**.

### 3. Nomenclature: "RUSTDESK ID" ➔ "REMOTE ID"
Updated the remote control identification label.
- **`EmployeeProfile.tsx`**: Changed "RustDesk ID" to **"REMOTE ID"** in the Device Assets section.
- **`Assets.tsx`**: Changed the table column header, search placeholder, and empty state texts to use **"REMOTE ID"**.
- **`EmployeeImportReview.tsx`**: Changed "RustDesk ID" to **"REMOTE ID"** in all form fields and data mapping headers.
- **`Reports.tsx`**: Changed the export column header from "Rust Desk ID" to **"REMOTE ID"**.

### 4. Nomenclature: "Work & Account Info" ➔ "EMPLOYEE INFORMATION"
Updated the section title for employee details to make it clearer and more standardized.
- **`EmployeeProfile.tsx`**: Changed the `<ProfileSection>` title from "Work & Account Info" to **"EMPLOYEE INFORMATION"**.
- **`EmployeeImportReview.tsx`**: Changed the corresponding `<ProfileSection>` title in the data import review grid from "Work & Account Info" to **"EMPLOYEE INFORMATION"**.

*Note: The underlying database field names (`biosDate`, `windowsKey`, `rustdeskId`, `accountAssignment`) remain unchanged to preserve data integrity and compatibility with the backend schema. Only the user-facing UI labels and exports were modified.*

---

## Navigation Guide: Where to see these changes

Here's how to navigate to each of the updated pages within the application to verify the changes:

### 1. Employee Profile
- **How to get there**: 
  1. Click on **Directory** in the main navigation sidebar.
  2. Click on any employee's name (or the "Details" icon) to open their profile.
- **Where to look**: Scroll down to the **EMPLOYEE INFORMATION** section to see "DEPARTMENT/CAMPAIGN." and the **Device Assets** section to see "REMOTE ID" (BIOS Date and Windows License Key will no longer appear here).

### 2. IT Asset Management (Assets Table)
- **How to get there**: Click on the **Assets** (or IT Asset Management) tab in the main navigation sidebar.
- **Where to look**: Check the main table headers for the new "REMOTE ID" column. You'll notice the BIOS Date and Windows License Key columns have been removed.

### 3. Employee Directory
- **How to get there**: Click on **Directory** in the main navigation sidebar.
- **Where to look**: Check the table headers for the "DEPARTMENT/CAMPAIGN." column. The filter dropdown at the top of the table has also been updated to "All DEPARTMENT/CAMPAIGN."

### 4. Import Review Page
- **How to get there**: Navigate to the Directory, click **Import** (or the upload button), and select an Excel/CSV file to upload.
- **Where to look**: The review table and individual form fields will now use the updated labels ("DEPARTMENT/CAMPAIGN." and "REMOTE ID"), with the removed fields no longer appearing.

### 5. Exported Reports
- **How to get there**: Click on **Reports** in the main navigation sidebar (or the Export button in the Directory/Dashboard).
- **Where to look**: Open the downloaded Excel (`.xlsx`) file and look at the column headers in the generated sheets.
