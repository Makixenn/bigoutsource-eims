export type UserRole = 'super_admin' | 'hr_admin' | 'it_admin' | 'viewer';
export type EmployeeStatus = 'active' | 'inactive' | 'archive';

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  address: string;
  site: string;
  status: EmployeeStatus;
  accountAssignment: string;
  boEmail: string;
  lmsAccount: string;
  // IT Data
  pcName: string;
  biosDate: string;
  windowsKey: string;
  rustDeskId: string;
  remoteId: string;
  esetStatus: 'Installed' | 'Missing' | 'Update Required';
  activityWatchStatus: 'Installed' | 'Missing';
  updatedAt: string;
  updatedBy: string;
  avatar?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  site: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  uid: string;
  userName: string;
  action: string;
  details: string;
  affectedRecord: string;
}

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: '1',
    employeeId: 'BO-2022-001',
    fullName: 'Sarah Jenkins',
    phone: '+1 555-0101',
    address: '123 Apple St, London',
    site: 'Site A',
    status: 'active',
    accountAssignment: 'Project Nexus',
    boEmail: 'sarah.j@bigoutsource.com',
    lmsAccount: 'sarah_lms',
    pcName: 'BO-DSK-01',
    biosDate: '2023-05-12',
    windowsKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
    rustDeskId: '123 456 789',
    remoteId: 'REM-101',
    esetStatus: 'Installed',
    activityWatchStatus: 'Installed',
    updatedAt: '2024-05-19T10:00:00Z',
    updatedBy: 'admin_uid',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100'
  },
  {
    id: '2',
    employeeId: 'BO-2023-042',
    fullName: 'Michael Chen',
    phone: '+1 555-0102',
    address: '456 Birch Rd, SF',
    site: 'Site B',
    status: 'active',
    accountAssignment: 'Internal Dev',
    boEmail: 'm.chen@bigoutsource.com',
    lmsAccount: 'mchen_lms',
    pcName: 'BO-LAP-05',
    biosDate: '2024-01-20',
    windowsKey: 'YYYYY-YYYYY-YYYYY-YYYYY-YYYYY',
    rustDeskId: '987 654 321',
    remoteId: 'REM-202',
    esetStatus: 'Missing',
    activityWatchStatus: 'Missing',
    updatedAt: '2024-05-18T15:30:00Z',
    updatedBy: 'admin_uid',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100'
  }
];
