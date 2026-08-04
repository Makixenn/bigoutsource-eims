import cron from 'node-cron';
import { EmployeeModel } from '../models/employee.model.js';
import { UserProfileModel } from '../models/userProfile.model.js';
import { EmailService } from '../services/email.service.js';

export async function processDailyBirthdays() {
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

    // Format date for display (e.g. "August 4")
    const formattedDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let emailHtml = `
      <style>
        .profile-link { transition: color 0.2s ease; }
        .profile-link:hover { color: #2563EB !important; text-decoration: underline !important; }
      </style>
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9fafb; padding: 40px 20px; color: #111827;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header with Festive Gradient -->
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 40px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">🎉 Happy Birthday! 🎈</h1>
            <p style="margin: 10px 0 0; color: #fff5f5; font-size: 16px; opacity: 0.9;">It's time to celebrate our amazing team members!</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <p style="font-size: 16px; color: #4B5563; margin-top: 0; margin-bottom: 24px;">The following employees are celebrating their birthday today <strong>(${formattedDate})</strong>:</p>
            
            <div style="display: flex; flex-direction: column; gap: 16px;">
    `;
    
    for (const emp of birthdayEmployees) {
      let ageText = '';
      if (emp.birthdate && emp.birthdate.includes('-')) {
        const birthYear = parseInt(emp.birthdate.split('-')[0], 10);
        const age = today.getFullYear() - birthYear;
        if (!isNaN(age) && age > 0) {
          ageText = ` <span style="color: #9CA3AF; font-size: 15px; font-weight: normal;">(Turning ${age})</span>`;
        }
      }

      emailHtml += `
              <div style="padding: 16px; background-color: #fff8f1; border-left: 4px solid #FF8E53; border-radius: 8px; margin-bottom: 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0;">
                  <tr>
                    <td width="40" style="font-size: 24px; vertical-align: middle;">🎁</td>
                    <td style="vertical-align: middle;">
                      <h3 style="margin: 0 0 4px 0; color: #111827; font-size: 18px;">
                        <a href="${frontendUrl}/employee/${emp.id}" class="profile-link" style="color: #111827; text-decoration: none;">
                          ${emp.fullName || 'Unknown'}${ageText}
                        </a>
                      </h3>
                      <p style="margin: 0; color: #6B7280; font-size: 14px; font-weight: 500;">${emp.accountAssignment || 'Unassigned Department'}</p>
                    </td>
                  </tr>
                </table>
              </div>
      `;
    }
    
    emailHtml += `
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="font-size: 15px; color: #4B5563; margin: 0;">Make sure to drop them a message and wish them a wonderful day! 🥳</p>
            </div>
          </div>
        </div>
      </div>
    `;

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
