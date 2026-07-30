import type { AppUser } from '@/src/types';

/**
 * Capability keys — must mirror the backend catalog in
 * server/src/config/capabilities.js. The server is the source of truth; the
 * client receives the user's effective capabilities in the login/me payload
 * and only checks membership here (UX gating, never the security boundary).
 */
export type Capability =
  | 'employees.view'
  | 'employees.create'
  | 'employees.create.hr_fields'
  | 'employees.create.hr_fields.required'
  | 'employees.create.hr_fields.optional'
  | 'employees.create.it_fields'
  | 'employees.create.it_fields.required'
  | 'employees.create.it_fields.optional'
  | 'employees.edit'
  | 'employees.delete'
  | 'employees.unarchive'
  | 'employees.it.view'
  | 'employees.it.edit'
  | 'employees.secrets.view'
  | 'employees.secrets.edit'
  | 'assets.view'
  | 'assets.edit'
  | 'departments.view'
  | 'departments.edit'
  | 'imports.manage'
  | 'reports.view'
  | 'reports.export'
  | 'auditlogs.view'
  | 'auditlogs.undo'
  | 'notifications.hr_action'
  | 'notifications.hr_action.accountAssignment'
  | 'notifications.hr_action.site'
  | 'notifications.hr_action.position'
  | 'notifications.hr_action.status'
  | 'notifications.hr_action.employeeStatus'
  | 'notifications.hr_action.dateHired'
  | 'notifications.hr_action.birthDate'
  | 'notifications.hr_action.phoneNumber'
  | 'notifications.hr_action.address'
  | 'notifications.hr_action.fullName'
  | 'notifications.hr_action.archive'
  | 'notifications.it_action'
  | 'notifications.it_action.bigoutsourceEmail'
  | 'notifications.it_action.rustdeskId'
  | 'notifications.it_action.pcName'
  | 'notifications.it_action.windowsKey'
  | 'notifications.it_action.esetStatus'
  | 'notifications.it_action.activityWatchStatus'
  | 'notifications.it_action.lmsAccount'
  | 'notifications.it_action.emailPassword'
  | 'notifications.it_action.outlookEmail'
  | 'notifications.it_action.teamsAccount'
  | 'notifications.it_action.mattermostAccount'
  | 'notifications.it_action.deviceType'
  | 'notifications.it_action.biosDate'
  | 'notifications.it_action.archive'
  | 'notifications.employee_deleted'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage'
  | 'employees.evaluations.manage';

export function userCan(user: AppUser | null | undefined, capability: Capability): boolean {
  return Boolean(user?.capabilities?.includes(capability));
}
