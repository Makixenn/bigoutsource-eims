export type UserRole = 'super_admin' | 'admin' | 'hr_admin' | 'it_admin' | 'viewer';
type EmployeeStatus = 'active' | 'inactive' | 'floating' | 'separated';

export interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  address: string;
  site: string;
  status: EmployeeStatus;
  employeeStatus?: 'Regular' | 'Probationary' | 'Fix-Term' | string;
  accountAssignment: string;
  boEmail: string;
  bigoutsourceEmail?: string;
  lmsAccount: string;
  // IT Data
  isArchived: boolean;
  isReadyForArchive?: boolean;
  provisioningStatus?: string;
  avatarUrl?: string;
  pcName: string;
  deviceType: string;
  dateHired: string;
  biosDate: string;
  diskEncryptionKey?: string;
  windowsKey: string;
  windowsLicenseKey?: string;
  rustDeskId: string;
  esetStatus: 'Active' | 'Inactive';
  activityWatchStatus: 'Installed' | 'Missing';
  updatedAt: string;
  updatedBy: string;
  position?: string;
  nickname?: string;
  sex?: string;
  civilStatus?: string;
  sssNo?: string;
  tinNo?: string;
  philhealthNo?: string;
  pagibigNo?: string;
  personalEmail?: string;
  mainContact?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  birthdate?: string;
  floatDate?: string;
  outlookEmail?: string;
  mattermostAccount?: string;
  teamsAccount?: string;
  separationDate?: string;
  separationReason?: string;
  idIssuance?: string;
  hoodieIssuance?: string;
  hmoEnrollment?: string;
  hmoMemberCode?: string;
  evalFirstMonth?: string;
  evalThirdMonth?: string;
  evalFifthMonth?: string;
  evalSixthMonth?: string;
  evalAnniversary?: string;

  macAddresses?: {
    mac: string;
    type: string;
    os: string;
    specs: string;
  }[];
}

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'active' | 'disabled';
  fullName?: string;
  department?: string;
  site: string;
  /** Effective capabilities resolved server-side from the user's role. */
  capabilities?: string[];
  /** Per-account capability override; null/undefined means "inherit from role". */
  capabilityOverrides?: string[] | null;
  mfaEnabled?: boolean;

}

interface AuditLog {
  id: string;
  timestamp: string;
  uid: string;
  userName: string;
  action: string;
  details: string;
  affectedRecord: string;
}

export const MOCK_EMPLOYEES: Employee[] = [];
