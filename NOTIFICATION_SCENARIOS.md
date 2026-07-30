# Notification Scenarios and Workflows

This document outlines all the automated notification triggers and email designs within the BigOutsource Employee Information Management System (EIMS).

## Overview

The notification system uses both **In-App Notifications** and **Email Notifications** to ensure that HR and IT are kept in the loop regarding employee status changes, onboarding, offboarding, and record updates.

### General Rules

- **Self-Notifications:** The actor who triggers the notification *will* receive the notification if they possess the required permissions. This guarantees that all actions are explicitly logged and confirmed.
- **Permissions-Based Delivery:** Notifications are only delivered to users whose assigned Role has the corresponding Capability (e.g., `notifications.hr_action`, `notifications.it_action`).

---

## Scenarios

### 1. Employee Added (HR Onboarding)
- **Trigger:** HR completes the initial creation of an employee record.
- **Audience:** IT Admins.
- **Message:** "[Actor Name] added a new employee: [Employee Name]."
- **Action:** Prompts IT to begin their provisioning process.

### 2. IT Provisioning Request / Reminder
- **Trigger:** HR clicks the "Send Request" or "Send Reminder" button on a pending employee's profile.
- **Audience:** IT Admins.
- **Email Design:**
  - Includes a specialized **Yellow "Note from HR" box** if HR provided a custom note before sending.
  - Standard blue header (`#1f6fa0`).
- **Message:** "[Actor Name] has requested you to complete the IT provisioning for this employee." (or reminder).

### 3. IT Provisioning Completed
- **Trigger:** IT fills out the required IT fields and marks the employee as fully provisioned.
- **Audience:** HR Admins / Super Admins.
- **Email Design:**
  - Includes a specialized **Green Success box** stating that the IT Admin has completed the provisioning.
  - Standard blue header (`#1f6fa0`).
- **Message:** "[Actor Name] completed IT provisioning for [Employee Name]."

### 4. Employee Record Updated (HR Fields)
- **Trigger:** An authorized user updates one or more HR-related fields on an employee's profile.
- **Audience:** HR Admins / Super Admins.
- **Details:** The notification explicitly lists all fields that were updated, showing the old and new values. 
- **Note:** Only fields that *actually changed* will trigger this email. If a save occurs without changes, the notification is skipped.

### 5. Employee Record Updated (IT Fields)
- **Trigger:** An authorized user updates one or more IT-related credentials on an employee's profile.
- **Audience:** IT Admins / Super Admins.
- **Archive Integration:** Setting an employee to "Ready for Archive" (clearing their credentials) counts as an IT update. This guarantees an IT update email is fired during the deactivation process.

### 6. Employee Archived (Deactivation)
- **Trigger:** IT clicks "Deactivate & Send Archive Request," preparing the employee for final archival.
- **Audience:** HR Admins.
- **Message:** "[Actor Name] archived employee: [Employee Name]."
- **Action:** Alerts HR that IT has cleared the credentials and the employee is ready for final archival by HR.

### 7. Employee Unarchived (Reactivation)
- **Trigger:** HR unarchives a previously archived employee.
- **Audience:** IT Admins.
- **Message:** "[Actor Name] unarchived employee: [Employee Name]."
- **Action:** Alerts IT that the employee is returning and requires new IT provisioning/credentials.

### 8. Employee Deleted
- **Trigger:** A Super Admin permanently deletes an employee record.
- **Audience:** HR & IT Admins.
- **Message:** "[Actor Name] deleted employee: [Employee Name]."

---

## Authentication Emails
*Note: These are strictly email-only and do not appear in the in-app notification center.*

### 1. New Account Password Setup
- **Trigger:** A Super Admin or HR Admin creates a brand new user account/profile.
- **Audience:** The new employee (sent to their registered personal/company email).
- **Message:** "Welcome to BigOutsource EIMS... Please use the following link to set up your account password."

### 2. Password Reset Request
- **Trigger:** A user clicks "Forgot Password" on the login screen.
- **Audience:** The user requesting the reset.
- **Message:** "We received a request to reset your BigOutsource EIMS password..."

### 3. MFA Verification Code
- **Trigger:** A user logs in with their credentials while Multi-Factor Authentication is enabled.
- **Audience:** The user logging in.
- **Message:** "Your MFA verification code is: [6-digit code]. This code is valid for 5 minutes."

---

## Scheduled & System Alerts
*Note: These are also email-only alerts based on cron jobs or background system tasks.*

### 1. Daily Birthday Alerts
- **Trigger:** An automated cron job runs every morning at 8:00 AM to check for employee birthdays matching the current date.
- **Audience:** HR Admins (must have the `notifications.hr_action.daily_birthdays` capability).
- **Message:** An email digest titled "🎂 Today's Birthdays - [X] employee(s)", listing the names of all employees celebrating a birthday today.

### 2. Bulk Import Completed
- **Trigger:** A user successfully finishes processing a CSV bulk import of new employees.
- **Audience:** The user who initiated the bulk import.
- **Message:** "Your recent employee bulk import has finished processing." It includes a summary of successfully imported rows, failed rows, and newly created departments.
