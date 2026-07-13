/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { TextSizeProvider } from './contexts/TextSizeContext';
import { AuthProvider } from './contexts/AuthContext';
import React, { Suspense } from 'react';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import { GlobalNotifications } from './components/GlobalNotifications';
import { QueryProvider } from './providers/QueryProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FloatingFAQButton } from './components/FloatingFAQButton';

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Directory = React.lazy(() => import('./pages/Directory'));
const EmployeeProfile = React.lazy(() => import('./pages/EmployeeProfile'));
const Departments = React.lazy(() => import('./pages/Departments'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Login = React.lazy(() => import('./pages/Login'));
const Assets = React.lazy(() => import('./pages/Assets'));
const Reports = React.lazy(() => import('./pages/Reports'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const EmployeeImportReview = React.lazy(() => import('./pages/EmployeeImportReview'));
const FAQ = React.lazy(() => import('./pages/FAQ'));

const PageSpinner = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  return (
    <QueryProvider>
    <AuthProvider>
    <ThemeProvider>
    <TextSizeProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            
            <Route path="/login" element={<Suspense fallback={<PageSpinner />}><Login /></Suspense>} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Suspense fallback={<PageSpinner />}><Dashboard /></Suspense>} />
              <Route element={<ProtectedRoute capability="employees.view" />}>
                <Route path="/directory" element={<Suspense fallback={<PageSpinner />}><Directory /></Suspense>} />
                <Route path="/employee/:id" element={<Suspense fallback={<PageSpinner />}><EmployeeProfile /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute capability="departments.view" />}>
                <Route path="/departments" element={<Suspense fallback={<PageSpinner />}><Departments /></Suspense>} />
              </Route>
              <Route path="/settings" element={<Suspense fallback={<PageSpinner />}><Settings /></Suspense>} />
              <Route element={<ProtectedRoute capability="assets.view" />}>
                <Route path="/assets" element={<Suspense fallback={<PageSpinner />}><Assets /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute capability="reports.view" />}>
                <Route path="/reports" element={<Suspense fallback={<PageSpinner />}><Reports /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute capability="auditlogs.view" />}>
                <Route path="/logs" element={<Suspense fallback={<PageSpinner />}><AuditLogs /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute capability="imports.manage" />}>
                <Route path="/employee-imports/issues" element={<Suspense fallback={<PageSpinner />}><EmployeeImportReview /></Suspense>} />
                <Route path="/employee-imports/:batchId" element={<Suspense fallback={<PageSpinner />}><EmployeeImportReview /></Suspense>} />
              </Route>
              <Route element={<ProtectedRoute capability="users.manage" />}>
                <Route path="/users" element={<Suspense fallback={<PageSpinner />}><UserManagement /></Suspense>} />
              </Route>
              
              <Route path="/faq" element={<Suspense fallback={<PageSpinner />}><FAQ /></Suspense>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
        <Toaster position="bottom-right" />
        <GlobalNotifications />
        <FloatingFAQButton />
      </Router>
    </TextSizeProvider>
    </ThemeProvider>
    </AuthProvider>
    </QueryProvider>
  );
}

