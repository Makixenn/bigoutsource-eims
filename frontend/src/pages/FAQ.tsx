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
  
  // User Management
  { categoryId: 'users', question: 'What are the different roles and their permissions?', answer: 'The system has 5 roles: Super Admin (full access including User Management), Admin (full operational access except User Management), HR Admin (manages HR fields, departments, and reports), IT Admin (manages IT fields, passwords, REMOTE IDs, and hardware assets), and Viewer (read-only access to directory and departments).' },
  { categoryId: 'users', question: 'How do I manage user roles and permissions?', answer: 'Super Admins can assign or change employee roles from the User Management page. Each role automatically grants specific system capabilities based on the secure access matrix.' },
  { categoryId: 'users', question: 'How do I disable a user account?', answer: 'If an employee leaves, an admin can change their status to "disabled" in User Management. This immediately revokes their ability to log in while preserving their historical audit data.' },

  // Dashboard & Navigation
  { categoryId: 'dashboard', question: 'What information is on the main Dashboard?', answer: 'The dashboard provides a quick overview of your profile status, recent notifications, and quick links depending on your role permissions.' },
  { categoryId: 'dashboard', question: 'How do I return to the Dashboard from other pages?', answer: 'You can always click the company logo or "Dashboard" link in the main navigation sidebar on the left side of your screen.' },

  // Profile & Employee Data
  { categoryId: 'profile', question: 'How do I update my EMPLOYEE INFORMATION?', answer: 'Navigate to your Employee Profile and click "Edit". Be sure to check the DEPARTMENT/CAMPAIGN section. Some critical fields might require HR approval before the changes become permanent.' },
  { categoryId: 'profile', question: 'Can I view the history of changes made to my profile?', answer: 'Yes, if you have the appropriate permissions, you can view the Audit History on the employee profile page to see what was changed, when, and by whom.' },
  { categoryId: 'profile', question: 'What is a REMOTE ID?', answer: 'A REMOTE ID is your unique identifier for remote access tools (previously referred to as RustDesk ID). It is stored securely in your profile.' },

  // Notifications
  { categoryId: 'notifications', question: 'Where can I see my notifications?', answer: 'Notifications will appear as a popup (Toaster) on the bottom right of the screen for real-time alerts. Important alerts will also show up in the top navigation bell icon.' },
  { categoryId: 'notifications', question: 'What does "HR FIELDS INCOMPLETE" mean?', answer: 'This notification means that required fields in your HR profile (like Date Hired or DEPARTMENT/CAMPAIGN) are missing and need to be filled out by an HR representative.' },

  // Data Formatting (N/A, PINs, etc)
  { categoryId: 'data', question: 'How should I enter data if a field is not applicable?', answer: 'You can enter "N/A" for fields that do not apply to you. The system handles "N/A" properly and will display it correctly without validation errors.' },
  { categoryId: 'data', question: 'How are special characters or symbols like [\'n] handled?', answer: 'The system sanitizes and supports safe special characters. If you encounter formatting issues or unexpected symbols, please ensure there are no unintended invisible characters or contact IT if it persists.' },
  { categoryId: 'data', question: 'What format should DEPARTMENT/CAMPAIGN codes follow?', answer: 'DEPARTMENT/CAMPAIGN codes should follow standard company conventions. Emails must use allowed domains (@bigoutsource.com, @outlook.com, @bigoutsource.ph). Ensure there are no leading or trailing spaces.' },
];

export default function FAQ() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(c => c.id !== 'users' || user?.role === 'super_admin');
  }, [user?.role]);

  const filteredFAQs = useMemo(() => {
    if (activeCategory === 'all') {
      return FAQ_DATA.filter(faq => faq.categoryId !== 'users' || user?.role === 'super_admin');
    }
    return FAQ_DATA.filter(faq => faq.categoryId === activeCategory);
  }, [activeCategory, user?.role]);

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
