# Admin-Created Account Password Customization & MFA Flow Documentation

This document explains the technical details, database updates, API endpoints, and user flows implemented to support link-based password customization and MFA verification for user accounts created by administrators.

---

## 1. Feature Overview & User Journey

To prevent administrators from needing to manually assign and communicate temporary passwords to new users, we implemented an email-based password setup loop:

The user journey consists of the following steps:

1. **Account Registration by Admin**: An administrator uses the Registration wizard on EIMS to create a user account by entering the employee's name, email, department, and site. No password is typed by the administrator.
2. **Initial Password Setup**: The backend looks up the `Employee` directory by email. If it finds a matching record, it hashes the employee's **EMAIL DEFAULT PASSWORD** and sets it as the initial account password; otherwise, it generates a secure random fallback password.
3. **One-Time Token Generation**: The system generates a cryptographically secure random token (`passwordSetupToken`) and saves it on the user profile record.
4. **Email Dispatch**: EIMS emails the user a customized greeting and a secure link pointing to the password setup route (e.g. `/setup-password?token=TOKEN`).
5. **Token Verification**: When the user clicks the link, the page verifies the token's validity with the backend. If the token is valid, the user is presented with the "Set Password" and "Confirm Password" fields.
6. **Password Customization & Token Consumption**: The user submits their new personalized password. The backend immediately:
   - Validates the new password strength.
   - Hashes and updates the password on the user's profile.
   - Nullifies the `passwordSetupToken` in the database (rendering the email link permanently invalid/used).
   - Generates a new 6-digit MFA OTP and emails it to the user.
7. **Email Ownership Verification (MFA)**: The frontend displays the MFA verification screen. Once the user enters the code received in their inbox and the backend confirms it is correct, EIMS issues the active JWT tokens, logs them in, and redirects them to the EIMS dashboard.

---

## 2. Technical Modifications

### A. Database Modifications
Added a secure, unique field to model `UserProfile` in [schema.prisma](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/prisma/schema.prisma):
```prisma
passwordSetupToken  String?       @unique @map("password_setup_token")
```
This is mapped to the `password_setup_token` column in the PostgreSQL database.

### B. Backend Services & Controllers
1. **[userProfile.model.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/src/models/userProfile.model.js)**:
   - Configured `normalize`, `create`, and `update` to map `passwordSetupToken`.
   - Added `findByPasswordSetupToken(token)` helper.
2. **[email.service.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/src/services/email.service.js)**:
   - Added `sendPasswordSetupEmail(toEmail, token)` to build and send the setup link pointing to the EIMS web application.
3. **[auth.validator.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/src/utils/auth.validator.js)**:
   - Updated `registerValidator` to make `password` optional.
   - Added `setupPasswordValidator` enforcing strong password criteria (minimum 12 characters, uppercase, lowercase, numbers, and special characters).
4. **[auth.service.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/src/services/auth.service.js)**:
   - **Register**: Queries the `Employee` directory record by matching the email against `bigoutsourceEmail` or `outlookEmail`. If found, the employee's **EMAIL DEFAULT PASSWORD** is used as the initial password; otherwise, a secure random fallback password is created. Generates the setup token and fires the setup email.
   - **verifySetupPasswordToken**: Validates the token exists in the DB.
   - **setupPassword**: Validates the token, hashes and updates the password, nullifies the token in the database, generates a 6-digit verification code, sends the verification email, and signs a pending MFA token.
5. **[auth.routes.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/backend/src/routes/auth.routes.js)**:
   - Registered endpoints:
     - `GET /api/auth/setup-password/verify`
     - `POST /api/auth/setup-password`

### C. Frontend Modifications
1. **[authService.js](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/frontend/src/features/auth/services/authService.js)**:
   - Added wrappers `verifySetupPasswordToken(token)` and `setupPassword(token, password)`.
2. **[RegisterForm.tsx](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/frontend/src/features/auth/components/RegisterForm.tsx)**:
   - Simplified the wizard for admins to 2 steps: **User Information** and **Work Details** (removed Step 3: Security). On submission, the form skips manual password parameters.
3. **[SetupPassword.tsx](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/frontend/src/pages/SetupPassword.tsx)**:
   - Built the page inheriting `LoginBackground` and card styling matching the EIMS login aesthetic. 
   - Handles real-time password strength rules, inputs confirmation checks, MFA form transitions, resend cooldowns, and session logins.
4. **[App.tsx](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/frontend/src/App.tsx)**:
   - Registered `/setup-password` as a public route.
5. **[Directory.tsx](file:///c:/Users/OJT-Arami/Documents/projects/bigoutsource-eims/frontend/src/pages/Directory.tsx)**:
   - Resolved a TypeScript compilation error by adding the missing default property `employeeStatus` inside the `initialForm` object.

---

## 3. Testing in Local Development

1. **Start Services**: Make sure Docker containers are running:
   ```bash
   docker compose up -d
   ```
2. **Register a User**:
   - Log in as Super Admin.
   - Go to **User Management** -> **Register Account**.
   - Input user details (matching a registered employee email if you want to initialize it with their **EMAIL DEFAULT PASSWORD**).
   - Submit the form.
3. **Check Intercepted Email**:
   - Open your browser to Mailpit: [http://localhost:8025](http://localhost:8025).
   - Find the email with the subject: `"Set Up Your BigOutsource EIMS Account Password"`.
4. **Customize Password**:
   - Click the "Set Up Password" link in the email.
   - Verify the password setup page renders with a styling identical to the login page.
   - Enter a matching, valid strong password and submit.
5. **Verify MFA**:
   - Look back at Mailpit for a code under `"Your MFA Verification Code"`.
   - Enter the 6-digit code.
   - Verify you are logged in and automatically redirected to the EIMS dashboard.
6. **One-Time Use Check**:
   - Click the link in the email again.
   - Verify the page displays: `"Link Invalid or Expired"` and displays an error box.
