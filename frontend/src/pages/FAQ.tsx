import React, { useState, useMemo } from 'react';
import { FAQSidebar, FAQCategory } from '../features/faq/components/FAQSidebar';
import { FAQAccordion } from '../features/faq/components/FAQAccordion';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoginBackground } from '../features/auth/components/LoginBackground';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES: FAQCategory[] = [
  { id: 'all', label: 'All Industries Combined', description: 'Complete master dataset', icon: 'Database' },
  { id: 'security', label: 'Security & MFA', description: 'Authentication and access', icon: 'Shield' },
  { id: 'users', label: 'User Management', description: 'Admin roles and permissions', icon: 'Users' },
  { id: 'dashboard', label: 'Dashboard & Navigation', description: 'System overview', icon: 'LayoutDashboard' },
  { id: 'profile', label: 'Profile & Employee Data', description: 'HR and personal info', icon: 'UserCircle' },
  { id: 'notifications', label: 'Notifications', description: 'Alerts and updates', icon: 'Bell' },
  { id: 'data', label: 'Data Formatting', description: 'N/A, PINs, and symbols', icon: 'FileText' },
];

const FAQ_DATA = [
  // Security & MFA
  { categoryId: 'security', question: 'How does the One-Time Password (OTP) work during login?', answer: 'After entering your correct email and password, a secure 6-digit One-Time Password (OTP) is sent to your registered email address. This code is valid for 5 minutes. Once logged in, your device is trusted for 30 minutes before requiring a new OTP.' },
  { categoryId: 'security', question: 'Can I use an Authenticator App (like Google Authenticator)?', answer: 'No, the system has completely transitioned to mandatory Email-based OTP for enhanced security. Authenticator apps (QR codes) are no longer supported or required.' },
  { categoryId: 'security', question: 'Why can I not register with my personal email?', answer: 'The system strictly enforces domain restrictions. You must use an authorized company email ending in @bigoutsource.com, @outlook.com, or @bigoutsource.ph to create an account.' },
  { categoryId: 'security', question: 'What do I do if my account is locked or pending?', answer: 'If your account is pending, it means a Super Admin needs to approve your registration. If it is disabled, please contact HR or the IT department.' },
  { categoryId: 'security', question: 'How do I reset my password if I forget it?', answer: 'Click the "Forgot Password" link on the login screen, enter your email, and follow the instructions sent to your inbox to reset your password.' },
  { categoryId: 'security', question: 'How do I change my password while logged in?', answer: 'You can securely update your password at any time by navigating to your Settings page. You no longer need an administrator to reset it for you if you already have access to your account.' },
  { categoryId: 'security', question: 'Why was I suddenly logged out when logging in from my phone?', answer: 'The system enforces a strict "one session per user" rule. If you log in from a new device, your previous session on the older device is instantly and forcefully logged out.' },
  { categoryId: 'security', question: 'Does the system log me out automatically if I step away?', answer: 'Yes. If you remain completely idle for 30 minutes, the system actively monitors this and will automatically log you out to prevent unauthorized access to unattended terminals.' },
  { categoryId: 'security', question: 'What are the password complexity requirements?', answer: 'For enhanced security, all passwords are required to be a minimum of 12 characters long and must include special characters.' },
  { categoryId: 'security', question: 'How do new employees set up their initial password?', answer: 'New accounts do not accept raw passwords during creation. Instead, the system dispatches a secure, time-sensitive setup token directly to the user\'s inbox so they can define their password securely.' },
  
  // User Management
  { categoryId: 'users', question: 'What are the different roles and their permissions?', answer: 'The system has 5 roles: Super Admin (full access including User Management), Admin (full operational access except User Management), HR Admin (manages HR fields, departments, and reports), IT Admin (manages IT fields, passwords, REMOTE IDs, and hardware assets), and Viewer (read-only access to directory and departments).' },
  { categoryId: 'users', question: 'How do I manage user roles and permissions?', answer: 'Super Admins can assign or change employee roles from the User Management page. Each role automatically grants specific system capabilities based on the secure access matrix.' },
  { categoryId: 'users', question: 'How do I disable a user account?', answer: 'If an employee leaves, an admin can change their status to "disabled" in User Management. This immediately revokes their ability to log in while preserving their historical audit data.' },
  { categoryId: 'users', question: 'How do I archive an employee who has left the company?', answer: 'To archive an employee, you must now provide a valid Separation Date and select a Reason for Separation (e.g., Resignation, End of Contract). This ensures data integrity and prevents accidental archiving.' },
  { categoryId: 'users', question: 'What happens if an archived employee returns to the company?', answer: 'HR can "Unarchive" a previously archived employee. Doing so will automatically alert the IT team that the employee is returning and requires new IT provisioning or credentials.' },
  { categoryId: 'users', question: 'How can I track global system changes made by other admins?', answer: 'Super Admins have access to the comprehensive Audit Logs dashboard to track all system actions. In the logs, clicking on a highlighted \'Target Entity\' will navigate you directly to that specific employee\'s profile.' },
  { categoryId: 'users', question: 'Why does the "Add Employee" screen look shorter for IT Admins?', answer: 'The system applies strict visibility constraints. IT Admins see a truncated wizard specifically tailored for IT provisioning, while HR sees the full comprehensive workflow.' },

  // Dashboard & Navigation
  { categoryId: 'dashboard', question: 'What information is on the main Dashboard?', answer: 'The dashboard provides a quick overview of your profile status, recent notifications, and quick links depending on your role permissions.' },
  { categoryId: 'dashboard', question: 'How do I return to the Dashboard from other pages?', answer: 'You can always click the company logo or "Dashboard" link in the main navigation sidebar on the left side of your screen.' },
  { categoryId: 'dashboard', question: 'What does "Floating" mean on the Dashboard?', answer: 'Employees marked as "Floating" are active personnel who are currently unassigned to a specific campaign or project. They are kept separate from the "Archived" count.' },
  { categoryId: 'dashboard', question: 'What does the green dot next to an administrator\'s name mean?', answer: 'The system features a real-time presence engine. A green dot indicates that the user is currently online and active on the platform.' },
  { categoryId: 'dashboard', question: 'What happens if a specific chart or table fails to load?', answer: 'The system uses Error Boundaries (Crash Protection). If an individual component fails, it will not white-screen the entire dashboard. Instead, a graceful fallback UI is presented for that specific section.' },

  // Profile & Employee Data
  { categoryId: 'profile', question: 'What do the red and green badges mean when editing a profile?', answer: 'When adding or editing an employee, a red "Required" badge indicates missing mandatory information. This badge dynamically changes to a green "Filled" badge as soon as you enter the required data.' },
  { categoryId: 'profile', question: 'How do I update my EMPLOYEE INFORMATION?', answer: 'Navigate to your Employee Profile and click "Edit". Be sure to check the DEPARTMENT/CAMPAIGN section. Some critical fields might require HR approval before the changes become permanent.' },
  { categoryId: 'profile', question: 'Can I view the history of changes made to my profile?', answer: 'Yes, if you have the appropriate permissions, you can view the Audit History on the employee profile page to see what was changed, when, and by whom.' },
  { categoryId: 'profile', question: 'What is a REMOTE ID?', answer: 'A REMOTE ID is your unique identifier for remote access tools (previously referred to as RustDesk ID). It is stored securely in your profile.' },

  // Notifications
  { categoryId: 'notifications', question: 'Where can I see my notifications?', answer: 'Notifications will appear as a popup (Toaster) on the bottom right of the screen for real-time alerts. They also show up in the top navigation bell icon. You can now click the \'Done\' checkmark on a notification to globally dismiss it once the issue is resolved.' },
  { categoryId: 'notifications', question: 'Will I be notified when an employee\'s profile is updated?', answer: 'Yes. If you have the appropriate permissions, you will receive notifications when HR or IT fields are updated. The notification explicitly lists all fields that were updated. Note: You will only be notified if an actual change occurred, not just a save.' },
  { categoryId: 'notifications', question: 'What are Daily Birthday Alerts?', answer: 'The system automatically sends an email digest every morning at 8:00 AM to HR Admins containing a list of all employees celebrating a birthday that day.' },
  { categoryId: 'notifications', question: 'How do Daily Evaluation Checks work?', answer: 'An automated system runs every morning at 8:00 AM to check for employees with evaluations due today or within the next 8 days. It sends both an email summary to authorized Outlook/company domains and an in-app bell notification.' },
  { categoryId: 'notifications', question: 'How does the notification system handle new employee onboarding?', answer: 'The system uses segmented workflows. When HR adds a new employee, IT is automatically notified to begin provisioning. HR can send reminders to IT, and once IT finishes provisioning, HR is notified of the completion.' },
  { categoryId: 'notifications', question: 'What does "HR FIELDS INCOMPLETE" mean?', answer: 'This notification means that required fields in your HR profile (like Date Hired or DEPARTMENT/CAMPAIGN) are missing and need to be filled out by an HR representative.' },
  { categoryId: 'notifications', question: 'What does "IT FIELDS INCOMPLETE" mean?', answer: 'Similar to HR fields, this notification means that required IT-specific fields (such as REMOTE ID, PC Name, or Device Type) are missing from an employee profile and need to be updated by an IT representative.' },

  // Data Formatting (N/A, PINs, etc)
  { categoryId: 'data', question: 'How should I enter data if a field is not applicable?', answer: 'You can enter "N/A" for fields that do not apply to you. The system handles "N/A" properly and will display it correctly without validation errors.' },
  { categoryId: 'data', question: 'How are special characters or symbols like [\'n] handled?', answer: 'The system sanitizes and supports safe special characters. If you encounter formatting issues or unexpected symbols, please ensure there are no unintended invisible characters or contact IT if it persists.' },
  { categoryId: 'data', question: 'What format should DEPARTMENT/CAMPAIGN codes follow?', answer: 'DEPARTMENT/CAMPAIGN codes should follow standard company conventions. Emails must use allowed domains (@bigoutsource.com, @outlook.com, @bigoutsource.ph). Ensure there are no leading or trailing spaces.' },
  { categoryId: 'data', question: 'Why are some columns missing when I export the directory to Excel?', answer: 'The system uses granular permission-based exports. If you do not have specific IT or Payroll capabilities, those highly sensitive columns are automatically stripped from the generated file to ensure data governance.' },
  { categoryId: 'data', question: 'How should I format my Excel file for bulk importing employees?', answer: 'You can click the "Download Template" button in the Directory to get a blank, perfectly formatted .xlsx template file to use for your data ingestion, significantly reducing errors.' },
];

export default function FAQ() {
  const navigate = useNavigate();
  const { user, can } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(c => c.id !== 'users' || can('users.manage' as any));
  }, [user?.role, can]);

  const filteredFAQs = useMemo(() => {
    if (activeCategory === 'all') {
      return FAQ_DATA.filter(faq => faq.categoryId !== 'users' || can('users.manage' as any));
    }
    return FAQ_DATA.filter(faq => faq.categoryId === activeCategory);
  }, [activeCategory, user?.role, can]);

  const activeCategoryLabel = visibleCategories.find(c => c.id === activeCategory)?.label || 'All Industries Combined';

  return (
    <LoginBackground>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to previous page
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <FAQSidebar 
            categories={visibleCategories} 
            activeCategory={activeCategory} 
            onSelectCategory={setActiveCategory} 
          />

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[600px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Top Frequently Asked Questions</h1>
                  <p className="text-sm text-gray-500 mt-2 flex items-center">
                    Active Style: <span className="font-semibold text-blue-600 mx-1">Help Center Hub</span> · Dataset: <span className="font-semibold text-gray-900 ml-1">{activeCategoryLabel}</span>
                  </p>
                </div>
              </div>

              <motion.div 
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map((faq, index) => (
                    <FAQAccordion 
                      key={index}
                      question={faq.question}
                      answer={faq.answer}
                      defaultOpen={index === 0 && filteredFAQs.length < 5}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No FAQs available for this category.
                  </div>
                )}
              </motion.div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </LoginBackground>
  );
}
