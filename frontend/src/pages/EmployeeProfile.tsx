import { FormEvent, useEffect, useMemo, useState, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArrowLeft,
  Briefcase,
  Calendar,
  Camera,
  ChevronRight,
  CheckCircle2,
  Clock,
  Copy,
  Edit,
  Eye,
  EyeOff,
  Globe,
  Key,
  Info,
  Laptop,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  Undo2,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { SkeletonLoadingMessage } from '@/src/components/SkeletonLoadingMessage';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRealtimeSubscription } from '@/src/hooks/useRealtimeSubscription';
import { applySpecialShortcodes, applyGeneralShortcodes, cn, isUUID } from '@/src/lib/utils';
import { generateLmsAccount } from '@/src/lib/lmsAccount';
import { employeeService } from '@/src/features/employees/services/employeeService';
import { siteService } from '@/src/services/siteService';
import { auditLogService } from '@/src/features/reports/services/auditLogService';
import { accountService } from '@/src/services/accountService';

type SiteOption = {
  id: string;
  name: string;
};

type AccountOption = {
  id: string;
  name: string;
  accountType: 'internal' | 'external';
  departmentCode: string;
};

type EmployeeForm = {
  employeeNumber: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  accountAssignment: string;
  phone: string;
  address: string;
  boEmail: string;
  emailPassword: string;
  lmsAccount: string;
  status: 'active' | 'inactive' | 'separated' | 'floating';
  employeeStatus: 'Regular' | 'Probationary' | 'Fix-Term' | string;
  siteId: string;
  site: string;
  pcName: string;
  biosDate: string;
  deviceType: 'Windows' | 'MacOS' | string;
  windowsKey: string;
  rustdeskId: string;
  esetStatus: 'active' | 'inactive';
  activityWatchStatus: 'installed' | 'missing';
  dateHired: string;
  separationDate: string;
  separationReason: string;
  isArchived?: boolean;
  isReadyForArchive?: boolean;
  avatarUrl?: string;
  position: string;
  nickname: string;
  sex: string;
  civilStatus: string;
  sssNo: string;
  tinNo: string;
  philhealthNo: string;
  pagibigNo: string;
  personalEmail: string;
  mainContact: string;
  emergencyContact: string;
  emergencyContactNumber: string;
  birthdate: string;
  floatDate: string;
  outlookEmail: string;
  mattermostAccount: string;
  teamsAccount: string;
  googleAccount: string;
};

const emptyEmployee: EmployeeForm = {
  employeeNumber: '',
  fullName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  accountAssignment: '',
  phone: '',
  address: '',
  boEmail: '',
  emailPassword: '',
  lmsAccount: '',
  status: 'active',
  employeeStatus: 'Regular',
  siteId: '',
  site: '',
  pcName: '',
  biosDate: '',
  deviceType: 'Windows',
  windowsKey: '',
  rustdeskId: '',
  esetStatus: 'inactive',
  activityWatchStatus: 'missing',
  dateHired: '',
  separationDate: '',
  separationReason: '',
  isArchived: false,
  isReadyForArchive: false,
  avatarUrl: '',
  position: '',
  nickname: '',
  sex: '',
  civilStatus: '',
  sssNo: '',
  tinNo: '',
  philhealthNo: '',
  pagibigNo: '',
  personalEmail: '',
  mainContact: '',
  emergencyContact: '',
  emergencyContactNumber: '',
  birthdate: '',
  floatDate: '',
  outlookEmail: '',
  mattermostAccount: '',
  teamsAccount: '',
  googleAccount: '',
};

const editableFields: Array<keyof EmployeeForm> = [
  'employeeNumber',
  'firstName',
  'middleName',
  'lastName',
  'suffix',
  'accountAssignment',
  'phone',
  'address',
  'boEmail',
  'emailPassword',
  'status',
  'employeeStatus',
  'siteId',
  'lmsAccount',
  'pcName',
  'biosDate',
  'windowsKey',
  'rustdeskId',
  'esetStatus',
  'activityWatchStatus',
  'dateHired',
  'separationDate',
  'separationReason',
  'position',
  'nickname',
  'sex',
  'civilStatus',
  'sssNo',
  'tinNo',
  'philhealthNo',
  'pagibigNo',
  'personalEmail',
  'mainContact',
  'emergencyContact',
  'emergencyContactNumber',
  'birthdate',
  'floatDate',
  'outlookEmail',
  'mattermostAccount',
  'teamsAccount',
  'googleAccount'
];

const suffixOptions = ['Sr.', 'Jr.', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const fieldCharacterLimits: Partial<Record<keyof EmployeeForm, number>> = {};

function normalizeEsetStatus(value?: string): EmployeeForm['esetStatus'] {
  return value === 'Active' || value === 'active' || value === 'installed' ? 'active' : 'inactive';
}

function normalizeActivityWatch(value?: string): EmployeeForm['activityWatchStatus'] {
  return value === 'Installed' || value === 'installed' ? 'installed' : 'missing';
}

function formatStatus(value: string) {
  const normalized = value?.toLowerCase() || '';
  if (normalized === 'active') return 'Active';
  if (normalized === 'floating') return 'Floating';
  return 'Separated';
}

const KNOWN_SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v', 'md', 'm.d.', 'phd', 'ph.d.', 'esq', 'esq.']);

function parseEmployeeName(fullName = '') {
  const name = String(fullName || '').trim();
  if (!name) return { firstName: '', middleName: '', lastName: '', suffix: '' };

  if (name.includes(',')) {
    const [lastName, rest] = name.split(',').map(s => s.trim());
    const restParts = rest.split(/ +/).filter(Boolean);

    if (restParts.length === 1 && KNOWN_SUFFIXES.has(restParts[0].toLowerCase())) {
      const suffix = restParts[0];
      const previousParts = lastName.split(/ +/).filter(Boolean);
      return {
        firstName: (previousParts[0] || '').replace(/\u00A0/g, ' '),
        middleName: previousParts.slice(1, -1).join(' ').replace(/\u00A0/g, ' '),
        lastName: (previousParts[previousParts.length - 1] || '').replace(/\u00A0/g, ' '),
        suffix: suffix
      };
    }

    if (restParts.length === 1) {
      return {
        firstName: restParts[0].replace(/\u00A0/g, ' '),
        middleName: '',
        lastName: lastName.replace(/\u00A0/g, ' '),
        suffix: ''
      };
    }

    let suffix = '';
    const possibleSuffix = restParts[restParts.length - 1];
    if (possibleSuffix && KNOWN_SUFFIXES.has(possibleSuffix.toLowerCase())) {
      suffix = restParts.pop() || '';
    }

    return {
      firstName: restParts.slice(0, -1).join(' ').replace(/\u00A0/g, ' '),
      middleName: (restParts[restParts.length - 1] || '').replace(/\u00A0/g, ' '),
      lastName: lastName.replace(/\u00A0/g, ' '),
      suffix: suffix
    };
  }

  const parts = name.split(/ +/).filter(Boolean);

  let suffix = '';
  const lastPart = parts[parts.length - 1];
  if (lastPart && KNOWN_SUFFIXES.has(lastPart.toLowerCase())) {
    suffix = parts.pop() || '';
  }

  let firstName = '';
  let middleName = '';
  let lastName = '';

  if (parts.length === 1) {
    firstName = parts[0] || '';
  } else if (parts.length === 2) {
    firstName = parts[0] || '';
    lastName = parts[1] || '';
  } else if (parts.length > 2) {
    firstName = parts[0] || '';
    middleName = parts.slice(1, -1).join(' ');
    lastName = parts[parts.length - 1] || '';
  }

  return {
    firstName: firstName.replace(/\u00A0/g, ' '),
    middleName: middleName.replace(/\u00A0/g, ' '),
    lastName: lastName.replace(/\u00A0/g, ' '),
    suffix: suffix,
  };
}

function formatEmployeeName(firstName = '', middleName = '', lastName = '', suffix = '') {
  const first = String(firstName || '').trim().replace(/ /g, '\u00A0');
  const middle = String(middleName || '').trim().replace(/ /g, '\u00A0');
  const last = String(lastName || '').trim().replace(/ /g, '\u00A0');
  const suff = String(suffix || '').trim();
  return [first, middle, last, suff].filter(Boolean).join(' ');
}

function normalizePhoneInput(value = '') {
  const upper = value.toUpperCase();
  if ('N/A'.startsWith(upper)) return upper;
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatRustdeskId(value = '') {
  const upper = value.toUpperCase();
  if ('N/A'.startsWith(upper)) return upper;
  return value
    .replace(/\D/g, '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    .slice(0, 17);
}

function formatWindowsLicenseKey(value = '') {
  const upper = value.toUpperCase();
  if ('N/A'.startsWith(upper)) return upper;
  return value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 25)
    .match(/.{1,5}/g)
    ?.join('-') || '';
}

function isCompleteWindowsLicenseKey(value = '') {
  if (value.toUpperCase() === 'N/A') return true;
  return value.replace(/[^a-zA-Z0-9]/g, '').length === 25;
}

function applyCharacterLimit(field: keyof EmployeeForm, value: string) {
  const limit = fieldCharacterLimits[field];
  return limit ? value.slice(0, limit) : value;
}

function sanitizeNamePart(value = '') {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '');
}

function generatedPreview(fullName = '', account?: AccountOption) {
  const nameParts = parseEmployeeName(fullName);
  const firstRaw = String(nameParts.firstName || '');

  const firstInitials = firstRaw
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => sanitizeNamePart(part).charAt(0))
    .join('');

  const last = sanitizeNamePart(nameParts.lastName || '');
  const code = account?.departmentCode || '';
  const identifier = `${firstInitials}${last}`;
  const domain = account?.accountType === 'internal' ? 'com' : ['hc', 'utd'].includes(code) ? 'team' : 'ph';

  let boEmail = '';
  let pcName = '';

  if (identifier && code) {
    boEmail = code === 'n/a' ? `${identifier}@bigoutsource.${domain}` : `${identifier}.${code}@bigoutsource.${domain}`;
    pcName = code === 'n/a' ? `na-${identifier}` : `${code}-${identifier}`;
  }

  return {
    boEmail,
    pcName,
  };
}

function formatDate(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function actionLabel(action: string) {
  const norm = action.toUpperCase();
  if (norm === 'UPDATE' || norm === 'EMPLOYEE.UPDATE') return 'Updated record';
  if (norm === 'CREATE' || norm === 'EMPLOYEE.CREATE') return 'Created record';
  if (norm === 'DELETE' || norm === 'EMPLOYEE.DELETE') return 'Deleted record';
  if (norm === 'ARCHIVE' || norm === 'EMPLOYEE.ARCHIVE') return 'Archived record';
  if (norm === 'UNARCHIVE' || norm === 'EMPLOYEE.UNARCHIVE') return 'Unarchived record';
  return action.replace(/[._]/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFieldName(field: string) {
  if (field === 'boEmail') return 'Snappy Email';
  if (field === 'pcName') return 'PC Name';
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  
  const strValue = String(value);
  const lowerValue = strValue.toLowerCase();
  
  if (lowerValue === 'true') return 'Yes';
  if (lowerValue === 'false') return 'No';
  
  return strValue;
}

function detailsText(details: any) {
  if (!details) return [];

  if (Array.isArray(details.changes) && details.changes.length) {
    return details.changes.map((change: any) => ({
      field: formatFieldName(change.field),
      from: formatValue(change.from),
      to: formatValue(change.to),
    }));
  }

  return Object.entries(details)
    .filter(([key]) => key !== 'changes')
    .map(([key, value]) => ({
      field: formatFieldName(key),
      value: formatValue(value),
    }));
}

function actorLabel(log: any) {
  return log.userName || 'System';
}

function normalizeEmployee(emp: any): EmployeeForm {
  const fullName = emp?.fullName || '';
  const nameParts = parseEmployeeName(fullName);

  return {
    employeeNumber: emp?.employeeNumber || emp?.employeeId || '',
    fullName: fullName.replace(/\u00A0/g, ' '),
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    suffix: nameParts.suffix,
    accountAssignment: emp?.accountAssignment || '',
    phone: emp?.phone || '',
    address: emp?.address || '',
    boEmail: emp?.boEmail || '',
    emailPassword: emp?.emailPassword || '',
    lmsAccount: (emp?.lmsAccount !== undefined) ? emp.lmsAccount : (generateLmsAccount(formatEmployeeName(nameParts.firstName, nameParts.middleName, nameParts.lastName, '')) || ''),
    status: emp?.status || 'active',
    employeeStatus: emp?.employeeStatus || 'Regular',
    siteId: emp?.siteId === 'HQ' ? 'HQ' : emp?.siteId || '',
    site: emp?.site === 'HQ' ? 'HQ' : emp?.site || '',
    pcName: emp?.pcName || '',
    biosDate: emp?.biosDate ? String(emp.biosDate).slice(0, 10) : '',
    deviceType: emp?.deviceType || 'Windows',
    windowsKey: formatWindowsLicenseKey(emp?.windowsKey || ''),
    rustdeskId: formatRustdeskId(emp?.rustdeskId || emp?.rustDeskId || ''),
    esetStatus: normalizeEsetStatus(emp?.esetStatus || emp?.eset),
    activityWatchStatus: normalizeActivityWatch(emp?.activityWatchStatus),
    dateHired: emp?.dateHired || emp?.date_hired || '',
    separationDate: emp?.separationDate || emp?.separation_date || '',
    separationReason: emp?.separationReason || emp?.separation_reason || '',
    isArchived: emp?.is_archived ?? emp?.isArchived ?? false,
    isReadyForArchive: emp?.is_ready_for_archive ?? emp?.isReadyForArchive ?? false,
    avatarUrl: emp?.avatarUrl || emp?.avatar_url || '',
    position: emp?.position || '',
    nickname: emp?.nickname || '',
    sex: emp?.sex || '',
    civilStatus: emp?.civilStatus || emp?.civil_status || '',
    sssNo: emp?.sssNo || emp?.sss_no || '',
    tinNo: emp?.tinNo || emp?.tin_no || '',
    philhealthNo: emp?.philhealthNo || emp?.philhealth_no || '',
    pagibigNo: emp?.pagibigNo || emp?.pagibig_no || '',
    personalEmail: emp?.personalEmail || emp?.personal_email || '',
    mainContact: emp?.mainContact || emp?.main_contact || '',
    emergencyContact: emp?.emergencyContact || emp?.emergency_contact || '',
    emergencyContactNumber: emp?.emergencyContactNumber || emp?.emergency_contact_number || '',
    birthdate: emp?.birthdate || '',
    floatDate: emp?.floatDate || '',
    outlookEmail: emp?.outlookEmail || '',
    mattermostAccount: emp?.mattermostAccount || '',
    teamsAccount: emp?.teamsAccount || '',
    googleAccount: emp?.googleAccount || '',
  };
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, can } = useAuth();
  const [employee, setEmployee] = useState<EmployeeForm>(emptyEmployee);
  const [form, setForm] = useState<EmployeeForm>(emptyEmployee);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployeeForm, string>>>({});
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveIntent, setArchiveIntent] = useState<'archive' | 'unarchive' | null>(null);
  const [archiveStatusReason, setArchiveStatusReason] = useState<'separated' | 'floating'>('separated');
  const [archiveSeparationReason, setArchiveSeparationReason] = useState<string>('Voluntary Separation (Resignation)');
  const [archiveSeparationReasonOther, setArchiveSeparationReasonOther] = useState<string>('');
  const [archiveSeparationDate, setArchiveSeparationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [archiveStep, setArchiveStep] = useState<1 | 2>(1);
  const [hrCheckboxes, setHrCheckboxes] = useState({ jobTitle: false, accountAssignment: false, site: false });
  const [itCheckboxes, setItCheckboxes] = useState<Record<string, boolean>>({});
  const [unarchiveJobTitle, setUnarchiveJobTitle] = useState('');
  const [unarchiveAccountAssignment, setUnarchiveAccountAssignment] = useState('');
  const [unarchiveSiteId, setUnarchiveSiteId] = useState('');
  const [unarchiveEmployeeStatus, setUnarchiveEmployeeStatus] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false);
  const [isEmployeeStatusDropdownOpen, setIsEmployeeStatusDropdownOpen] = useState(false);
  const [isEsetDropdownOpen, setIsEsetDropdownOpen] = useState(false);
  const [isActivityWatchDropdownOpen, setIsActivityWatchDropdownOpen] = useState(false);
  const [visibleLogsCount, setVisibleLogsCount] = useState(3);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useRealtimeSubscription({ table: 'employees', onChange: () => setRefreshTrigger(prev => prev + 1) });
  useRealtimeSubscription({ table: 'audit_logs', onChange: () => setRefreshTrigger(prev => prev + 1) });

  const [undoTargetLog, setUndoTargetLog] = useState<any | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isBoEmailEdited, setIsBoEmailEdited] = useState(false);
  const [isLmsAccountEdited, setIsLmsAccountEdited] = useState(false);
  const [isPcNameEdited, setIsPcNameEdited] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'employment' | 'accounts' | 'audit'>('personal');

  const generatedPreviewWithLms = (f: EmployeeForm, account?: AccountOption) => {
    const nameForLms = formatEmployeeName(f.firstName, f.lastName, '', '');
    const suggestions = generatedPreview(formatEmployeeName(f.firstName, f.middleName, f.lastName, f.suffix), account);
    return {
      boEmail: suggestions.boEmail,
      pcName: suggestions.pcName,
      lmsAccount: generateLmsAccount(nameForLms) || '',
    };
  };

  const regenerateField = (field: 'boEmail' | 'lmsAccount' | 'pcName') => {
    const account = accounts.find((acc) => acc.name === form.accountAssignment);
    const suggestions = generatedPreviewWithLms(form, account);

    if (field === 'boEmail') {
      setIsBoEmailEdited(false);
      setForm((current) => ({ ...current, boEmail: suggestions.boEmail }));
    } else if (field === 'lmsAccount') {
      setIsLmsAccountEdited(false);
      setForm((current) => ({ ...current, lmsAccount: suggestions.lmsAccount }));
    } else if (field === 'pcName') {
      setIsPcNameEdited(false);
      setForm((current) => ({ ...current, pcName: suggestions.pcName }));
    }
  };
  const canViewHR = true;
  const canViewIT = can('employees.it.view');
  const canViewSecrets = can('employees.secrets.view');
  const canEditHR = can('employees.edit');
  const canEditIT = can('employees.it.edit');
  const canEditSecrets = can('employees.secrets.edit');
  const reqITFields = useMemo(() => ['admin', 'it'].includes(user?.role?.toLowerCase() || ''), [user]);
  const isSuperAdmin = ['super admin', 'superadmin', 'super_admin'].includes(user?.role?.toLowerCase() || '');
  const canArchivePermission = can('employees.delete');
  const canUnarchivePermission = can('employees.unarchive');
  const canArchiveEmployee = isSuperAdmin || canArchivePermission || canUnarchivePermission || canEditHR || canEditIT;
  
  const hasActiveITAccounts = useMemo(() => {
    return [
      employee.outlookEmail,
      employee.googleAccount,
      employee.teamsAccount,
      employee.mattermostAccount,
      employee.boEmail,
      employee.lmsAccount,
      employee.windowsKey,
      employee.rustdeskId,
      employee.pcName
    ].some(val => val && !/^(N\/A|\[N\/A\])$/i.test(val.trim()));
  }, [employee]);

  const activeITAccountKeys = useMemo(() => {
    const keys: {key: string, label: string}[] = [];
    const isActive = (val?: string | null) => val && !/^(N\/A|\[N\/A\])$/i.test(val.trim());
    
    if (isActive(employee.outlookEmail)) keys.push({key: 'outlookEmail', label: 'Outlook Email'});
    if (isActive(employee.googleAccount)) keys.push({key: 'googleAccount', label: 'Google Account'});
    if (isActive(employee.teamsAccount)) keys.push({key: 'teamsAccount', label: 'Teams Account'});
    if (isActive(employee.mattermostAccount)) keys.push({key: 'mattermostAccount', label: 'Mattermost Account'});
    if (isActive(employee.boEmail)) keys.push({key: 'boEmail', label: 'Snappy Email'});
    if (isActive(employee.lmsAccount)) keys.push({key: 'lmsAccount', label: 'LMS Account'});
    if (isActive(employee.windowsKey)) keys.push({key: 'windowsKey', label: 'Windows Key'});
    if (isActive(employee.rustdeskId)) keys.push({key: 'rustdeskId', label: 'Remote ID'});
    if (isActive(employee.pcName)) keys.push({key: 'pcName', label: 'PC Name'});
    return keys;
  }, [employee]);
  const canManageEmployee = canEditHR || canEditIT || canEditSecrets;
  const canUseEmployeeActions = canManageEmployee || canArchiveEmployee;
  const editingHR = isEditing && canEditHR;
  const editingIT = isEditing && canEditIT;
  const editingSecrets = isEditing && canEditSecrets;

  const missingDataStatus = useMemo(() => {
    let criticalCount = 0;
    let mildCount = 0;
    if (!employee.employeeNumber) criticalCount++;
    if (!employee.accountAssignment) criticalCount++;
    if (!employee.siteId && !employee.site) criticalCount++;
    if (!employee.firstName) criticalCount++;
    if (!employee.lastName) criticalCount++;

    if (!employee.phone) mildCount++;
    if (!employee.address) mildCount++;
    if (!employee.pcName) mildCount++;
    if (!employee.biosDate) mildCount++;
    if (!employee.rustdeskId) mildCount++;
    if (!employee.windowsKey) mildCount++;
    if (!employee.boEmail) mildCount++;
    if (!employee.emailPassword) mildCount++;
    if (!employee.lmsAccount) mildCount++;
    if (employee.activityWatchStatus !== 'installed') mildCount++;
    if (employee.esetStatus !== 'active') mildCount++;

    const total = criticalCount + mildCount;
    if (total === 0) return null;

    if (criticalCount > 0) {
      return { type: 'critical', text: `${total} incomplete data` };
    }
    return { type: 'warning', text: `${total} incomplete data` };
  }, [employee]);

  const hasChanges = useMemo(
    () => editableFields.some((field) => String(form[field] || '') !== String(employee[field] || '')),
    [form, employee]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!id) return;
      setIsLoading(true);

      try {
        const [employeeData, siteData, auditData] = await Promise.all([
          employeeService.get(id),
          siteService.list().catch(() => []),
          auditLogService.list({ entityType: 'employees', entityId: id, limit: 50 }).catch(() => []),
        ]);
        const accountData = await accountService.list().catch(() => []);

        if (!isMounted) return;

        const normalized = normalizeEmployee(employeeData);
        setEmployee(normalized);
        setForm(normalized);
        setSites((Array.isArray(siteData) ? siteData : []).map((site: any) => ({ id: site.id, name: site.name })));
        setAccounts((Array.isArray(accountData) ? accountData : []).map((account: any) => ({
          id: account.id,
          name: account.name,
          accountType: account.accountType || account.account_type || 'external',
          departmentCode: account.departmentCode || account.department_code || '',
        })));
        setAuditLogs(Array.isArray(auditData) ? auditData : []);
      } catch (error: any) {
        toast.error(error.message || 'Unable to load employee profile');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [id, refreshTrigger]);

  const handleUndo = (log: any) => {
    if (!log.action.endsWith('.update')) {
      toast.error('Only update actions can be undone.');
      return;
    }
    setUndoTargetLog(log);
  };

  const confirmUndo = async () => {
    if (!undoTargetLog) return;
    setIsUndoing(true);
    const loadingToast = toast.loading('Undoing action...');
    try {
      await auditLogService.undo(undoTargetLog.id);
      toast.success('Action successfully undone.', { id: loadingToast });
      setRefreshTrigger((prev) => prev + 1);
      setUndoTargetLog(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to undo action', { id: loadingToast });
    } finally {
      setIsUndoing(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';

    setIsUploadingAvatar(true);
    const loadingToast = toast.loading('Uploading avatar...');
    try {
      const updated = await employeeService.uploadAvatar(id, file);
      const normalized = normalizeEmployee(updated);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEmployee(normalized);
      setForm(normalized);
      toast.success('Avatar uploaded successfully', { id: loadingToast });
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar', { id: loadingToast });
    } finally {
      setIsUploadingAvatar(false);
    }
  };



  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const updateForm = (field: keyof EmployeeForm, value: any) => {
    if (typeof value === 'string') {
      value = applyGeneralShortcodes(value);
    }
    
    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      if (typeof value === 'string') {
        value = applySpecialShortcodes(value);
      }
      if (/[^\p{L}\-'\s\[\]`]/u.test(value)) {
        return;
      }
    } else if (field === 'phone') {
      value = normalizePhoneInput(value);
    } else if (field === 'rustdeskId') {
      value = formatRustdeskId(value);
    } else if (field === 'windowsKey') {
      value = formatWindowsLicenseKey(value);
    } else if (typeof value === 'string') {
      value = applyCharacterLimit(field, value);
    }

    if (field === 'boEmail') {
      setIsBoEmailEdited(true);
    } else if (field === 'lmsAccount') {
      setIsLmsAccountEdited(true);
    } else if (field === 'pcName') {
      setIsPcNameEdited(true);
    }

    setForm((current) => {
      const nextForm = { ...current, [field]: value };
      
      const account = accounts.find((acc) => acc.name === nextForm.accountAssignment);
      const suggestions = generatedPreviewWithLms(nextForm, account);

      if (field === 'firstName' || field === 'lastName' || field === 'accountAssignment') {
        if (!isBoEmailEdited) {
          nextForm.boEmail = suggestions.boEmail;
        }
        if (!isLmsAccountEdited) {
          nextForm.lmsAccount = suggestions.lmsAccount;
        }
        if (!isPcNameEdited) {
          nextForm.pcName = suggestions.pcName;
        }
      }

      return nextForm;
    });

    setFormErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _removed, ...nextErrors } = current;
      return nextErrors;
    });
  };

  const handleReveal = () => {
    if (user?.role === 'viewer') {
      toast.error('Unauthorized to view sensitive info');
      return;
    }
    setShowSensitive(!showSensitive);
  };

  const startEditing = () => {
    if (!canManageEmployee) return;
    setForm(employee);
    
    const account = accounts.find((acc) => acc.name === employee.accountAssignment);
    const suggestions = generatedPreviewWithLms(employee, account);
    
    setIsBoEmailEdited(Boolean(employee.boEmail && employee.boEmail !== suggestions.boEmail));
    setIsLmsAccountEdited(Boolean(employee.lmsAccount && employee.lmsAccount !== suggestions.lmsAccount));
    setIsPcNameEdited(Boolean(employee.pcName && employee.pcName !== suggestions.pcName));
    
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(employee);
    setIsEditing(false);
    setFormErrors({});
  };

  const renderEditButton = (canEditSection: boolean) => {
    if (!canEditSection) return undefined;
    return (
      <button
        type="button"
        onClick={isEditing ? cancelEditing : startEditing}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm",
          isEditing
            ? "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
            : "bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB] hover:border-[#D1D5DB]"
        )}
      >
        {isEditing ? <X className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
        {isEditing ? "Exit Edit Mode" : "Edit Details"}
      </button>
    );
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();

    if (!canManageEmployee) return;

    if (!id) return;

    if (!hasChanges) return;

    const missingCore = !form.firstName.trim() || !form.lastName.trim();
    const missingHR = canEditHR && (!form.employeeNumber.trim() || !form.accountAssignment.trim() || !form.siteId);
    if (missingCore || missingHR) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (/[[\]`]/u.test(form.firstName) || /[[\]`]/u.test(form.lastName) || (form.middleName && /[[\]`]/u.test(form.middleName))) {
      toast.error('Name contains incomplete shortcodes');
      return;
    }

    if (form.phone && form.phone.trim().toUpperCase() !== 'N/A' && form.phone.length !== 11) {
      setFormErrors((current) => ({ ...current, phone: 'Phone number must be exactly 11 digits.' }));
      toast.error('Please resolve the highlighted fields before saving');
      return;
    }

    if (form.windowsKey && !isCompleteWindowsLicenseKey(form.windowsKey)) {
      setFormErrors((current) => ({ ...current, windowsKey: 'Windows license key must be 25 characters in 5 groups of 5.' }));
      toast.error('Please resolve the highlighted fields before saving');
      return;
    }

    const selectedSite = sites.find((site) => site.id === form.siteId);
    const fullName = formatEmployeeName(form.firstName, form.middleName, form.lastName, form.suffix);
    setIsSaving(true);

    try {
      const updated = await employeeService.update(id, {
        employeeNumber: form.employeeNumber.trim(),
        fullName,
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        suffix: form.suffix?.trim() || '',
        accountAssignment: form.accountAssignment.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        boEmail: form.boEmail.trim(),
        lmsAccount: form.lmsAccount.trim(),
        pcName: form.pcName.trim(),
        emailPassword: form.emailPassword.trim(),
        status: form.status,
        employeeStatus: form.employeeStatus,
        siteId: selectedSite?.id,
        siteName: selectedSite?.name,
        biosDate: form.biosDate || '',
        deviceType: form.deviceType,
        windowsKey: form.windowsKey.trim(),
        rustdeskId: form.rustdeskId.trim(),
        esetStatus: form.esetStatus,
        activityWatchStatus: form.activityWatchStatus,
        dateHired: form.dateHired,
        separationDate: form.separationDate,
        separationReason: form.separationReason,
        position: form.position.trim(),
        nickname: form.nickname.trim(),
        sex: form.sex,
        civilStatus: form.civilStatus,
        sssNo: form.sssNo.trim(),
        tinNo: form.tinNo.trim(),
        philhealthNo: form.philhealthNo.trim(),
        pagibigNo: form.pagibigNo.trim(),
        personalEmail: form.personalEmail.trim(),
        mainContact: form.mainContact.trim(),
        emergencyContact: form.emergencyContact.trim(),
        emergencyContactNumber: form.emergencyContactNumber.trim(),
        birthdate: form.birthdate,
        floatDate: form.floatDate,
        outlookEmail: form.outlookEmail.trim(),
        googleAccount: form.googleAccount.trim(),
        teamsAccount: form.teamsAccount.trim(),
        mattermostAccount: form.mattermostAccount.trim()
      });

      const normalized = normalizeEmployee(updated);
      const refreshedLogs = await auditLogService.list({ entityType: 'employees', entityId: id, limit: 50 }).catch(() => auditLogs);
      
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      setEmployee(normalized);
      setForm(normalized);
      setAuditLogs(Array.isArray(refreshedLogs) ? refreshedLogs : []);
      setIsEditing(false);
      toast.success('Employee record updated');
      
      const newId = form.employeeNumber.trim();
      if (id && newId && id !== newId) {
        navigate(`/employee/${newId}`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to update employee record');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleArchiveEmployee = async () => {
    if (!canArchiveEmployee) return;
    if (!id) return;

    if (archiveIntent === 'archive') {
      if (!employee.isReadyForArchive) {
        if (activeITAccountKeys.some(acc => !itCheckboxes[acc.key])) {
          toast.error("all fields must be cleared");
          return;
        }
      } else {
        if (archiveStep === 2) {
          if (!hrCheckboxes.jobTitle || !hrCheckboxes.accountAssignment || !hrCheckboxes.site) {
            toast.error("all fields must be cleared");
            return;
          }
        }
      }
    }

    setIsArchiving(true);

    try {
      let updateData: any = {};
      
      if (archiveIntent === 'archive') {
        if (!employee.isReadyForArchive) {
          // IT Admin is initiating the archive request
          updateData = {
            is_ready_for_archive: true,
          };
          
          if (itCheckboxes.boEmail) { updateData.boEmail = ''; updateData.emailPassword = ''; }
          if (itCheckboxes.lmsAccount) updateData.lmsAccount = '';
          if (itCheckboxes.pcName) updateData.pcName = '';
          if (itCheckboxes.outlookEmail) updateData.outlookEmail = '';
          if (itCheckboxes.teamsAccount) updateData.teamsAccount = '';
          if (itCheckboxes.mattermostAccount) updateData.mattermostAccount = '';
          if (itCheckboxes.googleAccount) updateData.googleAccount = '';
          if (itCheckboxes.windowsKey) updateData.windowsKey = '';
          if (itCheckboxes.rustdeskId) updateData.rustdeskId = '';
          
        } else {
          // HR is finalizing the archive
          const isFloating = archiveStatusReason === 'floating';
          const isSeparated = archiveStatusReason === 'separated';
          const separationReason = archiveSeparationReason === 'Other' ? archiveSeparationReasonOther : archiveSeparationReason;
          const sepDate = isSeparated && archiveSeparationDate ? new Date(archiveSeparationDate).toISOString() : null;
          const flDate = isFloating && archiveSeparationDate ? new Date(archiveSeparationDate).toISOString() : null;
          
          updateData = {
            status: archiveStatusReason,
            separation_reason: separationReason,
            separation_date: sepDate,
            floatDate: flDate,
            jobTitle: '',
            accountAssignment: '',
            siteId: null,
            siteName: '',
            is_archived: true,
            is_ready_for_archive: false,
          };
        }
      } else {
        // Unarchive
        updateData = {
          is_archived: false,
          is_ready_for_archive: false,
          status: 'active',
          employeeStatus: unarchiveEmployeeStatus || 'Regular',
          separation_reason: null,
          separation_date: null,
          floatDate: null,
          jobTitle: unarchiveJobTitle.trim(),
          accountAssignment: unarchiveAccountAssignment.trim(),
          siteId: unarchiveSiteId,
          siteName: sites.find(s => s.id === unarchiveSiteId)?.name || '',
        };
      }
      
      const updated = await employeeService.update(id, updateData);

      const normalized = normalizeEmployee(updated);

      const refreshedLogs = await auditLogService.list({ entityType: 'employees', entityId: id, limit: 50 }).catch(() => auditLogs);

      setEmployee(normalized);
      setForm(normalized);
      setAuditLogs(Array.isArray(refreshedLogs) ? refreshedLogs : []);

      toast.success(archiveIntent === 'unarchive' ? 'Employee unarchived' : !employee.isReadyForArchive ? 'Employee marked ready for HR Archive' : 'Employee finalized and archived');

      setShowArchiveModal(false);
      setArchiveIntent(null);
      setArchiveStep(1);
      setHrCheckboxes({ jobTitle: false, accountAssignment: false, site: false });
      setItCheckboxes({});
      setUnarchiveJobTitle('');
      setUnarchiveAccountAssignment('');
      setUnarchiveSiteId('');
    } catch (error: any) {
      console.error('Archive error:', error);
      toast.error(error.message || 'Unable to update archive status');
    } finally {
      setIsArchiving(false);
    }
  };

  const pageTitle = employee.fullName ? `Profile: ${employee.fullName}` : 'Employee Profile';
  const selectedAccount = accounts.find((account) => account.name === form.accountAssignment);
  const preview = generatedPreview(formatEmployeeName(form.firstName, form.middleName, form.lastName, ''), selectedAccount);
  const accountBasedPreviewPlaceholder = selectedAccount
    ? 'Generated after name is entered'
    : 'Generated after name and department are entered';
  const internalAccounts = accounts.filter((account) => account.accountType === 'internal');
  const externalAccounts = accounts.filter((account) => account.accountType === 'external');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 30 } }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await employeeService.remove(id);
      toast.success('Employee permanently deleted');
      navigate('/directory', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Unable to delete employee');
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout title={pageTitle} backFallback="/directory">
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div key="skeleton-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="flex flex-col gap-8 pb-12 w-full relative">
            <div className="relative bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm animate-pulse">
              <div className="h-24 bg-gray-200"></div>
              <div className="px-8 py-7 flex flex-col md:flex-row md:items-end gap-6">
                <div className="flex-1 min-w-0">
                  <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 animate-pulse">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-gray-200" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-8">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-9 h-9 rounded-xl bg-gray-200" />
                    <div className="h-6 w-32 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-6">
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                    <div className="h-12 w-full bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
            <SkeletonLoadingMessage message="Fetching personnel records..." />
          </motion.div>
        ) : (
          <motion.form key="content-profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }} onSubmit={saveProfile} className="flex flex-col gap-8 pb-12 w-full">
            <div className="relative bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="h-32 bg-gradient-to-br from-[#111827] via-[#1F2937] to-[#111827] relative">
                {(isSuperAdmin && (employee.isArchived || employee.status?.toLowerCase() === 'separated')) && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-xl bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 z-10"
                    title="Delete Employee Permanently"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="px-8 pb-8 pt-4 flex flex-col md:flex-row md:items-end gap-6 relative">
                <div className="absolute -top-16 left-8">
                  <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] shadow-lg flex items-center justify-center text-4xl font-black text-[#111827] uppercase tracking-tighter relative group overflow-hidden">
                    {employee.avatarUrl ? (
                      <img 
                        src={`${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '')}${employee.avatarUrl}`} 
                        alt={employee.fullName} 
                        className="w-full h-full object-cover" 
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      employee.fullName?.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('') || 'EP'
                    )}
                    {canManageEmployee && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-0 left-0 right-0 bg-black/50 py-1.5 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 cursor-pointer"
                        title="Upload Profile Picture"
                      >
                        {isUploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 mt-14 md:mt-0 md:ml-32">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {editingHR ? (
                      <motion.div
                        key="edit-mode"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-5">
                          <div className="w-full md:w-1/3">
                            <Field label="Employee ID" required isFilled={Boolean(form.employeeNumber)} error={formErrors.employeeNumber}>
                              <Input value={form.employeeNumber} onChange={(value) => updateForm('employeeNumber', value)} placeholder="e.g. 1004" error={Boolean(formErrors.employeeNumber)} />
                            </Field>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                            <div className="sm:col-span-4">
                              <Field label="First Name" required isFilled={Boolean(form.firstName)} error={formErrors.firstName}>
                                <Input value={form.firstName} onChange={(value) => updateForm('firstName', value)} placeholder="e.g. John" error={Boolean(formErrors.firstName)} />
                              </Field>
                            </div>
                            <div className="sm:col-span-3">
                              <Field label="Middle Name" error={formErrors.middleName}>
                                <Input value={form.middleName} onChange={(value) => updateForm('middleName', value)} placeholder="e.g. Patrick" error={Boolean(formErrors.middleName)} />
                              </Field>
                            </div>
                            <div className="sm:col-span-3">
                              <Field label="Last Name" required isFilled={Boolean(form.lastName)} error={formErrors.lastName}>
                                <Input value={form.lastName} onChange={(value) => updateForm('lastName', value)} placeholder="e.g. Doe" error={Boolean(formErrors.lastName)} />
                              </Field>
                            </div>
                            <div className="sm:col-span-2">
                              <Field label="Suffix">
                                <Select value={form.suffix || ''} onChange={(value) => updateForm('suffix', value)}>
                                  <option value="">None</option>
                                  {suffixOptions.map((suffix) => (
                                    <option key={suffix} value={suffix}>{suffix}</option>
                                  ))}
                                </Select>
                              </Field>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view-mode"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-3xl font-black text-[#111827] tracking-tight">
                            {employee.fullName || 'Unnamed Employee'}
                          </h2>

                          {employee.isArchived && (
                            <span className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black uppercase tracking-wider border border-red-200 shadow-sm">
                              Archived
                            </span>
                          )}

                          {missingDataStatus && (
                            <div className={cn(
                              'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm',
                              missingDataStatus.type === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}>
                              <ShieldAlert className="w-3.5 h-3.5" />
                              {missingDataStatus.text}
                            </div>
                          )}
                        </div>

                        <p className="text-[#6B7280] font-bold mt-1 uppercase text-xs tracking-widest">
                          {isUUID(employee.employeeNumber) ? <span className="text-[0.625rem] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending HR</span> : (employee.employeeNumber || <span className="text-red-500 font-black">No ID</span>)} | {employee.site || <span className="text-red-500 font-black">Unassigned</span>}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex gap-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {isEditing ? (
                      <motion.div
                        key="edit-actions"
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="flex gap-3"
                      >
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="flex items-center gap-2 px-5 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] transition-all"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving || !hasChanges}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#374151] disabled:bg-[#D1D5DB] disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-lg shadow-[#11182720]"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save Changes
                        </button>
                      </motion.div>
                    ) : canUseEmployeeActions ? (
                      <motion.div
                        key="view-actions"
                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        className="flex gap-3"
                      >
                        {canManageEmployee && (
                          <button
                            type="button"
                            onClick={startEditing}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#374151] transition-all shadow-lg shadow-[#11182720]"
                          >
                            <Edit className="w-4 h-4" />
                            Update Record
                          </button>
                        )}

                        {(() => {
                          let buttonText = 'Archive Request';
                          let buttonColor = 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20';
                          let isDisabled = false;
                          let icon = <Archive className="w-4 h-4" />;
                          
                          if (employee.isArchived) {
                            buttonText = 'Unarchive';
                            buttonColor = 'bg-green-600 text-white hover:bg-green-700 shadow-green-500/20';
                            isDisabled = !isSuperAdmin && !canUnarchivePermission;
                            icon = <RotateCcw className="w-4 h-4" />;
                          } else if (!employee.isReadyForArchive) {
                            buttonText = 'Archive Request';
                            buttonColor = 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20';
                            isDisabled = !isSuperAdmin && !canEditIT;
                          } else {
                            buttonText = 'Finalize Archive';
                            buttonColor = 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/20';
                            isDisabled = !isSuperAdmin && (!canArchivePermission || !canEditHR);
                          }

                          if (!canArchiveEmployee || (isDisabled && !isSuperAdmin)) return null;

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setArchiveIntent(employee.isArchived ? 'unarchive' : 'archive');
                                
                                if (employee.isArchived) {
                                  setArchiveStep(1);
                                  setUnarchiveJobTitle(employee.position || '');
                                  setUnarchiveAccountAssignment(employee.accountAssignment || '');
                                  setUnarchiveSiteId(employee.siteId || '');
                                  setUnarchiveEmployeeStatus(employee.employeeStatus || 'Regular');
                                } else if (!employee.isReadyForArchive) {
                                  setArchiveStep(2);
                                } else {
                                  setArchiveStep(1);
                                  setArchiveStatusReason((form.status === 'floating' || employee.status === 'floating') ? 'floating' : 'separated');
                                  
                                  const predefinedReasons = ['Resigned', 'AWOL', 'Terminated'];
                                  const currentReason = form.separationReason || employee.separationReason;
                                  const initialStatus = (form.status === 'floating' || employee.status === 'floating') ? 'floating' : 'separated';
                                  
                                  if (initialStatus === 'separated') {
                                    if (currentReason && predefinedReasons.includes(currentReason)) {
                                      setArchiveSeparationReason(currentReason);
                                    } else {
                                      setArchiveSeparationReason('Resigned');
                                    }
                                    setArchiveSeparationReasonOther('');
                                  } else {
                                    setArchiveSeparationReason(currentReason || '');
                                    setArchiveSeparationReasonOther('');
                                  }

                                  const currentDate = form.separationDate || employee.separationDate;
                                  if (currentDate) {
                                    setArchiveSeparationDate(currentDate.split('T')[0]);
                                  } else {
                                    setArchiveSeparationDate('');
                                  }
                                }
                                
                                setShowArchiveModal(true);
                              }}
                              disabled={isDisabled}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
                            >
                              {icon}
                              {buttonText}
                            </button>
                          );
                        })()}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* 2. Top Horizontal Pill Navigation Bar (with Edit Details in the red box on the right!) */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 shadow-sm flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all duration-200 relative group",
                    activeTab === 'personal'
                      ? "bg-[#111827] text-white shadow-md shadow-[#11182715]"
                      : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0 transition-colors",
                    activeTab === 'personal' ? "bg-white/10 text-white" : "bg-[#F3F4F6] text-[#4B5563] group-hover:bg-[#E5E7EB] group-hover:text-[#111827]"
                  )}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>Personal Details</span>
                </button>

                {canViewHR && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('employment')}
                    className={cn(
                      "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all duration-200 relative group",
                      activeTab === 'employment'
                        ? "bg-[#111827] text-white shadow-md shadow-[#11182715]"
                        : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      activeTab === 'employment' ? "bg-white/10 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                    )}>
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <span>Employment & HR</span>
                  </button>
                )}

                {canViewIT && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('accounts')}
                    className={cn(
                      "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all duration-200 relative group",
                      activeTab === 'accounts'
                        ? "bg-[#111827] text-white shadow-md shadow-[#11182715]"
                        : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      activeTab === 'accounts' ? "bg-white/10 text-white" : "bg-purple-50 text-purple-600 group-hover:bg-purple-100"
                    )}>
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <span>Accounts & IT Security</span>
                  </button>
                )}

                {can('auditlogs.view') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className={cn(
                      "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black transition-all duration-200 relative group",
                      activeTab === 'audit'
                        ? "bg-[#111827] text-white shadow-md shadow-[#11182715]"
                        : "text-[#4B5563] hover:bg-[#F9FAFB] hover:text-[#111827]"
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      activeTab === 'audit' ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                    )}>
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <span>Audit History</span>
                  </button>
                )}
              </div>

              {/* Action Button in the Red Box (Top Right of Navigation Bar) */}
              <div className="flex items-center gap-2 ml-auto pr-2">
                {activeTab === 'personal' && renderEditButton(canEditHR)}
                {activeTab === 'employment' && renderEditButton(canEditHR)}
                {activeTab === 'accounts' && renderEditButton(canEditIT || canEditSecrets)}
              </div>
            </div>

            {/* 3. Full-Width Active Section Workspace */}
            <div className="w-full min-w-0">
                <AnimatePresence mode="wait">
                  {/* PANE 1: PERSONAL DETAILS */}
                  {activeTab === 'personal' && (
                    <motion.div
                      key="pane-personal"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
                    >
                      {/* COLUMN 1: LEFT */}
                      <div className="flex flex-col h-full">
                        <ProfileSection icon={User} title="Personal Info" className="h-full flex flex-col justify-start">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
                            <ProfileField label="Nickname" icon={User} editing={editingHR}>
                              {editingHR ? <Input value={form.nickname} onChange={(v) => updateForm('nickname', v)} placeholder="Nickname" /> : employee.nickname || '-'}
                            </ProfileField>
                            <ProfileField label="Sex" icon={User} editing={editingHR}>
                              {editingHR ? <Input value={form.sex} onChange={(v) => updateForm('sex', v)} placeholder="Male / Female" /> : employee.sex || '-'}
                            </ProfileField>
                            <ProfileField label="Civil Status" icon={User} editing={editingHR}>
                              {editingHR ? (
                                <Select value={form.civilStatus} onChange={(v) => updateForm('civilStatus', v)}>
                                  <option value="">Select status</option>
                                  <option value="Single">Single</option>
                                  <option value="Married">Married</option>
                                  <option value="Widowed">Widowed</option>
                                  <option value="Separated">Separated</option>
                                  <option value="Divorced">Divorced</option>
                                </Select>
                              ) : employee.civilStatus || <span className="text-[#9CA3AF]">Not Set</span>}
                            </ProfileField>
                            <ProfileField label="Birthdate" icon={Calendar} editing={editingHR}>
                              {editingHR ? (
                                <Input type="date" value={form.birthdate} onChange={(v) => updateForm('birthdate', v)} />
                              ) : employee.birthdate ? new Date(employee.birthdate).toLocaleDateString() : <span className="text-[#9CA3AF]">Not Set</span>}
                            </ProfileField>
                          </div>
                        </ProfileSection>
                      </div>

                      {/* COLUMN 2: RIGHT */}
                      <div className="space-y-8 flex flex-col justify-between">
                        <ProfileSection icon={Phone} title="Contact & Location">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <ProfileField label="Main Contact" icon={Phone} editing={editingHR}>
                              {editingHR ? <Input value={form.mainContact} onChange={(v) => updateForm('mainContact', v)} placeholder="e.g. 0917-123-4567" /> : employee.mainContact || <span className="text-red-500 font-black">Not Assigned</span>}
                            </ProfileField>
                            <ProfileField label="Personal Email" icon={Mail} editing={editingHR}>
                              {editingHR ? <Input value={form.personalEmail} onChange={(v) => updateForm('personalEmail', v)} placeholder="e.g. john@gmail.com" /> : employee.personalEmail || <span className="text-red-500 font-black">Not Assigned</span>}
                            </ProfileField>
                            <div className="sm:col-span-2">
                              <ProfileField label="Address" icon={MapPin} editing={editingHR}>
                                {editingHR ? <Input value={form.address} onChange={(v) => updateForm('address', v)} placeholder="e.g. 123 Main St, City" /> : employee.address || <span className="text-red-500 font-black">Not Assigned</span>}
                              </ProfileField>
                            </div>
                          </div>
                        </ProfileSection>

                        <ProfileSection icon={ShieldAlert} title="Emergency Contact">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <ProfileField label="Contact Person Name" icon={User} editing={editingHR}>
                              {editingHR ? <Input value={form.emergencyContact} onChange={(v) => updateForm('emergencyContact', v)} placeholder="Full Name" /> : employee.emergencyContact || <span className="text-red-500 font-black">Not Assigned</span>}
                            </ProfileField>
                            <ProfileField label="Contact Phone Number" icon={Phone} editing={editingHR}>
                              {editingHR ? <Input value={form.emergencyContactNumber} onChange={(v) => updateForm('emergencyContactNumber', v)} placeholder="+63 900 000 0000" /> : employee.emergencyContactNumber || <span className="text-red-500 font-black">Not Assigned</span>}
                            </ProfileField>
                          </div>
                        </ProfileSection>
                      </div>
                    </motion.div>
                  )}

                  {/* PANE 2: EMPLOYMENT & HR */}
                  {activeTab === 'employment' && canViewHR && (
                    <motion.div
                      key="pane-employment"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      className="space-y-8"
                    >
                      <ProfileSection icon={Briefcase} title="EMPLOYEE INFORMATION" iconColorClass="text-blue-600 bg-blue-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="Position" icon={Briefcase} editing={editingHR}>
                            {editingHR ? <Input value={form.position} onChange={(v) => updateForm('position', v)} placeholder="e.g. Customer Service Rep" /> : employee.position || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>
                          
                          <ProfileField label="DEPARTMENT/CAMPAIGN." icon={Briefcase} editing={editingHR}>
                            {editingHR ? (
                              <div className="relative">
                                <Input
                                  value={form.accountAssignment}
                                  onChange={(v) => {
                                    updateForm('accountAssignment', v);
                                    setIsAccountDropdownOpen(true);
                                  }}
                                  onFocus={() => setIsAccountDropdownOpen(true)}
                                  onBlur={() => setTimeout(() => setIsAccountDropdownOpen(false), 200)}
                                  placeholder="Type or select DEPARTMENT/CAMPAIGN."
                                />
                                {isAccountDropdownOpen && accounts.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {accounts
                                      .filter(acc => acc.name.toLowerCase().includes((form.accountAssignment || '').toLowerCase()))
                                      .map((acc) => (
                                        <button
                                          key={acc.id}
                                          type="button"
                                          className="w-full px-4 py-2 text-left text-xs font-bold text-[#374151] hover:bg-[#F3F4F6]"
                                          onClick={() => {
                                            updateForm('accountAssignment', acc.name);
                                            setIsAccountDropdownOpen(false);
                                          }}
                                        >
                                          {acc.name}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            ) : employee.accountAssignment || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>

                          <ProfileField label="Site Assignment" icon={MapPin} editing={editingHR}>
                            {editingHR ? (
                              <Select value={form.siteId} onChange={(v) => {
                                const sel = sites.find(s => s.id === v);
                                setForm(curr => ({ ...curr, siteId: v, site: sel ? sel.name : v }));
                              }}>
                                <option value="">Select site</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </Select>
                            ) : employee.site || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>

                          <ProfileField label="Employee Status" icon={User} editing={editingHR}>
                            {editingHR ? (
                              <Select value={form.employeeStatus} onChange={(v) => updateForm('employeeStatus', v)}>
                                <option value="Regular">Regular</option>
                                <option value="Probationary">Probationary</option>
                                <option value="Contractual">Contractual</option>
                                <option value="Project-Based">Project-Based</option>
                                <option value="Intern">Intern</option>
                              </Select>
                            ) : employee.employeeStatus || 'Regular'}
                          </ProfileField>

                          <div className="md:col-span-2">
                            <ProfileField label="Status" icon={User} editing={editingHR}>
                              {editingHR ? (
                                <Select value={form.status} onChange={(v) => updateForm('status', v)}>
                                  <option value="active">Active</option>
                                  <option value="floating">Floating</option>
                                  <option value="inactive">Inactive</option>
                                  <option value="separated">Separated</option>
                                </Select>
                              ) : (
                                <span className="font-bold capitalize">{employee.status || 'active'}</span>
                              )}
                            </ProfileField>
                          </div>
                        </div>
                      </ProfileSection>

                      <ProfileSection icon={Calendar} title="Dates & Milestones" iconColorClass="text-amber-600 bg-amber-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="Date Hired" icon={Calendar} editing={editingHR}>
                            {editingHR ? <Input type="date" value={form.dateHired} onChange={(v) => updateForm('dateHired', v)} /> : employee.dateHired ? new Date(employee.dateHired).toLocaleDateString() : <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>

                          {(form.status === 'floating' || employee.status === 'floating') && (
                            <ProfileField label="Float Date" icon={Calendar} editing={editingHR}>
                              {editingHR ? <Input type="date" value={form.floatDate} onChange={(v) => updateForm('floatDate', v)} /> : employee.floatDate ? new Date(employee.floatDate).toLocaleDateString() : <span className="text-[#9CA3AF]">Not Set</span>}
                            </ProfileField>
                          )}

                          {(form.status === 'inactive' || form.status === 'separated') && (
                            <>
                              <ProfileField label="Separation Date" icon={Calendar} editing={editingHR}>
                                {editingHR ? <Input type="date" value={form.separationDate} onChange={(v) => updateForm('separationDate', v)} /> : employee.separationDate ? new Date(employee.separationDate).toLocaleDateString() : <span className="text-[#9CA3AF]">Not Set</span>}
                              </ProfileField>
                              <ProfileField label="Separation Reason" icon={Briefcase} editing={editingHR}>
                                {editingHR ? <Input value={form.separationReason} onChange={(v) => updateForm('separationReason', v)} placeholder="Reason for separation" /> : employee.separationReason || <span className="text-[#9CA3AF]">Not Set</span>}
                              </ProfileField>
                            </>
                          )}
                        </div>
                      </ProfileSection>

                      <ProfileSection icon={ShieldCheck} title="Government Identifiers" iconColorClass="text-emerald-600 bg-emerald-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="SSS Number" icon={ShieldCheck} editing={editingHR}>
                            {editingHR ? <Input value={form.sssNo} onChange={(v) => updateForm('sssNo', v)} placeholder="00-0000000-0" /> : employee.sssNo || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>
                          <ProfileField label="TIN Number" icon={ShieldCheck} editing={editingHR}>
                            {editingHR ? <Input value={form.tinNo} onChange={(v) => updateForm('tinNo', v)} placeholder="000-000-000-000" /> : employee.tinNo || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>
                          <ProfileField label="PhilHealth Number" icon={ShieldCheck} editing={editingHR}>
                            {editingHR ? <Input value={form.philhealthNo} onChange={(v) => updateForm('philhealthNo', v)} placeholder="00-000000000-0" /> : employee.philhealthNo || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>
                          <ProfileField label="Pag-IBIG Number" icon={ShieldCheck} editing={editingHR}>
                            {editingHR ? <Input value={form.pagibigNo} onChange={(v) => updateForm('pagibigNo', v)} placeholder="0000-0000-0000" /> : employee.pagibigNo || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>
                        </div>
                      </ProfileSection>
                    </motion.div>
                  )}

                  {/* PANE 3: ACCOUNTS & IT SECURITY */}
                  {activeTab === 'accounts' && canViewIT && (
                    <motion.div
                      key="pane-accounts"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      className="space-y-8"
                    >
                      <ProfileSection icon={Laptop} title="System Accounts" iconColorClass="text-purple-600 bg-purple-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="Snappy Email" icon={Mail} editing={editingIT}>
                            {editingIT ? (
                              <div className="flex items-center gap-2">
                                <Input value={form.boEmail} onChange={(v) => { updateForm('boEmail', v); setIsBoEmailEdited(true); }} placeholder="username@bigoutsource.com" />
                                {!isBoEmailEdited && (
                                  <button type="button" onClick={() => regenerateField('boEmail')} className="p-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 shrink-0" title="Auto-generate email">
                                    Auto
                                  </button>
                                )}
                              </div>
                            ) : employee.boEmail || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>

                          <ProfileField label="Snappy Email Password" icon={Key} editing={editingIT}>
                            {editingIT ? (
                              <Input type="text" value={form.emailPassword} onChange={(v) => updateForm('emailPassword', v)} placeholder="Password" />
                            ) : canViewSecrets ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{showPassword ? employee.emailPassword || 'No password set' : '••••••••••••'}</span>
                                {employee.emailPassword && (
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-gray-700">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Hidden (Requires Secret Access)</span>
                            )}
                          </ProfileField>

                          <ProfileField label="LMS Account" icon={Laptop} editing={editingIT}>
                            {editingIT ? (
                              <div className="flex items-center gap-2">
                                <Input value={form.lmsAccount} onChange={(v) => { updateForm('lmsAccount', v); setIsLmsAccountEdited(true); }} placeholder="LMS Username" />
                                {!isLmsAccountEdited && (
                                  <button type="button" onClick={() => regenerateField('lmsAccount')} className="p-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 shrink-0" title="Auto-generate LMS">
                                    Auto
                                  </button>
                                )}
                              </div>
                            ) : employee.lmsAccount || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>

                          <ProfileField label="Outlook Email" icon={Mail} editing={editingIT}>
                            {editingIT ? <Input value={form.outlookEmail} onChange={(v) => updateForm('outlookEmail', v)} placeholder="user@outlook.com" /> : employee.outlookEmail || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>

                          <ProfileField label="Google Account" icon={Mail} editing={editingIT}>
                            {editingIT ? <Input value={form.googleAccount} onChange={(v) => updateForm('googleAccount', v)} placeholder="user@gmail.com" /> : employee.googleAccount || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>

                          <ProfileField label="Teams Account" icon={Mail} editing={editingIT}>
                            {editingIT ? <Input value={form.teamsAccount} onChange={(v) => updateForm('teamsAccount', v)} placeholder="user@teams.com" /> : employee.teamsAccount || <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>

                          <div className="md:col-span-2">
                            <ProfileField label="Mattermost Account" icon={Mail} editing={editingIT}>
                              {editingIT ? <Input value={form.mattermostAccount} onChange={(v) => updateForm('mattermostAccount', v)} placeholder="user@mattermost.com" /> : employee.mattermostAccount || <span className="text-[#9CA3AF]">Not Set</span>}
                            </ProfileField>
                          </div>
                        </div>
                      </ProfileSection>

                      <ProfileSection icon={Key} title="Device Assets & Credentials" iconColorClass="text-indigo-600 bg-indigo-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="PC Name" icon={Laptop} editing={editingIT}>
                            {editingIT ? (
                              <div className="flex items-center gap-2">
                                <Input value={form.pcName} onChange={(v) => { updateForm('pcName', v); setIsPcNameEdited(true); }} placeholder="BO-PC-XXXX" />
                                {!isPcNameEdited && (
                                  <button type="button" onClick={() => regenerateField('pcName')} className="p-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 shrink-0" title="Auto-generate PC Name">
                                    Auto
                                  </button>
                                )}
                              </div>
                            ) : employee.pcName || <span className="text-red-500 font-black">Not Assigned</span>}
                          </ProfileField>

                          <ProfileField label="BIOS Date" icon={Calendar} editing={editingIT}>
                            {editingIT ? <Input type="date" value={form.biosDate} onChange={(v) => updateForm('biosDate', v)} /> : employee.biosDate ? new Date(employee.biosDate).toLocaleDateString() : <span className="text-[#9CA3AF]">Not Set</span>}
                          </ProfileField>

                          <ProfileField label="Device Type" icon={Laptop} editing={editingIT}>
                            {editingIT ? (
                              <Select value={form.deviceType} onChange={(v) => updateForm('deviceType', v)}>
                                <option value="Windows">Windows</option>
                                <option value="Mac">Mac</option>
                                <option value="Linux">Linux</option>
                              </Select>
                            ) : employee.deviceType || 'Windows'}
                          </ProfileField>

                          <ProfileField label="Windows License Key" icon={Key} editing={editingSecrets}>
                            {editingSecrets ? (
                              <Input value={form.windowsKey} onChange={(v) => updateForm('windowsKey', v)} placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" />
                            ) : canViewSecrets ? (
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{employee.windowsKey || <span className="text-red-500 font-black">Not Assigned</span>}</span>
                                {employee.windowsKey && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(employee.windowsKey);
                                      toast.success('Windows key copied to clipboard');
                                    }}
                                    className="p-1 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-md"
                                    title="Copy License Key"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Hidden (Requires Secret Access)</span>
                            )}
                          </ProfileField>

                          <div className="md:col-span-2">
                            <ProfileField label="REMOTE ID" icon={Globe} editing={editingSecrets}>
                              {editingSecrets ? (
                                <Input value={form.rustdeskId} onChange={(v) => updateForm('rustdeskId', v)} placeholder="123 456 789" />
                              ) : canViewSecrets ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-indigo-600">{employee.rustdeskId || <span className="text-red-500 font-black">Not Assigned</span>}</span>
                                  {employee.rustdeskId && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(employee.rustdeskId);
                                        toast.success('REMOTE ID copied to clipboard');
                                      }}
                                      className="p-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 rounded-md"
                                      title="Copy REMOTE ID"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Hidden (Requires Secret Access)</span>
                              )}
                            </ProfileField>
                          </div>
                        </div>
                      </ProfileSection>

                      <ProfileSection icon={ShieldAlert} title="Security Compliance" iconColorClass="text-rose-600 bg-rose-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <ProfileField label="ESET Antivirus" icon={ShieldAlert} editing={editingIT}>
                            {editingIT ? (
                              <Select value={form.esetStatus} onChange={(v) => updateForm('esetStatus', v)}>
                                <option value="active">Active (Protected)</option>
                                <option value="uninstalled">Uninstalled / Missing</option>
                                <option value="expired">Expired / Outdated</option>
                              </Select>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                employee.esetStatus === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {employee.esetStatus || 'Unknown'}
                              </span>
                            )}
                          </ProfileField>

                          <ProfileField label="Activity Watch" icon={Clock} editing={editingIT}>
                            {editingIT ? (
                              <Select value={form.activityWatchStatus} onChange={(v) => updateForm('activityWatchStatus', v)}>
                                <option value="installed">Installed & Running</option>
                                <option value="uninstalled">Uninstalled / Missing</option>
                                <option value="error">Error / Not Reporting</option>
                              </Select>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                employee.activityWatchStatus === 'installed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {employee.activityWatchStatus || 'Unknown'}
                              </span>
                            )}
                          </ProfileField>
                        </div>
                      </ProfileSection>
                    </motion.div>
                  )}

                  {/* PANE 4: AUDIT HISTORY */}
                  {activeTab === 'audit' && can('auditlogs.view') && (
                    <motion.div
                      key="pane-audit"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      className="space-y-8"
                    >
                      <ProfileSection icon={Clock} title="Audit History" iconColorClass="text-indigo-600 bg-indigo-50">
                        <div className="relative pl-4 md:pl-0">
                          {auditLogs.length ? (
                            <>
                              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#E5E7EB] before:via-[#E5E7EB] before:to-transparent">
                                <AnimatePresence initial={false}>
                                  {auditLogs.slice(0, visibleLogsCount).map((log) => (
                                    <motion.div
                                      key={log.id}
                                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                      className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                                    >
                                      {/* Timeline node */}
                                      <div className="flex flex-col items-center gap-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow">
                                          <Clock className="w-4 h-4" />
                                        </div>
                                      </div>

                                      {/* Card */}
                                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                                        <div className="flex flex-col gap-1 mb-3">
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <p className="text-sm font-black text-[#111827]">{actionLabel(log.action)}</p>
                                              {can('auditlogs.undo') && log.action.endsWith('.update') && (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUndo(log);
                                                  }}
                                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 hover:text-indigo-700 rounded-lg transition-all uppercase tracking-widest shadow-sm group/undo"
                                                  title="Undo Action"
                                                >
                                                  <Undo2 className="w-3 h-3 transition-transform group-hover/undo:-rotate-45" />
                                                  Undo
                                                </button>
                                              )}
                                            </div>
                                            <p className="text-[0.625rem] font-black text-[#9CA3AF] uppercase tracking-wider shrink-0">{formatDate(log.createdAt)}</p>
                                          </div>
                                          <p className="text-xs font-bold text-[#6B7280]">by {actorLabel(log)}</p>
                                        </div>
                                        <div className="space-y-2">
                                          {detailsText(log.details).map((item: any, index: number) => (
                                            <div
                                              key={index}
                                              className="rounded-xl border border-[#F3F4F6] bg-[#F9FAFB] px-4 py-3"
                                            >
                                              {'to' in item ? (
                                                <div className="flex flex-col gap-1 text-sm">
                                                  <span className="font-black text-[#111827]">
                                                    {item.field}
                                                  </span>

                                                  <div className="flex flex-wrap items-center gap-2 text-[#6B7280]">
                                                    <span className="line-through text-red-500 break-all">
                                                      {item.from}
                                                    </span>

                                                    <span className="font-bold text-[#9CA3AF]">&rarr;</span>

                                                    <span className="font-bold text-green-600 break-all">
                                                      {item.to}
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex justify-between text-sm">
                                                  <span className="font-black text-[#111827]">
                                                    {item.field}
                                                  </span>

                                                  <span className="text-[#4B5563] font-medium">
                                                    {item.value}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                              <div className="mt-8 flex justify-center gap-4">
                                {visibleLogsCount > 3 && (
                                  <button
                                    type="button"
                                    onClick={() => setVisibleLogsCount(prev => Math.max(3, prev - 3))}
                                    className="px-6 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-bold text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] hover:shadow-sm transition-all shadow-sm"
                                  >
                                    View less
                                  </button>
                                )}
                                {visibleLogsCount < auditLogs.length && (
                                  <button
                                    type="button"
                                    onClick={() => setVisibleLogsCount(prev => Math.min(prev + 3, auditLogs.length))}
                                    className="px-6 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-bold text-[#4B5563] hover:text-[#111827] hover:bg-[#F9FAFB] hover:shadow-sm transition-all shadow-sm"
                                  >
                                    View {Math.min(3, auditLogs.length - visibleLogsCount)} more {auditLogs.length - visibleLogsCount === 1 ? 'record' : 'records'}
                                  </button>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm font-bold text-[#9CA3AF]">No audit history for this employee yet.</p>
                          )}
                        </div>
                      </ProfileSection>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
            {/* Floating Sticky Save Bar (when editing and dirty) */}
            <AnimatePresence>
              {isEditing && hasChanges && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111827] text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 max-w-lg w-[90%] justify-between backdrop-blur-xl bg-opacity-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-amber-400">Unsaved Changes</p>
                      <p className="text-[11px] text-gray-300 font-medium">You have edited records in this profile</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || !hasChanges}
                      className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canArchiveEmployee && showArchiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${employee.isArchived
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                    }`}
                >
                  {employee.isArchived ? (
                    <RotateCcw className="w-6 h-6" />
                  ) : (
                    <Archive className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#111827]">
                    {archiveIntent === 'unarchive'
                      ? 'Unarchive Employee'
                      : 'Archive Employee'}
                  </h3>

                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                    Are you sure you want to{' '}
                    <span className="font-bold text-[#111827]">
                      {archiveIntent === 'unarchive'
                        ? `unarchive ${employee.fullName}`
                        : `archive ${employee.fullName}`}
                    </span>
                    ?
                  </p>

                  <p className="mt-2 text-sm text-[#6B7280]">
                    {archiveIntent === 'unarchive'
                      ? 'This employee will be restored to the active directory. Please provide their required HR fields.'
                      : !employee.isReadyForArchive
                        ? 'Please confirm you have cleared the required fields by checking the boxes below to mark this employee for archiving.'
                        : archiveStep === 1 
                          ? 'This employee will be removed from the active directory. Please select their new status below:' 
                          : 'Please confirm you have cleared the required fields by checking the boxes below.'}
                  </p>
                  
                  {archiveIntent === 'unarchive' && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Job Title</label>
                        <input
                          type="text"
                          value={unarchiveJobTitle}
                          onChange={(e) => setUnarchiveJobTitle(e.target.value)}
                          placeholder="e.g. Customer Service Rep"
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Employee Status</label>
                        <select
                          value={unarchiveEmployeeStatus}
                          onChange={(e) => setUnarchiveEmployeeStatus(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                        >
                          <option value="Regular">Regular</option>
                          <option value="Probationary">Probationary</option>
                          <option value="Fix-Term">Fix-Term</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">DEPARTMENT/CAMPAIGN</label>
                        <select
                          value={unarchiveAccountAssignment}
                          onChange={(e) => setUnarchiveAccountAssignment(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                        >
                          <option value="">Select a Department/Campaign</option>
                          {accounts.map(account => (
                            <option key={account.id} value={account.name}>{account.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Site</label>
                        <select
                          value={unarchiveSiteId}
                          onChange={(e) => setUnarchiveSiteId(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                        >
                          <option value="">Select Site Location</option>
                          {sites.map((site) => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {archiveIntent === 'archive' && archiveStep === 1 && employee.isReadyForArchive && (
                    <div className="mt-4 animate-in fade-in">
                      <select
                        value={archiveStatusReason}
                        onChange={(e) => {
                          const newStatus = e.target.value as 'separated' | 'floating';
                          setArchiveStatusReason(newStatus);
                          if (newStatus === 'separated') {
                            setArchiveSeparationReason('Resigned');
                          } else {
                            setArchiveSeparationReason('');
                          }
                          setArchiveSeparationReasonOther('');
                        }}
                        className={cn(
                          "w-full px-3 py-2.5 bg-white border rounded-xl text-sm font-bold outline-none focus:ring-2 transition-all",
                          archiveStatusReason === 'separated' ? "border-red-300 focus:ring-red-500 text-red-600" : "border-orange-300 focus:ring-orange-500 text-orange-600"
                        )}
                      >
                        <option value="separated">SEPARATED</option>
                        <option value="floating">FLOATING</option>
                      </select>

                      <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2">Reason for Archiving</label>
                        {archiveStatusReason === 'separated' ? (
                          <select
                            value={archiveSeparationReason}
                            onChange={(e) => setArchiveSeparationReason(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                          >
                            <option value="Resigned">Resigned</option>
                            <option value="AWOL">AWOL</option>
                            <option value="Terminated">Terminated</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Please specify the reason..."
                            value={archiveSeparationReason}
                            onChange={(e) => setArchiveSeparationReason(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                          />
                        )}

                        <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-2 mt-4">Date</label>
                        <input
                          type="date"
                          value={archiveSeparationDate}
                          onChange={(e) => setArchiveSeparationDate(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {archiveIntent === 'archive' && (archiveStep === 2 || !employee.isReadyForArchive) && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-right-4">
                      {!employee.isReadyForArchive ? (
                        activeITAccountKeys.map(acc => (
                          <label key={acc.key} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={itCheckboxes[acc.key] || false} onChange={(e) => setItCheckboxes(prev => ({ ...prev, [acc.key]: e.target.checked }))} />
                            <span className="text-sm font-bold text-gray-700">{acc.label}</span>
                          </label>
                        ))
                      ) : (
                        <>
                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={hrCheckboxes.jobTitle} onChange={(e) => setHrCheckboxes(prev => ({ ...prev, jobTitle: e.target.checked }))} />
                            <span className="text-sm font-bold text-gray-700">Job Title</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={hrCheckboxes.accountAssignment} onChange={(e) => setHrCheckboxes(prev => ({ ...prev, accountAssignment: e.target.checked }))} />
                            <span className="text-sm font-bold text-gray-700">Department/Campaign</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" className="w-5 h-5 text-indigo-600 rounded" checked={hrCheckboxes.site} onChange={(e) => setHrCheckboxes(prev => ({ ...prev, site: e.target.checked }))} />
                            <span className="text-sm font-bold text-gray-700">Site</span>
                          </label>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowArchiveModal(false);
                    setArchiveIntent(null);
                    setArchiveStep(1);
                  }}
                  disabled={isArchiving}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827]"
                >
                  Cancel
                </button>

                {archiveIntent === 'archive' && archiveStep === 1 && employee.isReadyForArchive ? (
                  <button
                    type="button"
                    onClick={() => setArchiveStep(2)}
                    disabled={isArchiving || (!archiveSeparationReason.trim() || !archiveSeparationDate)}
                    className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Proceed <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleArchiveEmployee}
                    disabled={
                      isArchiving ||
                      (archiveIntent === 'unarchive' && (!unarchiveJobTitle.trim() || !unarchiveAccountAssignment.trim() || !unarchiveSiteId))
                    }
                    className={`flex items-center gap-2 px-4 py-2.5 text-white rounded-xl text-sm font-bold disabled:opacity-50 ${archiveIntent === 'unarchive'
                        ? 'bg-green-600 hover:bg-green-700'
                        : !employee.isReadyForArchive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {isArchiving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : archiveIntent === 'unarchive' ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}

                    {archiveIntent === 'unarchive'
                      ? 'Confirm Unarchive'
                      : !employee.isReadyForArchive ? 'Deactivate & Send Archive Request' : 'Finalize & Archive Employee'}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {undoTargetLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                  <Undo2 className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#111827]">
                    Undo Revert Action
                  </h3>

                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                    Are you sure you want to revert this{' '}
                    <span className="font-bold text-[#111827]">
                      {actionLabel(undoTargetLog.action).toLowerCase()}
                    </span>{' '}
                    action? This will restore the fields to their previous values.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUndoTargetLog(null)}
                  disabled={isUndoing}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmUndo}
                  disabled={isUndoing}
                  className="flex items-center gap-2 px-4 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {isUndoing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Undo2 className="w-4 h-4" />
                  )}
                  Confirm Undo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-red-50 text-red-600">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#111827]">
                    Delete Employee Permanently
                  </h3>

                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
                    Are you sure you want to completely delete{' '}
                    <span className="font-bold text-[#111827]">
                      {employee.fullName}
                    </span>
                    ? This action cannot be undone and will erase all data associated with this employee.
                  </p>

                  <div className="mt-4">
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="CONFIRM"
                      className={`w-full rounded-xl border px-4 py-2.5 text-sm font-bold outline-none transition-all ${deleteInput === 'CONFIRM'
                          ? 'border-green-400 focus:ring-2 focus:ring-[#111827]'
                          : deleteInput.length > 0
                            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
                            : 'border-[#E5E7EB] focus:ring-2 focus:ring-[#111827]'
                        }`}
                    />
                    <p className="text-[0.6875rem] font-bold text-[#6B7280] mt-2">Type "CONFIRM" to enable the Delete button.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteInput('');
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteInput !== 'CONFIRM'}
                  className="flex items-center gap-2 px-4 py-2.5 text-white bg-red-600 hover:bg-red-700 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  children,
  compact = false,
  iconColorClass = 'text-[#111827] bg-[#F3F4F6]',
  className,
  action,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  compact?: boolean;
  iconColorClass?: string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <motion.section
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 380, damping: 30 } }}
      className={cn('bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-xl transition-shadow duration-300', compact ? 'p-6' : 'p-8', className)}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-xl', iconColorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black text-[#111827]">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function ProfileField({
  label,
  icon: Icon,
  editing,
  children,
  error,
}: {
  label: string;
  icon?: ElementType;
  editing?: boolean;
  children: ReactNode;
  error?: string;
}) {
  const isMissing = !editing && (
    children === 'Not Assigned' ||
    children === 'Not Set' ||
    children === 'Unassigned' ||
    children === '' ||
    children === null ||
    children === undefined
  );

  return (
    <div className={cn("group rounded-xl transition-colors duration-200", !editing && "-mx-3 px-3 py-2 hover:bg-[#F9FAFB]")}>
      <p className="text-[0.625rem] font-black text-[#9CA3AF] uppercase tracking-widest mb-1.5">{label}</p>
      <AnimatePresence mode="popLayout" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {children}
            {error && <span className="text-xs font-bold text-red-600 mt-1.5 block">{error}</span>}
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="flex items-center gap-3 w-full min-w-0"
          >
            {Icon && <Icon className={cn("w-4 h-4 transition-colors shrink-0", isMissing ? "text-red-400 group-hover:text-red-500" : "text-[#D1D5DB] group-hover:text-[#9CA3AF]")} />}
            <span className={cn("text-sm font-bold flex items-center gap-1.5 w-full min-w-0 break-all", isMissing ? "text-red-600" : "text-[#111827]")}>
              {children}
              {isMissing && <ShieldAlert className="w-3.5 h-3.5" />}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComplianceField({
  label,
  value,
  status,
  editing,
  children,
}: {
  label: string;
  value: string;
  status: boolean;
  editing: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group p-4 rounded-xl border border-[#E5E7EB] hover:border-[#CBD5E1] hover:shadow-md transition-all duration-300">
      <p className="text-[0.625rem] font-bold text-[#9CA3AF] uppercase mb-1.5 group-hover:text-[#6B7280] transition-colors">{label}</p>
      <AnimatePresence mode="popLayout" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="flex items-center justify-between"
          >
            <p className="text-sm font-black text-[#111827]">{value}</p>
            <div className={cn('w-2.5 h-2.5 rounded-full shadow-sm', status ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, required, isFilled, children, error }: { label: string; required?: boolean; isFilled?: boolean; children: ReactNode; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-2 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
        {label} 
        {required && (
          <span 
            className={cn(
              "rounded-full px-2 py-0.5 text-[0.5625rem] border transition-colors",
              isFilled 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-red-50 text-red-600 border-red-100"
            )}
          >
            {isFilled ? 'Filled' : 'Required'}
          </span>
        )}
      </span>
      {children}
      {error && <span className="text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  error = false,
  max,
  onAppendSpecialChar,
  onFocus,
  onBlur,
  className,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
  max?: string;
  onAppendSpecialChar?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        max={max}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'w-full px-3 py-2.5 bg-white border rounded-xl text-sm text-[#111827] outline-none transition-all',
          error ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-500' : 'border-[#E5E7EB] focus:ring-2 focus:ring-[#111827]',
          onAppendSpecialChar ? "pr-10" : "",
          className
        )}
      />
      {onAppendSpecialChar && (
        <button
          type="button"
          onClick={onAppendSpecialChar}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold transition-colors",
            error 
              ? "border-red-200 bg-red-100 text-red-600 hover:bg-red-200" 
              : "border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F4F6]"
          )}
          title="Insert ñ"
        >
          ñ
        </button>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] outline-none focus:ring-2 focus:ring-[#111827] transition-all"
    >
      {children}
    </select>
  );
}

function GeneratedValue({ value, placeholder }: { value: string; placeholder: string }) {
  return (
    <div className="w-full px-3 py-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563]">
      {value || placeholder}
    </div>
  );
}

function AccountDropdownGroup({
  title,
  accounts,
  onSelect,
  selectedValue,
}: {
  title: string;
  accounts: AccountOption[];
  onSelect: (account: AccountOption) => void;
  selectedValue?: string;
}) {
  if (!accounts.length) return null;

  return (
    <div className="border-b border-[#F3F4F6] last:border-b-0">
      <div className="sticky top-0 bg-[#F9FAFB] px-3 py-2 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
        {title}
      </div>
      {accounts.map((account) => {
        const isSelected = selectedValue === account.name;
        return (
          <button
            key={account.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(account);
            }}
            className={cn(
              "flex w-full items-center justify-between gap-3 border-t border-[#F3F4F6] px-3.5 py-2.5 text-left transition-colors hover:bg-[#F3F4F6]",
              isSelected ? "bg-[#EFF6FF]" : ""
            )}
          >
            <span className={cn("truncate text-sm font-bold", isSelected ? "text-[#2563EB]" : "text-[#111827]")}>{account.name}</span>
            {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
          </button>
        );
      })}
    </div>
  );
}


