# Feature Walkthrough: Lyndon Branch (July 3 - July 11)

This document highlights the latest updates, features, and improvements implemented in the 'lyndon' branch.

## 1. Role-Based Employee Creation
The "Add Employee" workflow has been redesigned to separate HR and IT workflows. This ensures users only interact with fields relevant to their role. Key updates include:
- **Segmented Workflow**: Separate inputs for HR and IT perspectives.
- **New Fields**: "Date Hired" fields added to Steps 3 and 4 of the creation modal.
- **Validation**: Strict validation rules for Department Codes and Employee ID duplication have been implemented to maintain data integrity.

## 2. Smart Notifications & Redesign
We have moved away from generic notifications. The system now provides targeted, context-aware alerts with a completely revamped UI.
- **HR/IT Targeting**: The 'Receive employee-added notifications' capability was split. If an HR field is missing during creation, only the HR team receives the specific notification, and vice versa for IT.
- **Redesigned Dropdown**: Notification cards now feature a clean blue theme with clear 'HR FIELDS INCOMPLETE' / 'IT FIELDS INCOMPLETE' red pill badges.
- **Actionable Buttons**: A 'Done' checkmark button was added to each notification to allow admins to globally dismiss a notification once handled. A 'Refresh' button was also added to manually fetch new alerts.

## 3. Archiving Rules
To prevent accidental data loss, archiving has become more secure.
- **Mandatory Dates**: You are now required to enter a valid date before the system will allow you to archive an employee record.

## 4. Super Admin Audit Logs
We have expanded our security and accountability measures by implementing comprehensive logging.
- **Clean Action Labels**: The 'Action' labels in the Audit Logs were cleaned up to look more readable (e.g., 'Employee Create' instead of raw technical codes).
- **Clickable Target Entities**: The 'Target Entity' column in the global Audit Logs dashboard is cleanly formatted (black by default) and turns blue when hovered. Clicking it directly opens the target employee's profile.

## 5. Password Management
Users now have greater control over their account security.
- **Self-Service**: Users can now navigate to their Settings to securely update their passwords without requiring admin intervention.

## 6. UI Polish & Stability
Several visual and performance improvements have been made to ensure a smoother user experience.
- **Dynamic Badges**: In Add/Edit modals and Employee Profiles, the red "Required" badge now automatically changes to a green "Filled" badge once data is entered.
- **Performance Fix**: Corrected React Router Suspense wrappers. This eliminates the "page freezing" issue when clicking sidebar links, replacing it with an immediate loading spinner.
- **Table Layout**: Improved the Employee Record Table view and optimized live update performance.
