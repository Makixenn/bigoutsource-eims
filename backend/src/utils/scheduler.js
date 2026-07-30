import cron from 'node-cron';
import { EmployeeModel } from '../models/employee.model.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { EmailService } from '../services/email.service.js';

async function processDailyBirthdays() {
  console.log('Running daily birthday check...');
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const monthDay = `${mm}-${dd}`;

    const employees = await EmployeeModel.findAll({ status: 'active', isArchived: false });
    const birthdayEmployees = employees.filter(e => e.birthdate && e.birthdate.endsWith(monthDay));

    if (birthdayEmployees.length === 0) {
      console.log('No birthdays today.');
      return;
    }

    // Find all users with HR capabilities
    const allUsers = await UserProfileModel.findAll({ status: 'active' });
    const { RoleService } = await import('../services/role.service.js');
    
    const hrAdmins = [];
    for (const u of allUsers) {
      const capabilities = await RoleService.resolveUserCapabilities(u);
      if (capabilities.includes('notifications.hr_action.daily_birthdays')) {
        hrAdmins.push(u);
      }
    }

    if (hrAdmins.length === 0) return;

    let emailHtml = `<h3>Employee Birthdays for Today (${monthDay})</h3><ul>`;
    for (const emp of birthdayEmployees) {
      emailHtml += `<li><strong>${emp.fullName}</strong> (${emp.accountAssignment || 'Unassigned'})</li>`;
    }
    emailHtml += `</ul><p>Make sure to wish them a happy birthday!</p>`;

    for (const admin of hrAdmins) {
      if (admin.email) {
        await EmailService.sendRawEmail(
          admin.email,
          `🎂 Today's Birthdays - ${birthdayEmployees.length} employee(s)`,
          emailHtml
        ).catch(console.error);
      }
    }
    console.log(`Birthday email sent to ${hrAdmins.length} HR admin(s).`);
  } catch (error) {
    console.error('Error processing daily birthdays:', error);
  }
}

export function initScheduler() {
  console.log('Initializing scheduler...');
  
  // Run every day at 08:00 AM
  cron.schedule('0 8 * * *', processDailyBirthdays);
}
