import { NotificationModel } from '../models/notification.model.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { RoleService } from '../services/role.service.js';

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

    if (notification.entityId && notification.entityType) {
      return NotificationModel.clearGlobalByEntity(
        notification.entityType,
        notification.entityId,
        notification.type,
        notification.details?.missingFields
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

    const isHrFieldsMissing = !employee.accountAssignment || !employee.site || !employee.jobTitle;
    const isItFieldsMissing = !employee.bigoutsourceEmail || !employee.rustdeskId || !employee.pcName || !employee.windowsLicenseKey;

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
      const hrRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.hr_action'));
      hrRecipients.forEach(r => {
        notificationsToCreate.push({
          ...baseNotification,
          type: 'hr_action',
          recipientId: r.id,
          details: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            accountAssignment: employee.accountAssignment,
            site: employee.site,
            missingFields: 'HR',
          }
        });
      });
    }

    if (isItFieldsMissing) {
      const itRecipients = eligibleRecipients.filter(r => hasCapability(r.capabilities, 'notifications.it_action'));
      itRecipients.forEach(r => {
        notificationsToCreate.push({
          ...baseNotification,
          type: 'it_action',
          recipientId: r.id,
          details: {
            employeeNumber: employee.employeeNumber,
            fullName: employee.fullName,
            accountAssignment: employee.accountAssignment,
            site: employee.site,
            missingFields: 'IT',
          }
        });
      });
    }

    if (notificationsToCreate.length > 0) {
      return NotificationModel.createMany(notificationsToCreate);
    }
    return [];
  },

  async notifyEmployeeArchived({ employee, actor, isComplete }) {
    const recipients = await UserProfileModel.findAll({ status: 'active' });
    
    const eligibleRecipients = [];
    for (const recipient of recipients) {
      if (!isComplete && String(recipient.id) === String(actor.userId)) continue;
      const capabilities = await RoleService.resolveUserCapabilities(recipient);
      eligibleRecipients.push({ ...recipient, capabilities });
    }

    const employeeLabel = employee.fullName || employee.employeeNumber || employee.id;
    const actorName = actor.userName || actor.userEmail || 'Someone';
    const actorRole = roleLabel(actor.userRole);
    const message = isComplete 
      ? `${actorName} completed archiving employee ${employeeLabel}.`
      : `${actorName} marked employee ${employeeLabel} for archive.`;

    const notificationsToCreate = [];

    if (isComplete) {
      await NotificationModel.clearGlobalByEntity('employees', employee.id, 'it_action').catch(console.error);
    }

    const targetCapabilities = isComplete ? ['notifications.hr_action', 'notifications.it_action'] : ['notifications.it_action'];
    const targetType = isComplete ? 'hr_action' : 'it_action';

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

    if (notificationsToCreate.length > 0) {
      return NotificationModel.createMany(notificationsToCreate);
    }
    return [];
  },
};
