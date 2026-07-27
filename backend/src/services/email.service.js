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
  }
};

