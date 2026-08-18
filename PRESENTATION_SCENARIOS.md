# EIMS Presentation - Simulation Script

*Note: This guide is designed as a simple, step-by-step "simulation" script. No technical jargon, just a direct guide on what to click and show during the presentation.*

---

### Simulation 1: Setting up the System (Super Admin)
**Goal:** Show how the system starts from a completely blank slate.
**Who is acting:** The Presenter (using the Super Admin account)

**What to do and say on screen:**
1. **Login:** Go to the login page and enter the Super Admin email. Show them that there are no passwords anymore—you just check your email for a 6-digit code.
2. **Create a Department:** 
   - Go to **Settings > Accounts / Departments**. 
   - Click "Add New" and create a dummy department (e.g., *Customer Support*). 
   - Explain that every department needs a short 4-letter code, which the system will use later.
3. **Create the Admins:** 
   - Go to **System Users**. 
   - Create an account for the HR Admin and assign them the "HR Role".
   - Create an account for the IT Admin and assign them the "IT Role".
   - *Explain:* "As a Super Admin, I have now set up the core departments and given access to the people who will actually run the system."

---

### Simulation 2: First Time Login & Adding an Employee
**Goal:** Show what happens when HR logs in for the first time and manually adds a single employee.
**Who is acting:** The Presenter (now using the HR Admin account)

**What to do and say on screen:**
1. **HR Login:** Open a new window and log in using the newly created HR Admin email. Enter the email code.
2. **Add an Employee:**
   - Go to the **Employee Directory** and click **"Add Employee"**.
   - Fill in a dummy name (e.g., *Juan Dela Cruz*), select the *Customer Support* department you just created, and fill in basic details like Date Hired and Government IDs.
   - Click **Save**.
3. **Show the Magic (Auto-Generation):**
   - Open Juan Dela Cruz's profile.
   - Show the audience that HR didn't have to think of an email address. The system automatically generated his BigOutsource Email (e.g., *jdela.cust@bigoutsource.com*) and PC Name based on his name and department!
4. **The Handoff:**
   - Point out that Juan's status is currently **"Pending IT"**. Explain that HR's job is done for now, and the system is automatically calling IT to finish the setup.

---

### Simulation 3: IT Takes Over (The Notification)
**Goal:** Show how IT and HR seamlessly work together without sending manual chat messages to each other.
**Who is acting:** The Presenter (now using the IT Admin account)

**What to do and say on screen:**
1. **IT Login:** Open a new window and log in as the IT Admin.
2. **The Notification:**
   - Point to the notification bell at the top. Click it to show the alert: *"New employee Juan Dela Cruz needs provisioning."*
3. **Fill in the Tech Details:**
   - Click the notification to open Juan's profile.
   - Fill in the IT-specific fields: **REMOTE ID**, **Windows License Key**, and mark ESET as "Active".
   - Click **Save**.
4. **Completion:**
   - Show that Juan's status has now changed to fully **"Provisioned" / Active**. The handoff is complete!

---

### Simulation 4: Uploading the Mock-up Data (Bulk Import)
**Goal:** Reassure the team that they don't have to manually type in hundreds of existing employees.
**Who is acting:** The Presenter (using the HR Admin account)

**What to do and say on screen:**
1. **Go to Import:** Click on the **Bulk Import** tool.
2. **Upload the Template:** Upload a sample Excel file containing 5 to 10 mock-up employees.
3. **The Staging Area (Error Catching):**
   - *Don't just import it instantly!* Show them the "Staging Area" where the system double-checks the Excel file first.
   - Show a simulated error: For example, point out a row where the Department doesn't exist yet, or where two employees have the exact same Employee ID.
   - Show how easy it is to fix the error directly on the screen (e.g., clicking "Resolve" or clicking "Create Department" right there).
4. **Finalize Import:** Click commit. Go back to the Directory and show that all employees are now fully loaded into the system.

---

### Simulation 5: Resignation and Archiving
**Goal:** Show the offboarding process and how the system protects company assets.
**Who is acting:** The Presenter (Switching between HR and IT)

**What to do and say on screen:**
1. **HR Initiates:** 
   - As HR, click on an employee who is resigning. 
   - Change their status to "Separated", add the Separation Date, and click archive.
2. **The Checklist:** 
   - Show that the employee doesn't just disappear. A checklist pops up. 
   - Explain that HR *cannot* fully delete the record yet because IT needs to clear them first.
3. **IT Clears:** 
   - Switch to the IT screen. Check off the "IT Clearance" box to prove the PC was returned and access was cut.
4. **Final Archive:** 
   - Switch back to HR, check the final HR clearance box, and archive the employee. Show that the record is safely stored in the "Archived" tab for future reference.
