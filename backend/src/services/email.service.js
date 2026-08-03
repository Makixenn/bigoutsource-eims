import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Setup transporter to use environment variables dynamically
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailpit',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports (like 587)
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
  tls: {
    ciphers: 'SSLv3', // Often required by Office365
    rejectUnauthorized: false
  }
});

export const EmailService = {
  async sendMfaOtpEmail(toEmail, code) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: 'Your MFA Verification Code',
        text: `Your MFA verification code is: ${code}\nThis code is valid for 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>MFA Verification</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 2px;">${code}</h1>
            <p>This code is valid for 5 minutes.</p>
          </div>
        `,
      });
      console.log('MFA email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send MFA email:', error);
      throw new Error('Failed to send verification email');
    }
  },

  async sendPasswordSetupEmail(toEmail, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setupLink = `${frontendUrl}/setup-password?token=${token}`;
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: 'Set Up Your BigOutsource EIMS Account Password',
        text: `Welcome to BigOutsource EIMS!\n\nPlease use the following link to set up your account password:\n${setupLink}\n\nThis setup link is for one-time use only.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #111827;">
            <h2 style="color: #1f6fa0;">Welcome to BigOutsource EIMS</h2>
            <p>Your account has been created by an administrator. Please set your password to activate your access.</p>
            <div style="margin: 25px 0;">
              <a href="${setupLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Set Up Password
              </a>
            </div>
            <p style="font-size: 12px; color: #6B7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #6B7280; word-break: break-all;">${setupLink}</p>
            <p style="font-size: 12px; color: #6B7280; margin-top: 20px;">This setup link can only be used once.</p>
          </div>
        `,
      });
      console.log('Password setup email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send password setup email:', error);
      throw new Error('Failed to send registration/setup email');
    }
  },

  async sendEmployeeActionEmail(toEmail, { actionName, employeeName, actorName, roleSpecificMessage, actionUrl, fieldsList, auditLogId, note, successBox, themeColor = '#1f6fa0' }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkUrl = actionUrl.startsWith('http') ? actionUrl : `${frontendUrl}${actionUrl}`;
    
    let fieldsHtml = '';
    if (fieldsList && fieldsList.length > 0) {
      fieldsHtml = `
        <div style="margin: 20px 0; padding: 15px; background-color: #F3F4F6; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #374151; font-size: 14px;">Action Items / Changes:</h3>
          <ul style="list-style-type: none; padding-left: 0; margin-bottom: 0;">
            ${fieldsList.map(field => `
              <li style="margin-bottom: 8px; color: #111827; font-size: 14px;">
                <span style="display: inline-block; width: 24px; text-align: center; margin-right: 4px;">
                  ${field.checked ? '✅' : '❌'}
                </span>
                ${field.label}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    let noteHtml = '';
    if (note) {
      noteHtml = `
        <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-left: 6px solid #f59e0b; border-radius: 4px;">
          <p style="margin: 0; color: #92400e; font-size: 15px;">
            <strong>Note from HR:</strong> ${note}
          </p>
        </div>
      `;
    }

    let successBoxHtml = '';
    if (successBox) {
      successBoxHtml = `
        <div style="margin: 20px 0; padding: 16px; background-color: #dcfce7; border-left: 6px solid #16a34a; border-radius: 4px;">
          <p style="margin: 0; color: #166534; font-size: 15px;">
            ${successBox}
          </p>
        </div>
      `;
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: `[EIMS] ${actionName}: ${employeeName}`,
        text: `${actorName} ${roleSpecificMessage}\n\nEmployee: ${employeeName}\n\nReview the record here: ${linkUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #111827;">
            <h2 style="color: ${themeColor};">${actionName}</h2>
            ${successBox ? successBoxHtml : `<p><strong>${actorName}</strong> ${roleSpecificMessage}</p>`}
            
            ${noteHtml}
            
            <p><strong>Employee:</strong> ${employeeName}</p>
            
            ${fieldsHtml}
            
            <div style="margin: 25px 0;">
              <a href="${linkUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
                View Employee Record
              </a>
              ${auditLogId ? `
              <a href="${frontendUrl}/logs?undo=${auditLogId}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Undo this action
              </a>
              ` : ''}
            </div>
            
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6B7280;">This is an automated notification from the BigOutsource Employee Information Management System.</p>
          </div>
        `,
      });
      console.log(`Employee action email sent to ${toEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send employee action email:', error);
      // We do not throw an error here to prevent blocking the main flow.
      return null;
    }
  },

  async sendBatchedEvaluationsEmail(toEmail, evaluations) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const linkUrl = `${frontendUrl}/evaluations`;
    
    // Sort evaluations by timing, then date
    const sortedEvals = [...evaluations].sort((a, b) => {
      if (a.timing !== b.timing) {
        return a.timing === 'due_today' ? -1 : 1;
      }
      return new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime();
    });

    const rowsHtml = sortedEvals.map((e, index) => {
      const isDueToday = e.timing === 'due_today';
      const rowStyle = index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;';
      
      let badgeStyle = '';
      let badgeText = '';
      
      if (isDueToday) {
        badgeStyle = 'background-color: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;';
        badgeText = 'DUE TODAY';
      } else if (e.daysUntil === 3) {
        badgeStyle = 'background-color: #fef08a; color: #854d0e; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;';
        badgeText = 'UPCOMING (3 Days)';
      } else {
        badgeStyle = 'background-color: #dbeafe; color: #1e3a8a; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;';
        badgeText = 'UPCOMING (8 Days)';
      }
        
      return `
        <tr style="${rowStyle}">
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 500;">
            ${e.employee.name || e.employee.fullName || 'Unknown'}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            ${e.employee.id ? (e.employee.id.length === 36 && e.employee.id.includes('-') ? '<span style="color: #b45309; background-color: #fffbeb; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #fde68a;">Pending HR</span>' : e.employee.id) : 'N/A'}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
            ${e.milestone}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px;">
            ${e.dateStr}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
            <span style="${badgeStyle}">${badgeText}</span>
          </td>
        </tr>
      `;
    }).join('');

    const tableHtml = `
      <div style="overflow-x: auto; margin: 20px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px 16px; color: #374151; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Employee</th>
              <th style="padding: 12px 16px; color: #374151; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Employee ID</th>
              <th style="padding: 12px 16px; color: #374151; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Milestone</th>
              <th style="padding: 12px 16px; color: #374151; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Evaluation Date</th>
              <th style="padding: 12px 16px; color: #374151; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: `[EIMS] Daily Evaluation Checks: ${evaluations.length} Due/Upcoming`,
        text: `There are ${evaluations.length} evaluations due or coming up soon.\n\nPlease review them in the system: ${linkUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #111827; max-width: 800px; margin: 0 auto;">
            <h2 style="color: #1f6fa0;">Daily Evaluation Checks</h2>
            <p style="font-size: 15px; color: #4b5563;">Here is the compiled list of all employee evaluations that are due today or coming up soon.</p>
            
            ${tableHtml}
            
            <div style="margin: 30px 0;">
              <a href="${linkUrl}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Open Evaluations Dashboard
              </a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6B7280;">This is an automated batch notification from the BigOutsource Employee Information Management System.</p>
          </div>
        `,
      });
      console.log(`Batched evaluation email sent to ${toEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send batched evaluation email:', error);
      return null;
    }
  },

  async sendPasswordResetEmail(toEmail, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: 'Reset Your BigOutsource EIMS Password',
        text: `Reset your BigOutsource EIMS password:\n\nPlease use the following link to reset your account password:\n${resetLink}\n\nThis link will expire in 1 hour.`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #111827;">
            <h2 style="color: #1f6fa0;">Password Reset Request</h2>
            <p>We received a request to reset your BigOutsource EIMS password. Click the button below to proceed:</p>
            <div style="margin: 25px 0;">
              <a href="${resetLink}" style="background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="font-size: 12px; color: #6B7280;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #6B7280; word-break: break-all;">${resetLink}</p>
            <p style="font-size: 12px; color: #6B7280; margin-top: 20px;">This reset link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log('Password reset email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  },

  async sendRawEmail(toEmail, subject, htmlBody) {
    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_USER ? `"BigOutsource EIMS" <${process.env.SMTP_USER}>` : '"BigOutsource EIMS" <no-reply@bigoutsource.com>',
        to: toEmail,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #111827;">
            ${htmlBody}
            <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6B7280;">This is an automated notification from the BigOutsource Employee Information Management System.</p>
          </div>
        `,
      });
      console.log(`Raw email sent to ${toEmail}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send raw email:', error);
      return null;
    }
  }
};

