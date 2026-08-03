import { NotificationModel } from '../models/notification.model.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { RoleService } from '../services/role.service.js';
import { EmailService } from '../services/email.service.js';


const EMPLOYEE_ADDED_TYPE = 'employee.added';

function hasCapability(recipient, capability) {
  const capabilities = Array.isArray(recipient) ? recipient : (recipient?.capabilities || []);
  return Array.isArray(capabilities) && capabilities.includes(capability);
}

function roleLabel(role = '') {
  return String(role)
    .split('_')
    .filter(Boolean)
    .map((part) => {
      if (part === 'it') return 'IT';
      if (part === 'hr') return 'HR';
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function actorIdForDatabase(actor) {
  const id = actor?.userId;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ''))
    ? id
    : null;
}

export const NotificationService = {
  async listForUser(user, { limit } = {}) {
    const notifications = await NotificationModel.findForRecipient(user.id, { limit });

    return notifications.filter((notification) => {
      if (notification.type === 'hr_action') {
        return hasCapability(user.capabilities, 'notifications.hr_action');
      }
      if (notification.type === 'it_action') {
        return hasCapability(user.capabilities, 'notifications.it_action');
      }
      if (notification.type === EMPLOYEE_ADDED_TYPE) {
        return hasCapability(user.capabilities, 'notifications.hr_action') || hasCapability(user.capabilities, 'notifications.it_action');
      }
      if (notification.type === 'eval_due' || notification.type === 'eval_due_batched') {
        return hasCapability(user.capabilities, 'notifications.hr_action.evaluations');
      }
      return true;
    });
  },

  markAllReadForUser(user) {
    return NotificationModel.markAllReadForRecipient(user.id);
  },

  clearAllForUser(user) {
    return NotificationModel.clearAllForRecipient(user.id);
  },

  async clearSingleForUser(id, user) {
    const notification = await NotificationModel.findById(id);
    if (!notification) return [];

    const isActionRequired = notification.details?.missingFields || notification.details?.isArchiveNotification;

    if (notification.entityId && notification.entityType && isActionRequired) {
      return NotificationModel.clearGlobalByEntity(
        notification.entityType,
        notification.entityId,
        notification.type,
        notification.details?.missingFields,
        notification.details?.isArchiveNotification
      );
    }

    return NotificationModel.clearSingleForRecipient(id, user.id);
  },

  async notifyEmployeeAdded({ employee, actor }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    // Pre-fetch capabilities for all potential recipients (excluding actor)
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      // if (String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);
    const message = `${actorName} added ${employeeLabel} to employee records.`;

    const notificationsToCreate = [];


    const hrFieldsList = [
      { label: 'Full Name', checked: !!employee.fullName || (!!employee.firstName && !!employee.lastName), cap: 'notifications.hr_action.fullName' },
      { label: 'Department / Account Assignment', checked: !!employee.accountAssignment, cap: 'notifications.hr_action.accountAssignment' },
      { label: 'Site', checked: !!employee.site, cap: 'notifications.hr_action.site' },
      { label: 'Position', checked: !!employee.position, cap: 'notifications.hr_action.position' },
      { label: 'Status', checked: !!employee.status, cap: 'notifications.hr_action.status' },
      { label: 'Employee Status', checked: !!employee.employeeStatus, cap: 'notifications.hr_action.employeeStatus' },
      { label: 'Date Hired', checked: !!employee.dateHired, cap: 'notifications.hr_action.dateHired' },
      { label: 'Float Date', checked: (employee.status !== 'floating' && employee.status !== 'Floating') || !!employee.floatDate, cap: 'notifications.hr_action.status' },
      { label: 'Separation Date', checked: (employee.status !== 'inactive' && employee.status !== 'separated' && employee.status !== 'Inactive' && employee.status !== 'Separated') || !!employee.separationDate, cap: 'notifications.hr_action.status' },
      { label: 'Separation Reason', checked: (employee.status !== 'inactive' && employee.status !== 'separated' && employee.status !== 'Inactive' && employee.status !== 'Separated') || !!employee.separationReason, cap: 'notifications.hr_action.status' },
      { label: 'SSS No.', checked: !!employee.sssNo, cap: 'notifications.hr_action.sssNo' },
      { label: 'TIN No.', checked: !!employee.tinNo, cap: 'notifications.hr_action.tinNo' },
      { label: 'PhilHealth No.', checked: !!employee.philhealthNo, cap: 'notifications.hr_action.philhealthNo' },
      { label: 'Pag-Ibig No.', checked: !!employee.pagibigNo, cap: 'notifications.hr_action.pagibigNo' }
    ];

    const itFieldsList = [
        { label: 'Snappy Email', checked: !!employee.bigoutsourceEmail, cap: 'notifications.it_action.bigoutsourceEmail' },
        { label: 'Remote ID', checked: !!employee.rustdeskId, cap: 'notifications.it_action.rustdeskId' },
        { label: 'PC Name', checked: !!employee.pcName, cap: 'notifications.it_action.pcName' },
        { label: 'Windows License Key', checked: !!employee.windowsLicenseKey, cap: 'notifications.it_action.windowsKey' },
        { label: 'ESET Status', checked: employee.esetStatus && employee.esetStatus.toLowerCase() === 'active', cap: 'notifications.it_action.esetStatus' },
        { label: 'ActivityWatch Status', checked: employee.activityWatchStatus && employee.activityWatchStatus.toLowerCase() === 'installed', cap: 'notifications.it_action.activityWatchStatus' },
        { label: 'LMS Account', checked: !!employee.lmsAccount, cap: 'notifications.it_action.lmsAccount' },
        { label: 'Email Default Password', checked: !!employee.emailPassword, cap: 'notifications.it_action.emailPassword' },
        { label: 'Outlook Email', checked: !!employee.outlookEmail, cap: 'notifications.it_action.outlookEmail' },
        { label: 'Teams Account', checked: !!employee.teamsAccount, cap: 'notifications.it_action.teamsAccount' },
        { label: 'Mattermost Account', checked: !!employee.mattermostAccount, cap: 'notifications.it_action.mattermostAccount' },
        { label: 'Device Type', checked: !!employee.deviceType, cap: 'notifications.it_action.deviceType' },
        { label: 'BIOS Date', checked: !!employee.biosDate, cap: 'notifications.it_action.biosDate' }
    ];

    const baseNotification = {
      type: EMPLOYEE_ADDED_TYPE,
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole,
      message,
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
    };

    const isHrFieldsMissing = hrFieldsList.some(f => !f.checked);
    const isItFieldsMissing = itFieldsList.some(f => !f.checked);

    const hrRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.hr_action'));
    hrRecipients.forEach(r => {
      const incompleteHrFields = hrFieldsList.filter(f => !f.checked && hasCapability(r, f.cap)).map(f => f.label);
      if (incompleteHrFields.length > 0) {
        notificationsToCreate.push({
          ...baseNotification,
          type: 'hr_action',
          recipientId: r.id,
          message: `${actorName} added ${employeeLabel}. Missing HR fields: ${incompleteHrFields.join(', ')}`,
          details: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            missingFields: 'HR',
            incompleteFields: incompleteHrFields
          }
        });
      }
    });

    const itRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.it_action'));
    itRecipients.forEach(r => {
      const incompleteItFields = itFieldsList.filter(f => !f.checked && hasCapability(r, f.cap)).map(f => f.label);
      if (incompleteItFields.length > 0) {
        notificationsToCreate.push({
          ...baseNotification,
          type: 'it_action',
          recipientId: r.id,
          message: `${actorName} added ${employeeLabel}. Missing IT fields: ${incompleteItFields.join(', ')}`,
          details: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            accountAssignment: employee.accountAssignment,
            site: employee.site,
            missingFields: 'IT',
            incompleteFields: incompleteItFields
          }
        });
      }
    });

    let createdNotifications = [];
    if (notificationsToCreate.length > 0) {
      createdNotifications = await NotificationModel.createMany(notificationsToCreate);
    }

    // Send emails
    const emailPromises = [];
    if (isHrFieldsMissing) {
      const hrRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.hr_action') && r.email);
      for (const r of hrRecipients) {
        const recipientIncompleteHr = hrFieldsList.filter(f => !f.checked && hasCapability(r, f.cap));
        if (recipientIncompleteHr.length === 0) continue;

        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'New Employee Added',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'created a new employee profile.',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: [{ label: 'Profile Created in Database', checked: true }, ...recipientIncompleteHr.map(f => ({ label: f.label, checked: false }))]
        }));
      }
    }

    if (isItFieldsMissing) {
      const itRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.it_action') && r.email);
      for (const r of itRecipients) {
        const recipientIncompleteIt = itFieldsList.filter(f => !f.checked && hasCapability(r, f.cap));
        if (recipientIncompleteIt.length === 0) continue;

        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'New Employee Added',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'created a new employee profile.',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: [{ label: 'Profile Created in Database', checked: true }, ...recipientIncompleteIt.map(f => ({ label: f.label, checked: false }))]
        }));
      }
    }

    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyEmployeeArchived({ employee, actor, isComplete }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      // Removed actor exclusion so the actor also gets a copy for audit purposes
      // if (!isComplete && String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);
    const message = isComplete 
      ? `${actorName} completed archiving employee ${employeeLabel}.`
      : `${actorName} cleared IT credentials for employee ${employeeLabel} and is requesting HR to finalize the archive.`;

    const notificationsToCreate = [];

    if (isComplete) {
      await NotificationModel.clearGlobalByEntity('employees', employee.id, 'it_action').catch(console.error);
    }

    const targetCapabilities = ['notifications.hr_action.archive', 'notifications.it_action.archive']; // Notify both IT and HR in both states
    const targetType = isComplete ? 'it_action' : 'hr_action'; // determines icon styling on frontend

    const baseNotification = {
      type: targetType,
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole,
      message,
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
    };

    const targetRecipients = eligibleRecipients.filter(r => targetCapabilities.some(cap => hasCapability(r.capabilities, cap)));
    
    // 1. Create DB Notifications
    targetRecipients.forEach(r => {
      notificationsToCreate.push({
        ...baseNotification,
        recipientId: r.id,
        details: {
          employeeNumber: employee.employeeNumber,
          fullName: employee.fullName,
          accountAssignment: employee.accountAssignment,
          site: employee.site,
          isArchiveNotification: true,
          archiveStatus: isComplete ? 'complete' : 'pending'
        }
      });
    });

    let createdNotifications = [];
    if (notificationsToCreate.length > 0) {
      createdNotifications = await NotificationModel.createMany(notificationsToCreate);
    }

    // 2. Send Emails
    const emailPromises = [];
    for (const r of targetRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: isComplete ? 'Employee Final Archive Completed' : 'Employee Archive Request Alert',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: isComplete 
            ? 'has permanently archived the employee and removed them from the system.' 
            : 'has cleared the IT credentials for the employee. Please proceed with the final archive.',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: [] // no fields needed
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyEmployeeUnarchived({ employee, actor }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);
    const message = `${actorName} unarchived employee ${employeeLabel}.`;

    const targetCapabilities = ['notifications.it_action.archive', 'notifications.hr_action.archive'];
    const targetRecipients = eligibleRecipients.filter(r => targetCapabilities.some(cap => hasCapability(r.capabilities, cap)));

    const notificationsToCreate = targetRecipients.map(r => ({
      type: 'it_action',
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole,
      message,
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
      recipientId: r.id,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        isUnarchiveNotification: true
      }
    }));

    let createdNotifications = [];
    if (notificationsToCreate.length > 0) {
      createdNotifications = await NotificationModel.createMany(notificationsToCreate);
    }

    const emailPromises = [];
    for (const r of targetRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'Employee Unarchived',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'has restored the employee to the active directory.',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: []
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyEmployeeDeleted({ employee, actor }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const targetRecipients = [];
    for (const recipient of recipients) {
      // if (String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      if (hasCapability(capabilities, 'notifications.employee_deleted')) {
        targetRecipients.push(recipient);
      }
    }

    if (targetRecipients.length === 0) return [];

    const actorName = actor.userLabel || 'A user';
    const employeeLabel = employee.fullName || employee.employeeNumber || 'An employee';

    const baseNotification = {
      type: 'global',
      message: `${actorName} permanently deleted employee ${employeeLabel}`,
      actionUrl: `/directory`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const notificationsToCreate = [];
    targetRecipients.forEach(r => {
      notificationsToCreate.push({
        ...baseNotification,
        recipientId: r.id,
        details: {
          employeeNumber: employee.employeeNumber,
          fullName: employeeLabel,
        }
      });
    });

    const createdNotifications = await NotificationModel.createMany(notificationsToCreate);

    // Send Emails
    const emailPromises = [];
    for (const r of targetRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'Employee Permanently Deleted',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'has permanently deleted the employee from the database.',
          actionUrl: `/directory`,
          fieldsList: []
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('Email delivery failed:', result.reason);
        }
      }
    }

    return createdNotifications;
  },

  async notifyEmployeeUpdated({ employee, actor, changes }) {
    if (!changes || changes.length === 0) return [];
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      // if (String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);

    const hrFields = ['fullName', 'accountAssignment', 'site', 'position', 'status', 'employeeStatus', 'dateHired', 'birthdate', 'phone', 'address'];
    const itFields = ['boEmail', 'rustdeskId', 'pcName', 'windowsKey', 'esetStatus', 'activityWatchStatus', 'lmsAccount', 'emailPassword', 'outlookEmail', 'googleAccount', 'teamsAccount', 'mattermostAccount', 'deviceType', 'biosDate', 'isReadyForArchive'];

    const hrChanges = changes.filter(c => hrFields.includes(c.field));
    const itChanges = changes.filter(c => itFields.includes(c.field));

    const emailPromises = [];
    const notificationsToCreate = [];

    const baseNotification = {
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole,
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
    };

    const capabilityMap = {
      birthdate: 'birthDate',
      phone: 'phoneNumber',
      boEmail: 'bigoutsourceEmail',
      isReadyForArchive: 'archive'
    };

    const readableLabels = {
      fullName: 'Employee Name',
      accountAssignment: 'Department / Account Assignment',
      site: 'Site',
      position: 'Position',
      status: 'Status',
      employeeStatus: 'Employment Status',
      dateHired: 'Date Hired',
      birthdate: 'Birthdate',
      phone: 'Phone Number',
      address: 'Address',
      boEmail: 'Snappy Email',
      rustdeskId: 'Remote ID',
      pcName: 'PC Name',
      windowsKey: 'Windows License Key',
      esetStatus: 'ESET Status',
      activityWatchStatus: 'ActivityWatch Status',
      lmsAccount: 'LMS Account',
      emailPassword: 'Email Default Password',
      outlookEmail: 'Outlook Email',
      googleAccount: 'Google Account',
      teamsAccount: 'Teams Account',
      mattermostAccount: 'Mattermost Account',
      deviceType: 'Device Type',
      biosDate: 'BIOS Date',
      isReadyForArchive: 'Archive Request Status'
    };
    const isUnarchiving = changes.some(c => c.field === 'isArchived' && c.to === 'false');
    const isArchiving = changes.some(c => c.field === 'isArchived' && c.to === 'true');

    if (isUnarchiving) {
      // Do not send field update notifications during an unarchive, 
      // as the 'Employee Unarchived' notification covers it perfectly.
      return [];
    }

    if (hrChanges.length > 0) {
      for (const r of eligibleRecipients) {
        const allowedChanges = hrChanges.filter(c => {
          const capSuffix = capabilityMap[c.field] || c.field;
          return hasCapability(r.capabilities, `notifications.hr_action.${capSuffix}`);
        });
        if (allowedChanges.length > 0) {
          const fieldsList = allowedChanges.map(c => ({
            label: `${readableLabels[c.field] || c.field} changed from "${c.from}" to "${c.to}"`,
            checked: true
          }));
          
          if (r.email) {
            emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
              actionName: 'Employee Record Updated (HR Fields)',
              employeeName: employeeLabel,
              actorName,
              roleSpecificMessage: 'updated HR-related fields for this employee.',
              actionUrl: `/employee/${employee.id}`,
              fieldsList
            }));
          }

          notificationsToCreate.push({
            ...baseNotification,
            type: 'hr_action',
            recipientId: r.id,
            message: `${actorName} updated HR-related fields for ${employeeLabel}.`,
            details: {
              updatedFields: fieldsList.map(f => f.label)
            }
          });
        }
      }
    }

    if (itChanges.length > 0) {
      for (const r of eligibleRecipients) {
        const allowedChanges = itChanges.filter(c => {
          const capSuffix = capabilityMap[c.field] || c.field;
          return hasCapability(r.capabilities, `notifications.it_action.${capSuffix}`);
        });
        if (allowedChanges.length > 0) {
          const fieldsList = allowedChanges.map(c => ({
            label: `${readableLabels[c.field] || c.field} changed from "${c.from}" to "${c.to}"`,
            checked: true
          }));
          
          if (r.email) {
            emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
              actionName: 'Employee Record Updated (IT Fields)',
              employeeName: employeeLabel,
              actorName,
              roleSpecificMessage: 'updated IT-related fields for this employee.',
              actionUrl: `/employee/${employee.id}`,
              fieldsList
            }));
          }

          notificationsToCreate.push({
            ...baseNotification,
            type: 'it_action',
            recipientId: r.id,
            message: `${actorName} updated IT-related fields for ${employeeLabel}.`,
            details: {
              updatedFields: fieldsList.map(f => f.label)
            }
          });
        }
      }
    }

    let createdNotifications = [];
    if (notificationsToCreate.length > 0) {
      createdNotifications = await NotificationModel.createMany(notificationsToCreate);
    }

    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }
    
    return createdNotifications;
  },

  async notifyITForProvisioning({ employee, actor, note = '', isReminder = false }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      if (hasCapability(capabilities, 'notifications.it_action')) {
        eligibleRecipients.push(recipient);
      }
    }

    if (eligibleRecipients.length === 0) return [];

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';

    const actionName = isReminder ? 'IT Provisioning Reminder' : 'IT Provisioning Request';
    const message = isReminder 
      ? `${actorName} sent a reminder for IT provisioning for ${employeeLabel}.`
      : `${actorName} requested IT provisioning for ${employeeLabel}.`;
    
    const roleSpecificMessage = isReminder 
      ? `has sent a reminder for you to complete the IT provisioning for this employee.`
      : `has requested you to complete the IT provisioning for this employee.`;

    const baseNotification = {
      type: 'it_action',
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole: roleLabel(actor.userRole),
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
      message,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
        note
      }
    };

    const notificationsToCreate = eligibleRecipients.map(r => ({
      ...baseNotification,
      recipientId: r.id,
    }));

    const createdNotifications = await NotificationModel.createMany(notificationsToCreate);

    const emailPromises = [];
    for (const r of eligibleRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName,
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage,
          actionUrl: `/employee/${employee.id}`,
          fieldsList: [],
          note
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyBatchedEvaluationsDue(evaluations) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      if (hasCapability(capabilities, 'notifications.hr_action.evaluations')) {
        eligibleRecipients.push(recipient);
      }
    }

    if (eligibleRecipients.length === 0 || evaluations.length === 0) return [];

    const dueTodayCount = evaluations.filter(e => e.timing === 'due_today').length;
    const upcomingCount = evaluations.filter(e => e.timing === 'upcoming').length;

    let message = '';
    if (dueTodayCount > 0 && upcomingCount > 0) {
      message = `${dueTodayCount} evaluation(s) due today and ${upcomingCount} upcoming.`;
    } else if (dueTodayCount > 0) {
      message = `${dueTodayCount} evaluation(s) due today.`;
    } else {
      message = `${upcomingCount} evaluation(s) coming up soon.`;
    }

    const baseNotification = {
      type: 'eval_due_batched',
      actorId: null,
      actorName: 'System',
      actorRole: 'System',
      message,
      entityType: 'evaluations',
      entityId: 'batched_evals',
      entityLabel: 'Multiple Employees',
      actionUrl: `/evaluations`,
      details: {
        totalDue: dueTodayCount,
        totalUpcoming: upcomingCount,
      }
    };

    const notificationsToCreate = eligibleRecipients.map(r => ({
      ...baseNotification,
      recipientId: r.id,
    }));

    const createdNotifications = await NotificationModel.createMany(notificationsToCreate);

    const emailPromises = [];
    for (const r of eligibleRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendBatchedEvaluationsEmail(r.email, evaluations));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyEvaluationDue({ employee, milestone, dateStr, timing }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      if (hasCapability(capabilities, 'notifications.hr_action.evaluations')) {
        eligibleRecipients.push(recipient);
      }
    }

    if (eligibleRecipients.length === 0) return [];

    const employeeLabel = employee.name || employee.employeeNumber || employee.id;
    
    const message = timing === 'due_today' 
      ? `Evaluation (${milestone}) for ${employeeLabel} is due TODAY (${dateStr}).`
      : `Evaluation (${milestone}) for ${employeeLabel} is coming up on ${dateStr}.`;

    const baseNotification = {
      type: 'eval_due',
      actorId: null,
      actorName: 'System',
      actorRole: 'System',
      message,
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName || employee.name,
        milestone,
        timing
      }
    };

    const notificationsToCreate = eligibleRecipients.map(r => ({
      ...baseNotification,
      recipientId: r.id,
    }));

    const createdNotifications = await NotificationModel.createMany(notificationsToCreate);

    const emailPromises = [];
    for (const r of eligibleRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'Evaluation Due',
          employeeName: employeeLabel,
          actorName: 'System',
          roleSpecificMessage: `A milestone evaluation (${milestone}) is due on ${dateStr}.`,
          actionUrl: `/employee/${employee.id}`,
          fieldsList: []
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  },

  async notifyHRProvisioningComplete({ employee, actor }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      if (hasCapability(capabilities, 'notifications.hr_action')) {
        eligibleRecipients.push(recipient);
      }
    }

    if (eligibleRecipients.length === 0) return [];

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';

    const message = `${actorName} completed IT provisioning for ${employeeLabel}.`;
    
    const baseNotification = {
      type: 'hr_action',
      actorId: actorIdForDatabase(actor),
      actorName,
      actorRole: roleLabel(actor.userRole),
      entityType: 'employees',
      entityId: employee.id,
      entityLabel: employeeLabel,
      actionUrl: `/employee/${employee.id}`,
      message,
      details: {
        employeeNumber: employee.employeeNumber,
        fullName: employee.fullName,
      }
    };

    const notificationsToCreate = eligibleRecipients.map(r => ({
      ...baseNotification,
      recipientId: r.id,
    }));

    const createdNotifications = await NotificationModel.createMany(notificationsToCreate);

    const emailPromises = [];
    for (const r of eligibleRecipients) {
      if (r.email) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'IT Provisioning Completed',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'has completed the IT provisioning for this employee.',
          successBox: `<strong>${actorName}</strong> has completed the IT provisioning for this employee.`,
          actionUrl: `/employee/${employee.id}`,
          fieldsList: []
        }));
      }
    }
    
    if (emailPromises.length > 0) {
      Promise.allSettled(emailPromises).catch(console.error);
    }

    return createdNotifications;
  }
};
