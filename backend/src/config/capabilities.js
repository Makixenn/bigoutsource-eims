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
  'notifications.it_action': 'Receive IT action required notifications',
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
    'employees.view', 'employees.create', 'employees.create.hr_fields.required', 'employees.create.it_fields.required', 'employees.edit', 'employees.evaluations.manage', 'employees.delete', 'employees.unarchive',
    'employees.it.view', 'employees.it.edit', 'employees.secrets.view', 'employees.secrets.edit',
    'assets.view', 'assets.edit',
    'departments.view', 'departments.edit',
    'imports.manage',
    'reports.view', 'reports.export',
    'auditlogs.view', 'auditlogs.undo',
    'notifications.hr_action', 'notifications.it_action',
  ],
  hr_admin: [
    'employees.view', 'employees.create', 'employees.create.hr_fields.required', 'employees.edit', 'employees.evaluations.manage', 'employees.delete', 'employees.unarchive',
    'departments.view', 'departments.edit',
    'imports.manage',
    'reports.view', 'reports.export',
    'auditlogs.view',
    'notifications.hr_action',
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
