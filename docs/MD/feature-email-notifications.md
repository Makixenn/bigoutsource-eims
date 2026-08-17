# Feature: Email Notifications

This document outlines how the email notification system works within the BigOutsource EIMS, including its configuration, implementation, and standard templates.

## Architecture & Configuration

The system uses [`nodemailer`](https://nodemailer.com/) to handle outbound emails. The transport configuration dynamically relies on environment variables, making it flexible for both local development (using tools like Mailpit) and production (using Office365, AWS SES, or SendGrid).

### SMTP Configuration
To enable the email service, the following environment variables must be defined in your `.env` file:

```env
# Required for sending emails. Defaults to 'mailpit' and '1025' if unset.
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
# Only required if your SMTP server requires authentication
SMTP_USER=your-email@bigoutsource.com
SMTP_PASS=your-secure-password
```

> [!NOTE]
> The service automatically determines if TLS should be used based on the port (`465` uses secure). It also configures `ciphers: 'SSLv3'` and `rejectUnauthorized: false` to ensure compatibility with stricter enterprise SMTP servers like Office365.

## Available Templates

The `EmailService` (`backend/src/services/email.service.js`) exports several predefined methods that wrap `nodemailer` logic into standard templates with consistent BigOutsource branding.

### 1. MFA Verification (`sendMfaOtpEmail`)
Sends a one-time passcode (OTP) for Multi-Factor Authentication.
- **Subject**: `Your MFA Verification Code`
- **Content**: A 6-digit code highlighted in the primary theme color.
- **Expiry**: The email explicitly states the code is valid for 5 minutes.

### 2. Initial Password Setup (`sendPasswordSetupEmail`)
Triggered when an administrator creates a new employee account.
- **Subject**: `Set Up Your BigOutsource EIMS Account Password`
- **Content**: A welcome message with a one-time secure link to `/setup-password?token=...`
- **Fallback**: Includes the raw URL in case the main button fails to render in strict email clients.

### 3. Employee Action Notification (`sendEmployeeActionEmail`)
A versatile template used for alerting administrators (HR/IT) when an employee record is modified, onboarded, or archived.
- **Subject**: `[EIMS] {Action}: {Employee Name}`
- **Features**:
  - Dynamically renders a list of "Action Items / Changes" with ✅/❌ indicators.
  - Can include a specialized "Note from HR" highlighted in a yellow warning box.
  - Can include a green success box for completed tasks.
  - Provides a direct link to the Employee's record.
  - If an `auditLogId` is provided, it includes a red "Undo this action" button.

### 4. Batched Evaluations (`sendBatchedEvaluationsEmail`)
Sent by the daily cron job to notify HR/Managers about upcoming or overdue employee performance evaluations.
- **Subject**: `[EIMS] Daily Evaluation Checks: {Count} Due/Upcoming`
- **Content**: 
  - Renders an HTML table listing all relevant employees, their milestones (e.g., "3rd Month", "Anniversary"), and their evaluation dates.
  - Features dynamic status badges (`DUE TODAY`, `UPCOMING (3 Days)`).

### 5. Password Reset Request (`sendPasswordResetEmail`)
Self-service password reset flow.
- **Subject**: `Reset Your BigOutsource EIMS Password`
- **Content**: A secure link to `/reset-password?token=...` valid for 1 hour.

## Implementation Example

To send a standard email within a controller, import the `EmailService`:

```javascript
import { EmailService } from '../services/email.service.js';

// Inside your controller method:
await EmailService.sendEmployeeActionEmail('hr@bigoutsource.com', {
  actionName: 'Employee Onboarding',
  employeeName: 'John Doe',
  actorName: 'Admin Jane',
  roleSpecificMessage: 'completed the IT setup for',
  actionUrl: '/directory/123',
  themeColor: '#10b981',
  buttonText: 'Review Profile'
});
```
