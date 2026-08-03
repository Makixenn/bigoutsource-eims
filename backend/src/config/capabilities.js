/**
 * Capability catalog + the default role → capability mapping.
 *
 * Capabilities are the real currency of access control. Routes and field
 * visibility check capabilities, never role names. The role → capability map
 * below is the in-code default for the five seeded roles; in Phase 3 this map
 * moves into the database (the `roles` table) so Super Admin can edit it, but
 * the catalog and the checks stay here.
 */

// key → human label (label used later by the role editor UI)
export const CAPABILITIES = {
  'employees.view': 'View employee directory (identity/HR fields)',
  'employees.create': 'Create employees',
  'employees.create.hr_fields': 'Fill out HR Exclusive Fields',
  'employees.create.it_fields': 'Fill out IT Exclusive Fields',
  'employees.edit': 'Edit employee identity/HR fields',
  'employees.evaluations.manage': 'Manage employee evaluation dates, issuances, and HMO info',
  'employees.evaluations.view': 'View employee evaluations dashboard',
  'employees.delete': 'Archive Employees',
  'employees.unarchive': 'Unarchive Employees',
  'employees.it.view': 'View employee account & device info',
  'employees.it.edit': 'Edit employee account & device info',

  'employees.secrets.view': 'View employee secrets (passwords, keys, remote IDs)',
  'employees.secrets.edit': 'Edit employee secrets',
  'assets.view': 'View hardware asset inventory',
  'assets.edit': 'Manage hardware asset inventory',
  'departments.view': 'View departments',
  'departments.edit': 'Manage departments',
  'imports.manage': 'Run employee imports',
  'reports.view': 'View reports',
  'reports.export': 'Export / download reports',
  'auditlogs.view': 'View audit logs',
  'auditlogs.undo': 'Undo audit-logged actions',
  'notifications.hr_action': 'Receive HR action required notifications',
  'notifications.hr_action.accountAssignment': 'Notify on Department/Campaign updates',
  'notifications.hr_action.site': 'Notify on Site updates',
  'notifications.hr_action.position': 'Notify on Position updates',
  'notifications.hr_action.status': 'Notify on Status updates',
  'notifications.hr_action.employeeStatus': 'Notify on Employment Status updates',
  'notifications.hr_action.dateHired': 'Notify on Date Hired updates',
  'notifications.hr_action.birthDate': 'Notify on Birthdate updates',
  'notifications.hr_action.phoneNumber': 'Notify on Phone Number updates',
  'notifications.hr_action.address': 'Notify on Address updates',
  'notifications.hr_action.fullName': 'Notify on Name updates',
  'notifications.hr_action.nickname': 'Notify on Nickname updates',
  'notifications.hr_action.sex': 'Notify on Sex updates',
  'notifications.hr_action.civilStatus': 'Notify on Civil Status updates',
  'notifications.hr_action.sssNo': 'Notify on SSS No updates',
  'notifications.hr_action.tinNo': 'Notify on TIN No updates',
  'notifications.hr_action.philhealthNo': 'Notify on PhilHealth No updates',
  'notifications.hr_action.pagibigNo': 'Notify on Pag-Ibig No updates',
  'notifications.hr_action.personalEmail': 'Notify on Personal Email updates',
  'notifications.hr_action.mainContact': 'Notify on Main Contact updates',
  'notifications.hr_action.emergencyContact': 'Notify on Emergency Contact updates',
  'notifications.hr_action.emergencyContactNumber': 'Notify on Emergency Contact Number updates',
  'notifications.hr_action.archive': 'Notify on Archive Actions',
  'notifications.hr_action.daily_birthdays': 'Receive Daily Birthday Alerts',
  'notifications.hr_action.evaluations': 'Notify on Evaluation Dates updates',
  'notifications.it_action': 'Receive IT action required notifications',
  'notifications.it_action.provisioning': 'Notify on IT Provisioning handoffs',
  'notifications.it_action.bigoutsourceEmail': 'Notify on Snappy Email updates',
  'notifications.it_action.rustdeskId': 'Notify on Remote ID updates',
  'notifications.it_action.pcName': 'Notify on PC Name updates',
  'notifications.it_action.windowsKey': 'Notify on Windows License Key updates',
  'notifications.it_action.esetStatus': 'Notify on ESET Status updates',
  'notifications.it_action.activityWatchStatus': 'Notify on ActivityWatch Status updates',
  'notifications.it_action.lmsAccount': 'Notify on LMS Account updates',
  'notifications.it_action.emailPassword': 'Notify on Email Password updates',
  'notifications.it_action.outlookEmail': 'Notify on Outlook Email updates',
  'notifications.it_action.teamsAccount': 'Notify on Teams Account updates',
  'notifications.it_action.mattermostAccount': 'Notify on Mattermost Account updates',
  'notifications.it_action.deviceType': 'Notify on Device Type updates',
  'notifications.it_action.biosDate': 'Notify on BIOS Date updates',
  'notifications.it_action.archive': 'Notify on Archive Actions',
  
  'notifications.system': 'Receive System Alerts',
  'notifications.system.export_alerts': 'Receive Large Data Export Alerts',
  
  // Global Notifications
  'notifications.employee_deleted': 'Notify on Permanent Deletion',

  // Meta — Super Admin only; never grantable to custom roles (Phase 4 guardrail).
  'users.manage': 'Manage user accounts',
  'roles.manage': 'Manage roles & permissions',
  'settings.manage': 'Manage system settings',
};

export const ALL_CAPABILITIES = Object.keys(CAPABILITIES);

export const META_CAPABILITIES = ['users.manage', 'roles.manage', 'settings.manage'];

// Default capability sets for the five seeded roles (the agreed access matrix).
export const ROLE_CAPABILITIES = {
  super_admin: ALL_CAPABILITIES,
  admin: [
    'employees.view', 'employees.create', 'employees.create.hr_fields.required', 'employees.create.it_fields.required', 'employees.edit', 'employees.evaluations.manage', 'employees.evaluations.view', 'employees.delete', 'employees.unarchive',
    'employees.it.view', 'employees.it.edit', 'employees.secrets.view', 'employees.secrets.edit',
    'assets.view', 'assets.edit',
    'departments.view', 'departments.edit',
    'imports.manage',
    'reports.view', 'reports.export',
    'auditlogs.view', 'auditlogs.undo',
    'notifications.hr_action', 'notifications.it_action',
    'notifications.hr_action.accountAssignment', 'notifications.hr_action.site', 'notifications.hr_action.position', 'notifications.hr_action.status', 'notifications.hr_action.employeeStatus', 'notifications.hr_action.dateHired', 'notifications.hr_action.birthDate', 'notifications.hr_action.phoneNumber', 'notifications.hr_action.address', 'notifications.hr_action.fullName', 'notifications.hr_action.nickname', 'notifications.hr_action.sex', 'notifications.hr_action.civilStatus', 'notifications.hr_action.sssNo', 'notifications.hr_action.tinNo', 'notifications.hr_action.philhealthNo', 'notifications.hr_action.pagibigNo', 'notifications.hr_action.personalEmail', 'notifications.hr_action.mainContact', 'notifications.hr_action.emergencyContact', 'notifications.hr_action.emergencyContactNumber', 'notifications.hr_action.archive', 'notifications.hr_action.evaluations',
    'notifications.it_action.provisioning', 'notifications.it_action.bigoutsourceEmail', 'notifications.it_action.rustdeskId', 'notifications.it_action.pcName', 'notifications.it_action.windowsKey', 'notifications.it_action.esetStatus', 'notifications.it_action.activityWatchStatus', 'notifications.it_action.lmsAccount', 'notifications.it_action.emailPassword', 'notifications.it_action.outlookEmail', 'notifications.it_action.teamsAccount', 'notifications.it_action.mattermostAccount', 'notifications.it_action.deviceType', 'notifications.it_action.biosDate', 'notifications.it_action.archive',
    'notifications.employee_deleted',
    'notifications.system', 'notifications.system.export_alerts'
  ],
  hr_admin: [
    'employees.view', 'employees.create', 'employees.create.hr_fields.required', 'employees.edit', 'employees.evaluations.manage', 'employees.evaluations.view', 'employees.delete', 'employees.unarchive',
    'departments.view', 'departments.edit',
    'imports.manage',
    'reports.view', 'reports.export',
    'auditlogs.view',
    'notifications.hr_action',
    'notifications.hr_action.accountAssignment', 'notifications.hr_action.site', 'notifications.hr_action.position', 'notifications.hr_action.status', 'notifications.hr_action.employeeStatus', 'notifications.hr_action.dateHired', 'notifications.hr_action.birthDate', 'notifications.hr_action.phoneNumber', 'notifications.hr_action.address', 'notifications.hr_action.fullName', 'notifications.hr_action.nickname', 'notifications.hr_action.sex', 'notifications.hr_action.civilStatus', 'notifications.hr_action.sssNo', 'notifications.hr_action.tinNo', 'notifications.hr_action.philhealthNo', 'notifications.hr_action.pagibigNo', 'notifications.hr_action.personalEmail', 'notifications.hr_action.mainContact', 'notifications.hr_action.emergencyContact', 'notifications.hr_action.emergencyContactNumber', 'notifications.hr_action.archive', 'notifications.hr_action.daily_birthdays', 'notifications.hr_action.evaluations',
    'notifications.employee_deleted'
  ],
  it_admin: [
    'employees.view', 'employees.create', 'employees.create.it_fields.required',
    'employees.it.view', 'employees.it.edit', 'employees.secrets.view', 'employees.secrets.edit',
    'assets.view', 'assets.edit',
    'departments.view',
    'imports.manage',
    'reports.view', 'reports.export',
    'auditlogs.view',
    'notifications.it_action',
    'notifications.it_action.provisioning', 'notifications.it_action.bigoutsourceEmail', 'notifications.it_action.rustdeskId', 'notifications.it_action.pcName', 'notifications.it_action.windowsKey', 'notifications.it_action.esetStatus', 'notifications.it_action.activityWatchStatus', 'notifications.it_action.lmsAccount', 'notifications.it_action.emailPassword', 'notifications.it_action.outlookEmail', 'notifications.it_action.teamsAccount', 'notifications.it_action.mattermostAccount', 'notifications.it_action.deviceType', 'notifications.it_action.biosDate', 'notifications.it_action.archive',
    'notifications.employee_deleted'
  ],
  viewer: [
    'employees.view',
    'departments.view',
  ],
};

export function capabilitiesForRole(role) {
  return ROLE_CAPABILITIES[role] ? [...ROLE_CAPABILITIES[role]] : [];
}

/** Resolve a user's effective capabilities (prefers an explicit list, else derives from role). */
export function userCapabilities(user) {
  if (!user) return [];
  if (Array.isArray(user.capabilities)) return user.capabilities;
  return capabilitiesForRole(user.role);
}

export function userHasCapability(user, capability) {
  return userCapabilities(user).includes(capability);
}

export function userHasAnyCapability(user, capabilities = []) {
  const owned = userCapabilities(user);
  return capabilities.some((capability) => owned.includes(capability));
}
