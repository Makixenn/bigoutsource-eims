import { NotificationModel } from '../models/notification.model.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { RoleService } from '../services/role.service.js';
import { EmailService } from '../services/email.service.js';


const EMPLOYEE_ADDED_TYPE = 'employee.added';

function hasCapability(capabilities, capability) {
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
      if (String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);
    const message = `${actorName} added ${employeeLabel} to employee records.`;

    const isHrFieldsMissing = !employee.accountAssignment || !employee.site || !employee.jobTitle || !employee.status || !employee.employeeStatus || !employee.dateHired || !employee.birthdate || !employee.phoneNumber || !employee.address;
    const isItFieldsMissing = !employee.bigoutsourceEmail || !employee.rustdeskId || !employee.pcName || !employee.windowsLicenseKey || !employee.esetStatus || !employee.activityWatchStatus || !employee.lmsAccount || !employee.emailPassword || !employee.outlookEmail || !employee.googleAccount || !employee.teamsAccount || !employee.mattermostAccount || !employee.deviceType || !employee.biosDate;

    const notificationsToCreate = [];

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

    if (isHrFieldsMissing) {
      const hrFieldsList = [
        { label: 'Department / Account Assignment', checked: !!employee.accountAssignment },
        { label: 'Site', checked: !!employee.site },
        { label: 'Job Title', checked: !!employee.jobTitle },
        { label: 'Status', checked: !!employee.status },
        { label: 'Employee Status', checked: !!employee.employeeStatus },
        { label: 'Date Hired', checked: !!employee.dateHired },
        { label: 'Birthdate', checked: !!employee.birthdate },
        { label: 'Phone Number', checked: !!employee.phoneNumber },
        { label: 'Address', checked: !!employee.address }
      ];
      const incompleteHrFields = hrFieldsList.filter(f => !f.checked).map(f => f.label);

      const hrRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.hr_action'));
      hrRecipients.forEach(r => {
        notificationsToCreate.push({
          ...baseNotification,
          type: 'hr_action',
          recipientId: r.id,
          message: `${actorName} added ${employeeLabel}. Missing HR fields: ${incompleteHrFields.join(', ')}`,
          details: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            accountAssignment: employee.accountAssignment,
            site: employee.site,
            missingFields: 'HR',
            incompleteFields: incompleteHrFields
          }
        });
      });
    }

    if (isItFieldsMissing) {
      const itFieldsList = [
        { label: 'Snappy Email', checked: !!employee.bigoutsourceEmail },
        { label: 'Remote ID', checked: !!employee.rustdeskId },
        { label: 'PC Name', checked: !!employee.pcName },
        { label: 'Windows License Key', checked: !!employee.windowsLicenseKey },
        { label: 'ESET Status', checked: !!employee.esetStatus },
        { label: 'ActivityWatch Status', checked: !!employee.activityWatchStatus },
        { label: 'LMS Account', checked: !!employee.lmsAccount },
        { label: 'Email Default Password', checked: !!employee.emailPassword },
        { label: 'Outlook Email', checked: !!employee.outlookEmail },
        { label: 'Google Account', checked: !!employee.googleAccount },
        { label: 'Teams Account', checked: !!employee.teamsAccount },
        { label: 'Mattermost Account', checked: !!employee.mattermostAccount },
        { label: 'Device Type', checked: !!employee.deviceType },
        { label: 'BIOS Date', checked: !!employee.biosDate }
      ];
      const incompleteItFields = itFieldsList.filter(f => !f.checked).map(f => f.label);

      const itRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.it_action'));
      itRecipients.forEach(r => {
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
      });
    }

    let createdNotifications = [];
    if (notificationsToCreate.length > 0) {
      createdNotifications = await NotificationModel.createMany(notificationsToCreate);
    }

    // Send emails
    const emailPromises = [];
    if (isHrFieldsMissing) {
      const hrFieldsList = [
        { label: 'Department / Account Assignment', checked: !!employee.accountAssignment },
        { label: 'Site', checked: !!employee.site },
        { label: 'Job Title', checked: !!employee.jobTitle },
        { label: 'Status', checked: !!employee.status },
        { label: 'Employee Status', checked: !!employee.employeeStatus },
        { label: 'Date Hired', checked: !!employee.dateHired },
        { label: 'Birthdate', checked: !!employee.birthdate },
        { label: 'Phone Number', checked: !!employee.phoneNumber },
        { label: 'Address', checked: !!employee.address }
      ];

      const hrRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.hr_action') && r.email);
      for (const r of hrRecipients) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'HR Fields Incomplete Alert',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'added a new employee. Please review the HR fields below:',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: hrFieldsList
        }));
      }
    }

    if (isItFieldsMissing) {
      const itFieldsList = [
        { label: 'Snappy Email', checked: !!employee.bigoutsourceEmail },
        { label: 'Remote ID', checked: !!employee.rustdeskId },
        { label: 'PC Name', checked: !!employee.pcName },
        { label: 'Windows License Key', checked: !!employee.windowsLicenseKey },
        { label: 'ESET Status', checked: !!employee.esetStatus },
        { label: 'ActivityWatch Status', checked: !!employee.activityWatchStatus },
        { label: 'LMS Account', checked: !!employee.lmsAccount },
        { label: 'Email Default Password', checked: !!employee.emailPassword },
        { label: 'Outlook Email', checked: !!employee.outlookEmail },
        { label: 'Google Account', checked: !!employee.googleAccount },
        { label: 'Teams Account', checked: !!employee.teamsAccount },
        { label: 'Mattermost Account', checked: !!employee.mattermostAccount },
        { label: 'Device Type', checked: !!employee.deviceType },
        { label: 'BIOS Date', checked: !!employee.biosDate }
      ];

      const itRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.it_action') && r.email);
      for (const r of itRecipients) {
        emailPromises.push(EmailService.sendEmployeeActionEmail(r.email, {
          actionName: 'IT Fields Incomplete Alert',
          employeeName: employeeLabel,
          actorName,
          roleSpecificMessage: 'added a new employee. Please provision the IT assets below:',
          actionUrl: `/employee/${employee.id}`,
          fieldsList: itFieldsList
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
      if (String(recipient.id) === String(actor.userId)) continue;
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
      if (String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);

    const hrFields = ['fullName', 'accountAssignment', 'site', 'jobTitle', 'status', 'employeeStatus', 'dateHired', 'birthdate', 'phone', 'address'];
    const itFields = ['boEmail', 'rustdeskId', 'pcName', 'windowsKey', 'esetStatus', 'activityWatchStatus', 'lmsAccount', 'emailPassword', 'outlookEmail', 'googleAccount', 'teamsAccount', 'mattermostAccount', 'deviceType', 'biosDate'];

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
      boEmail: 'bigoutsourceEmail'
    };

    const readableLabels = {
      fullName: 'Employee Name',
      accountAssignment: 'Department / Account Assignment',
      site: 'Site',
      jobTitle: 'Job Title',
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
      biosDate: 'BIOS Date'
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
};
