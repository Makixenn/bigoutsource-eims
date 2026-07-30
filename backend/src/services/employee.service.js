import crypto from 'crypto';
import { EmployeeModel } from '../models/employee.model.js';
import { AccountModel } from '../models/account.model.js';
import { AuditLogModel } from '../models/auditLog.model.js';
import { AppError } from '../utils/apiResponse.js';
import { auditActor } from '../utils/auditActor.js';
import { filterEmployeeWritePayload } from '../utils/employeeSecurity.js';
import { NotificationService } from '../services/notification.service.js';
import { NotificationModel } from '../models/notification.model.js';
import {
  buildCompanyEmail,
  buildEmployeeIdentifierBase,
  buildLmsUsernameBase,
  buildPcName,
  parseEmployeeName,
  sanitizeDepartmentCode,
  withNumericSuffix,
} from '../utils/employeeIdentity.js';

const trackedFields = [
  'employeeNumber',
  'fullName',
  'boEmail',
  'emailPassword',
  'phone',
  'address',
  'accountAssignment',
  'lmsAccount',
  'site',
  'status',
  'employeeStatus',
  'pcName',
  'dateHired',
  'biosDate',
  'deviceType',
  'windowsKey',
  'rustdeskId',
  'esetStatus',
  'activityWatchStatus',
  'isArchived',
  'outlookEmail',
  'googleAccount',
  'teamsAccount',
  'mattermostAccount',
  'position',
  'birthdate',
  'floatDate',
  'separationDate',
  'separationReason',
  'isReadyForArchive',
  'avatarUrl',
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
  'idIssuance',
  'hoodieIssuance',
  'hmoEnrollment',
  'hmoMemberCode',
  'evalFirstMonth',
  'evalThirdMonth',
  'evalFifthMonth',
  'evalSixthMonth',
  'evalAnniversary',
];

function localEmailIdentifier(email = '') {
  return String(email).split('@')[0]?.split('.')[0] || '';
}

function pcIdentifier(pcName = '') {
  const parts = String(pcName).split('-');
  return parts.length > 1 ? parts.slice(1).join('-') : '';
}

function generatedFieldsChanged(data = {}) {
  return [
    'firstName',
    'first_name',
    'middleName',
    'middle_name',
    'lastName',
    'last_name',
    'fullName',
    'name',
    'accountAssignment',
    'account',
    'internalDepartmentId',
    'internal_department_id',
    'externalDepartmentId',
    'external_department_id',
  ].some((field) => data[field] !== undefined);
}

async function resolveAccount(data, existing) {
  const accountName = data.accountAssignment ?? data.account ?? existing?.accountAssignment ?? existing?.account ?? '';
  if (!accountName) {
    return { name: '', type: 'external', code: 'UNASSIGNED' };
  }

  const account = await AccountModel.findByName(accountName);
  if (!account) throw new AppError(`Department/account "${accountName}" was not found`, 400);

  const departmentCode = sanitizeDepartmentCode(account.departmentCode || account.department_code);
  if (!departmentCode) {
    throw new AppError(`Department/account "${account.name}" needs a department code before employees can be saved`, 400);
  }

  return {
    name: account.name,
    type: account.accountType,
    code: departmentCode,
  };
}

function collectUsedValues(employees, currentId) {
  return employees.reduce(
    (sets, employee) => {
      if (String(employee.id) === String(currentId)) return sets;
      if (employee.lmsAccount) sets.lmsUsernames.add(employee.lmsAccount);

      const emailIdentifier = localEmailIdentifier(employee.boEmail);
      const pcNameIdentifier = pcIdentifier(employee.pcName);
      if (emailIdentifier) sets.employeeIdentifiers.add(emailIdentifier);
      if (pcNameIdentifier) sets.employeeIdentifiers.add(pcNameIdentifier);
      return sets;
    },
    {
      lmsUsernames: new Set(),
      employeeIdentifiers: new Set(),
    }
  );
}

async function withGeneratedIdentity(data, existing = null) {
  const merged = { ...(existing || {}), ...(data || {}) };
  const name = parseEmployeeName(merged);
  const account = await resolveAccount(merged, existing);
  const baseLmsAccount = buildLmsUsernameBase(name);
  const baseIdentifier = buildEmployeeIdentifierBase(name);
  const similarEmployees = await EmployeeModel.findSimilarIdentities(baseIdentifier, baseLmsAccount);
  const used = collectUsedValues(similarEmployees, existing?.id);
  const defaultLmsAccount = withNumericSuffix(baseLmsAccount, used.lmsUsernames);
  const identifier = withNumericSuffix(baseIdentifier, used.employeeIdentifiers);

  if (!name.fullName || !name.lastName) throw new AppError('first name and last name are required', 400);
  if (!defaultLmsAccount || !identifier) throw new AppError('Unable to generate employee identity from the provided name', 400);

  const lmsAccount = data.lmsAccount !== undefined
    ? (data.lmsAccount || (existing ? '' : defaultLmsAccount))
    : (existing?.lmsAccount ?? defaultLmsAccount);

  const boEmail = data.boEmail !== undefined
    ? (data.boEmail || (existing ? '' : buildCompanyEmail(identifier, account.code, account.type)))
    : (existing?.boEmail ?? buildCompanyEmail(identifier, account.code, account.type));

  const pcName = data.pcName !== undefined
    ? (data.pcName || (existing ? '' : buildPcName(identifier, account.code)))
    : (existing?.pcName ?? buildPcName(identifier, account.code));

  return {
    ...data,
    fullName: name.fullName,
    accountAssignment: account.name,
    lmsAccount,
    boEmail,
    pcName,
  };
}

function comparable(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function diffEmployee(before, after) {
  return trackedFields
    .map((field) => ({
      field,
      from: comparable(before?.[field]),
      to: comparable(after?.[field]),
    }))
    .filter((change) => change.from !== change.to);
}

export const EmployeeService = {
  list() {
    return EmployeeModel.findAll();
  },

  async summary() {
    const inactiveUnarchived = await EmployeeModel.countInactiveUnarchived();
    return { inactiveUnarchived };
  },

  async get(id) {
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  },

  async create(data, user, meta = {}) {
    const actor = auditActor(user);
    data = filterEmployeeWritePayload(data, user, true);

    let targetId = data.employeeNumber || data.employeeId || data.id;
    if (!targetId) {
      targetId = crypto.randomUUID();
      data.id = targetId;
      data.employeeNumber = targetId;
    }



    const existing = await EmployeeModel.findById(targetId);
    if (existing) {
      throw new AppError(`Employee with ID "${targetId}" already exists.`, 409);
    }

    const employee = await EmployeeModel.create(await withGeneratedIdentity(data));
    await AuditLogModel.create({
      ...actor,
      action: 'employee.create',
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employee.fullName || employee.employeeNumber || employee.id,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        accountAssignment: employee.accountAssignment,
        site: employee.site,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    await NotificationService.notifyEmployeeAdded({ employee, actor }).catch((error) => {
      console.error('Unable to create employee-added notifications', error);
    });
    return employee;
  },

  async update(id, data, user, meta = {}) {
    const actor = auditActor(user);
    const muteNotification = meta.muteNotification || false;
    const submittedFieldCount = data && typeof data === 'object' ? Object.keys(data).length : 0;
    data = filterEmployeeWritePayload(data, user);
    if (!Object.keys(data || {}).length) {
      throw new AppError(
        submittedFieldCount
          ? 'You do not have permission to edit the submitted employee fields'
          : 'No employee fields supplied',
        submittedFieldCount ? 403 : 400
      );
    }
    const before = await EmployeeModel.findById(id);
    if (!before) throw new AppError('Employee not found', 404);

    const archiveValue = data?.is_archived ?? data?.isArchived;
    const willBeArchived = archiveValue === undefined ? before.isArchived : archiveValue === true || String(archiveValue).toLowerCase() === 'true';
    
    const readyForArchiveValue = data?.is_ready_for_archive ?? data?.isReadyForArchive;
    const willBeReadyForArchive = readyForArchiveValue === undefined ? before.isReadyForArchive : readyForArchiveValue === true || String(readyForArchiveValue).toLowerCase() === 'true';
    
    const isHrArchiving = !before.isReadyForArchive && willBeReadyForArchive;
    const isItArchiving = !before.isArchived && willBeArchived;
    const isNewlyArchived = isHrArchiving || isItArchiving;
    const isNewlyUnarchived = before.isArchived && !willBeArchived;

    const employee = await EmployeeModel.update(id, generatedFieldsChanged(data) ? await withGeneratedIdentity(data, before) : data);
    if (!employee) throw new AppError('Employee not found', 404);

    const isHrFieldsMissing = !employee.fullName || !employee.accountAssignment || !employee.site || !employee.position || !employee.status || !employee.employeeStatus || !employee.dateHired || 
      (employee.status === 'floating' && !employee.floatDate) || 
      ((employee.status === 'inactive' || employee.status === 'separated') && !employee.separationDate) || 
      ((employee.status === 'inactive' || employee.status === 'separated') && !employee.separationReason) || 
      !employee.sssNo || !employee.tinNo || !employee.philhealthNo || !employee.pagibigNo;
      
    const isItFieldsMissing = !employee.boEmail || !employee.rustdeskId || !employee.pcName || !employee.windowsLicenseKey || 
      !employee.esetStatus || employee.esetStatus.toLowerCase() !== 'active' || 
      !employee.activityWatchStatus || employee.activityWatchStatus.toLowerCase() !== 'installed' || 
      !employee.lmsAccount || !employee.emailPassword || !employee.outlookEmail || !employee.teamsAccount || 
      !employee.mattermostAccount || !employee.deviceType || !employee.biosDate;

    if (!isHrFieldsMissing) {
      await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'hr_action', 'HR').catch(console.error);
    }
    if (!isItFieldsMissing) {
      await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'it_action', 'IT').catch(console.error);
    }

    if (isNewlyArchived) {
      await NotificationService.notifyEmployeeArchived({ 
        employee, 
        actor,
        isComplete: isItArchiving
      }).catch((error) => {
        console.error('Unable to create employee-archived notifications', error);
      });
    }

    if (isNewlyUnarchived) {
      await NotificationService.notifyEmployeeUnarchived({ 
        employee, 
        actor
      }).catch((error) => {
        console.error('Unable to create employee-unarchived notifications', error);
      });
    }

    const changes = diffEmployee(before, employee);
    
    // Check for Handoff status changes
    const beforeStatus = before.provisioningStatus;
    const afterStatus = employee.provisioningStatus;
    if (beforeStatus !== afterStatus) {
      if (afterStatus === 'pending_it') {
        await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'hr_action', 'HR').catch(console.error);
        await NotificationService.notifyITForProvisioning({ employee, actor }).catch(console.error);
      } else if (afterStatus === 'provisioned') {
        await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'it_action', 'IT').catch(console.error);
        await NotificationService.notifyHRProvisioningComplete({ employee, actor }).catch(console.error);
      }
    }

    let auditAction = 'employee.update';
    if (isNewlyUnarchived) auditAction = 'employee.unarchive';
    else if (isNewlyArchived) auditAction = 'employee.archive';

    const auditLog = await AuditLogModel.create({
      ...actor,
      action: auditAction,
      entityType: 'employees',
      entityId: id,
      entityLabel: employee.fullName || employee.employeeNumber || id,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        changes,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    // Call notifyEmployeeUpdated
    await NotificationService.notifyEmployeeUpdated({ 
      employee, 
      actor, 
      changes, 
      muteNotification,
      auditLogId: auditLog.id
    }).catch((error) => {
      console.error('Unable to create employee-updated notifications', error);
    });

    return employee;
  },

  async remove(id, user, meta = {}) {
    const actor = auditActor(user);
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    const removed = await EmployeeModel.remove(id);
    if (!removed) throw new AppError('Failed to delete employee', 500);

    await AuditLogModel.create({
      ...actor,
      action: 'employee.delete',
      entityType: 'employees',
      entityId: id,
      entityLabel: employee.fullName || id,
      details: {
        employee: employee
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  },

  async notifyIT(id, user, meta = {}) {
    const actor = auditActor(user);
    const before = await EmployeeModel.findById(id);
    if (!before) throw new AppError('Employee not found', 404);
    if (before.provisioningStatus === 'pending_it') {
      throw new AppError('Employee is already pending IT. Use Remind IT instead.', 400);
    }
    
    const note = meta.note || '';

    // Update DB
    const employee = await EmployeeModel.update(id, { provisioningStatus: 'pending_it' });

    // Mark previous notifications as complete
    await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'hr_action', 'HR').catch(console.error);
    await NotificationModel.markAsCompleteGlobalByEntity('employees', employee.id, 'it_action', 'IT').catch(console.error);

    // Send Notification with note
    await NotificationService.notifyITForProvisioning({ employee, actor, note }).catch(console.error);

    // Audit log
    await AuditLogModel.create({
      ...actor,
      action: 'employee.notify_it',
      entityType: 'employees',
      entityId: id,
      entityLabel: employee.fullName || employee.employeeNumber || id,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        note,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return employee;
  },

  async remindIT(id, user, meta = {}) {
    const actor = auditActor(user);
    const employee = await EmployeeModel.findById(id);
    if (!employee) throw new AppError('Employee not found', 404);

    if (employee.provisioningStatus !== 'pending_it') {
      throw new AppError('Can only remind IT for employees pending provisioning', 400);
    }

    const note = meta.note || '';

    // Trigger notification manually as a reminder
    await NotificationService.notifyITForProvisioning({ 
      employee, 
      actor, 
      isReminder: true,
      note
    }).catch(console.error);

    await AuditLogModel.create({
      ...actor,
      action: 'employee.remind_it',
      entityType: 'employees',
      entityId: id,
      entityLabel: employee.fullName || employee.employeeNumber || id,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        note,
      },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return { success: true };
  },
};
