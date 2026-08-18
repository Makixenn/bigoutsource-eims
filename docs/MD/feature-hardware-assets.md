# Hardware & IT Asset Inventory Tracking

## 1. Overview
The IT Assets engine manages the technical provisioning and hardware tracking for all employees. Instead of using a separate system, EIMS dynamically integrates IT data into the main employee table and dedicated IT Asset views.

## 2. Tracked IT Assets
The `schema.prisma` defines several IT-specific fields on the Employee model:
- `boEmail` (BigOutsource Email)
- `lmsAccount`
- `pcName` (Physical Machine ID)
- `windowsKey` (Windows License Tracking)
- `rustdeskId` (Strictly referred to as **REMOTE ID**)
- `deviceType` (Laptop, Desktop, Mac)
- `biosDate`
- `esetStatus` (Antivirus compliance)
- `activityWatchStatus` (Time tracker compliance)

## 3. UI Interactions (`Assets.tsx`)
In **v0.13**, the IT Department requested a streamlined way to audit assets without opening individual profiles.
- **Inline Editing:** IT Administrators can double-click specific cells (like `PC Name` or `REMOTE ID`) in the `Assets.tsx` view to edit them directly without saving the entire form.
- **Resizable Columns:** Because hardware keys are long strings, the `Assets.tsx` table uses `ResizableHeader.tsx` to allow dragging column widths.
- **Compliance Filters:** The table allows IT to quickly filter by `esetStatus = 'inactive'` or `activityWatchStatus = 'uninstalled'` to catch employees out of compliance.

## 4. Workflows & Notifications
IT Assets are highly integrated with the Employee Lifecycle:
- **Onboarding:** When HR sets an employee to `pending_it`, IT receives a notification to populate these fields. The system will not finalize the employee until `boEmail`, `pcName`, `REMOTE ID`, and `esetStatus` are strictly filled.
- **Offboarding / Clearance:** When an employee is Deactivated by HR, IT receives a clearance alert. IT must revoke the `boEmail` and format the `pcName` before marking the asset as ready for Archive.
