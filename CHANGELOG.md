# Changelog

## July 5, 2026 - AntiGravity

### Added
- Added exact `Exit Date` field to the Archive modal to allow backdating separations.
- Added specific presets for `Reason for Separation` (e.g., Voluntary Separation, End of Contract) in the Archive modal.
- Added a custom "Other" text input for manual separation reasons in the Archive modal.
- Added `separationDate`, `separation_date`, `separationReason`, and `separation_reason` to the allowed `HR_WRITE_FIELDS` security list in the backend (`backend/src/utils/employeeSecurity.js`) so that separation details can be properly stored in the database.

### Changed
- Replaced the free-text Separation Reason input in the **Employment Details** tab of the `EmployeeProfile` page with a dropdown matching the exact presets from the Archive modal.
- Updated the **Total Personnel Overview** modal and Dashboard Insights card to label inactive/unassigned employees as **Floating** instead of Inactive.
- Modified the Dashboard employee fetch logic to ensure that personnel with a **Floating** status bypass the archive filter and accurately reflect in the active Floating counts.
- Updated the backend `toDatabasePayload` function in `employee.model.js` to correctly map `separation_date` and `separation_reason` fields to the database.

### Fixed
- Fixed an issue where the Dashboard cache would not update after modifying an employee's profile. Integrated `queryClient.invalidateQueries` in `EmployeeProfile.tsx` to automatically invalidate the cached query, preventing the need to manually refresh the page after updates.
- Fixed a bug where archiving an employee would automatically override their separation date to the current date regardless of user input.
- Fixed a bug where the Archive Employee modal was not pre-filling with the already-saved separation date and reason from the employee's record, preventing accidental resets when archiving.
- Fixed a critical data calculation bug in the Security Compliance modals where separated/archived employees' devices were dragging down the active compliance scores. The system now filters out archived devices prior to calculation.
- Fixed a department assignment bug in `ComplianceByDeptModal` where all departments falsely displayed 100% compliance. The logic now properly extracts the `department` string to evaluate the true number of compliant and non-compliant devices.
