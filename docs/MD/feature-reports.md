# Feature: Reports

The Reports feature generates dynamic, downloadable Excel and CSV spreadsheets for various business intelligence and auditing needs.

## 1. Overview
Instead of relying on a dedicated backend reporting endpoint, the frontend handles data aggregation and workbook generation in the browser using the `exceljs` library. The `Reports.tsx` component fetches necessary raw data from existing list endpoints (like `/api/employees` and `/api/auditlogs`) and transforms them into predefined report templates.

## 2. Available Reports

1. **Employee Master List**
   - **Data:** Complete overview of all personnel, credentials, and hardware assignments.
   - **Filters:** Can be scoped by `DEPARTMENT/CAMPAIGN` (`internal`, `external`, or specific departments).
   - **Capability Required:** `reports.export.master_list`

2. **Workforce Analytics**
   - **Data:** Statistics on company growth, turnover, and distribution (generates sheets for KPIs, Department Distribution, Site Distribution, and Growth Trends).
   - **Capability Required:** `reports.export.analytics`

3. **Department Roster**
   - **Data:** List of active employees.
   - **Filters:** Filterable by department.
   - **Capability Required:** `reports.export.department_roster`

4. **IT Asset & License Report**
   - **Data:** Mapping of PCs, Windows license keys, MAC addresses, and remote IDs (`REMOTE ID`).
   - **Capability Required:** `reports.export.it_asset`

5. **Site Occupancy Report**
   - **Data:** Breakdown of personnel distribution across all physical sites (generates one summary sheet, plus one sheet per site).
   - **Capability Required:** `reports.export.site_occupancy`

6. **Security Compliance Audit**
   - **Data:** Lists devices missing ESET or Activity Watch software, or missing Windows keys.
   - **Capability Required:** `reports.export.security_audit`

7. **Recent Terminations & Archives**
   - **Data:** Audit trail for off-boarding activities over the last 30 days (correlates archived employees with audit logs).
   - **Capability Required:** `reports.export.terminations`

8. **System Audit History**
   - **Data:** Full historical log of all system activities.
   - **Capability Required:** `reports.export.system_audit`

9. **Employee Evaluations Report**
   - **Data:** Extracts tracking dates for 1st Month, 3rd Month, 5th Month, 6th Month, and Anniversary evaluations.
   - **Capability Required:** `reports.export.evaluations`

## 3. Implementation Details

- **ExcelJS:** The system creates multi-sheet workbooks complete with frozen headers, bold text, auto-filtering, and dynamic column widths.
- **Client-Side Processing:** All heavy joining and filtering (e.g., merging audit logs with employee records to find termination dates) occurs in the browser.
- **Archived Employee Handling:** Most standard reports (like Master List or IT Assets) specifically exclude archived employees via an `excludeArchivedEmployees()` utility.
