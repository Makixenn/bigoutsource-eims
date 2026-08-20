import { useEffect, useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { FileText, Download, PieChart, BarChart, ShieldAlert, Trash2, Loader2, TrendingUp, ClipboardList, X, Users, ArrowLeft, ChevronRight, CheckCircle2, Columns, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { SkeletonLoadingMessage } from '@/src/components/SkeletonLoadingMessage';
import { cn } from '@/src/lib/utils';
import toast from 'react-hot-toast';
import { employeeService } from '@/src/features/employees/services/employeeService';
import { siteService } from '@/src/services/siteService';
import { auditLogService } from '@/src/features/reports/services/auditLogService';
import { accountService } from '@/src/services/accountService';
import { useAuth } from '@/src/contexts/AuthContext';
import { Capability } from '@/src/lib/permissions';

// ─── Shared utilities ─────────────────────────────────────────────────────────

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function capitalize(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function na(val: any): any {
  return (val === undefined || val === null || String(val).trim() === '') ? 'N/A' : val;
}

function isEmployeeArchived(employee: any) {
  return employee?.isArchived === true || employee?.is_archived === true;
}

function excludeArchivedEmployees(employees: any[]) {
  return employees.filter((employee) => !isEmployeeArchived(employee));
}

function uniqueEmployeesById(employees: any[]) {
  return Array.from(
    employees
      .reduce((map, employee) => {
        const id = String(employee?.id || employee?.employeeId || employee?.employeeNumber || '').trim();
        if (id && !map.has(id)) map.set(id, employee);
        return map;
      }, new Map<string, any>())
      .values()
  );
}

interface SheetDef {
  name: string;
  rows: Record<string, string | number>[];
}

interface ReportData {
  sheets: SheetDef[];
  filename: string;
  message: string;
}

async function buildWorkbook(sheets: SheetDef[], filename: string, format: 'xlsx' | 'csv' = 'xlsx') {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EIMS System';
  workbook.created = new Date();

  for (const { name, rows } of sheets) {
    const sheetName = name.substring(0, 31).replace(/[\[\]\*\\\/\?]/g, '');
    const ws = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    if (rows.length === 0) {
      ws.addRow(['(No records)']);
      continue;
    }

    const keys = Object.keys(rows[0]);
    ws.columns = keys.map((key) => {
      let maxLength = key.length;
      rows.forEach(r => {
        const valLength = String(r[key] ?? '').length;
        if (valLength > maxLength) maxLength = valLength;
      });
      return { header: key, key: key, width: Math.min(maxLength + 2, 50) };
    });

    ws.addRows(rows);

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF111827' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: keys.length }
    };
  }

  let buffer;
  if (format === 'csv') {
    buffer = await workbook.csv.writeBuffer();
    filename = filename.replace('.xlsx', '.csv');
  } else {
    buffer = await workbook.xlsx.writeBuffer();
  }

  const blob = new Blob([buffer], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ─── Report 1: Employee Master List ──────────────────────────────────────────

async function generateEmployeeMasterList(params?: any): Promise<ReportData> {
  const scope = params?.departmentScope || 'all';
  const [employees, accounts] = await Promise.all([
    employeeService.list().then(asArray),
    accountService.list().then(asArray)
  ]);
  
  if (!employees.length) throw new Error('No employee records found.');

  let targetAccounts = accounts;
  if (scope === 'internal') targetAccounts = accounts.filter(a => a.accountType === 'internal');
  else if (scope === 'external') targetAccounts = accounts.filter(a => a.accountType === 'external');
  else if (scope.startsWith('dept_')) {
    const dName = scope.replace('dept_', '');
    targetAccounts = accounts.filter(a => a.name === dName);
  }

  const accountNames = targetAccounts.map(a => a.name);

  const filteredEmployees = employees.filter(e => {
    if (scope === 'all') return true;
    const acc = e.accountAssignment || (e as any).account || '';
    return accountNames.includes(acc);
  });

  if (!filteredEmployees.length) throw new Error('No employee records found for this scope.');

  const rows = filteredEmployees.map((e) => {
    return {
      'Employee ID': na(e.id),
      'Full Name': na(e.fullName),
      'Status': na(capitalize(e.status)),
      'Job Title': na(e.position),
      'Department/Campaign': na(e.accountAssignment),
      'Site': na(e.site),
      'BO Email': na(e.boEmail),
      'Email Password': na(e.emailPassword),
      'LMS Account': na(e.lmsAccount),
      'Phone': na(e.phone),
      'Address': na(e.address),
      'PC Name': na(e.pcName),
      'Remote ID': na(e.rustDeskId),
      'ESET Status': na(capitalize(e.esetStatus)),
      'Activity Watch': na(capitalize(e.activityWatchStatus)),
      'Windows Key': na(e.windowsKey),
      'Disk Encryption Key': na(e.diskEncryptionKey),
      'MAC Addresses': Array.isArray(e.macAddresses) ? e.macAddresses.map((m: any) => `${m.mac} (${m.type})`).join(', ') : 'N/A',
      'BIOS Date': na(e.biosDate),
      'Outlook Email': na(e.outlookEmail),
      'Teams Account': na(e.teamsAccount),
      'Mattermost Account': na(e.mattermostAccount),
      'Birthdate': na(e.birthdate),
      'Date Hired': na(e.dateHired),
      'Float Date': na(e.floatDate),
      'Separation Date': na(e.separationDate),
      'Separation Reason': na(e.separationReason),
      'Archived': e.isArchived ? 'Yes' : 'No',
      'Created': na(formatDate(e.createdAt)),
      'Last Updated': na(formatDate(e.updatedAt)),
    };
  });

  const safeScope = scope.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    sheets: [{ name: 'Employees', rows }],
    filename: `Employee_Master_List_${safeScope}.xlsx`,
    message: `${filteredEmployees.length} employees exported`
  };
}

// ─── Report 2: IT Asset & License Report ─────────────────────────────────────

async function generateITAssetReport(params?: any): Promise<ReportData> {
  const scope = params?.departmentScope || 'all';
  const [allEmployees, accounts] = await Promise.all([
    employeeService.list().then(asArray),
    accountService.list().then(asArray)
  ]);
  const employees = excludeArchivedEmployees(allEmployees);
  
  let targetAccounts = accounts;
  if (scope === 'internal') targetAccounts = accounts.filter(a => a.accountType === 'internal');
  else if (scope === 'external') targetAccounts = accounts.filter(a => a.accountType === 'external');
  else if (scope.startsWith('dept_')) {
    const dName = scope.replace('dept_', '');
    targetAccounts = accounts.filter(a => a.name === dName);
  }

  const accountNames = targetAccounts.map(a => a.name);

  const filteredEmployees = employees.filter(e => {
    if (!e.pcName) return false;
    if (scope === 'all') return true;
    const acc = e.accountAssignment || (e as any).account || '';
    return accountNames.includes(acc);
  });

  if (!filteredEmployees.length) throw new Error('No IT asset records found for this scope.');

  const rows = filteredEmployees.map((e) => ({
    'Employee ID': na(e.id),
    'Full Name': na(e.fullName),
    'Site': na(e.site),
    'PC Name': na(e.pcName),
    'Remote ID': na(e.rustDeskId),
    'Windows Key': na(e.windowsKey),
    'Disk Encryption Key': na(e.diskEncryptionKey),
    'MAC Addresses': Array.isArray(e.macAddresses) ? e.macAddresses.map((m: any) => `${m.mac} (${m.type})`).join(', ') : 'N/A',
    'ESET Status': na(capitalize(e.esetStatus)),
    'Activity Watch': na(capitalize(e.activityWatchStatus)),
  }));

  const safeScope = scope.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    sheets: [{ name: 'IT Assets', rows }],
    filename: `IT_Asset_License_Report_${safeScope}.xlsx`,
    message: `${filteredEmployees.length} devices exported`
  };
}

// ─── Report 3: Security Compliance Audit ─────────────────────────────────────

async function generateSecurityAudit(): Promise<ReportData> {
  const employees = excludeArchivedEmployees(asArray(await employeeService.list()));

  const noEset = employees.filter((e) => String(e.esetStatus ?? '').toLowerCase() !== 'active');
  const noAw = employees.filter((e) => String(e.activityWatchStatus ?? '').toLowerCase() !== 'installed');
  const noKey = employees.filter((e) => !e.windowsKey && e.deviceType !== 'Linux' && e.deviceType !== 'Mac');
  const flagged = employees.filter(
    (e) =>
      String(e.esetStatus ?? '').toLowerCase() !== 'active' ||
      String(e.activityWatchStatus ?? '').toLowerCase() !== 'installed' ||
      (!e.windowsKey && e.deviceType !== 'Linux' && e.deviceType !== 'Mac')
  );

  const summaryRows = [
    { 'Metric': 'Total Employees', 'Count': employees.length },
    { 'Metric': 'Non-Compliant (any issue)', 'Count': flagged.length },
    { 'Metric': 'ESET Inactive', 'Count': noEset.length },
    { 'Metric': 'Activity Watch Missing', 'Count': noAw.length },
    { 'Metric': 'Missing Windows Key', 'Count': noKey.length },
  ];

  const detailRows = flagged.map((e) => {
    const issues: string[] = [];
    if (String(e.esetStatus ?? '').toLowerCase() !== 'active') issues.push('ESET Inactive');
    if (String(e.activityWatchStatus ?? '').toLowerCase() !== 'installed') issues.push('Activity Watch Missing');
    if (!e.windowsKey && e.deviceType !== 'Linux' && e.deviceType !== 'Mac') issues.push('No Windows Key');
    return {
      'Employee ID': na(e.id),
      'Full Name': na(e.fullName),
      'Site': na(e.site),
      'PC Name': na(e.pcName || 'No PC assigned'),
      'Remote ID': na(e.rustDeskId),
      'ESET Status': na(capitalize(e.esetStatus)),
      'Activity Watch': na(capitalize(e.activityWatchStatus)),
      'Windows Key': (e.deviceType === 'Linux' || e.deviceType === 'Mac') ? 'N/A' : (e.windowsKey ? 'Present' : 'Missing'),
      'Issues': na(issues.join('; ')),
    };
  });

  return {
    sheets: [
      { name: 'Summary', rows: summaryRows },
      { name: 'Non-Compliant Devices', rows: detailRows },
    ],
    filename: 'Security_Compliance_Audit.xlsx',
    message: flagged.length
      ? `${flagged.length} non-compliant device${flagged.length > 1 ? 's' : ''} found`
      : 'All devices are compliant'
  };
}

// ─── Report 4: Site Occupancy Report ─────────────────────────────────────────

async function generateSiteOccupancy(): Promise<ReportData> {
  const [allEmployees, sites] = await Promise.all([
    employeeService.list().then(asArray),
    siteService.list().then(asArray),
  ]);
  const employees = excludeArchivedEmployees(allEmployees);

  // Merge known site names from both sources so every site appears even with 0 staff
  const siteNames = Array.from(
    new Set([
      ...sites.map((s: any) => s.name ?? s.id).filter(Boolean),
      ...employees.map((e: any) => e.site).filter(Boolean),
    ])
  ) as string[];

  if (!siteNames.length) throw new Error('No site data available.');

  const total = employees.length || 1;

  const summaryRows = siteNames
    .map((site) => {
      const group = employees.filter((e: any) => e.site === site);
      const active = group.filter((e: any) => String(e.status ?? '').toLowerCase() === 'active').length;
      return {
        'Site': site,
        'Active': active,
        'Inactive': group.length - active,
        'Total': group.length,
        '% of All Staff': `${Math.round((group.length / total) * 100)}%`,
      };
    })
    .sort((a, b) => b['Total'] - a['Total']);

  const sheets: SheetDef[] = [{ name: 'Summary', rows: summaryRows }];

  for (const site of siteNames) {
    const group = employees.filter((e: any) => e.site === site);
    if (!group.length) continue;
    sheets.push({
      name: site,
      rows: group.map((e: any) => ({
        'Employee ID': na(e.id),
        'Full Name': na(e.fullName),
        'Status': na(capitalize(e.status)),
        'Department/Campaign': na(e.accountAssignment),
        'BO Email': na(e.boEmail),
        'PC Name': na(e.pcName),
      })),
    });
  }

  return {
    sheets,
    filename: 'Site_Occupancy_Report.xlsx',
    message: `${siteNames.length} sites, ${employees.length} total employees`
  };
}

// ─── Report 5: Recent Terminations & Archives ────────────────────────────────

async function generateTerminationsReport(): Promise<ReportData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [logs, employees] = await Promise.all([
    auditLogService.list({ entityType: 'employees', limit: 1000 }).then(asArray),
    employeeService.list().then(asArray),
  ]);

  const archivedEmployees = uniqueEmployeesById(employees.filter(isEmployeeArchived));
  const archivedEmployeeIds = new Set(archivedEmployees.map((e: any) => String(e.id || e.employeeId || e.employeeNumber || '')));

  const latestArchiveLogByEmployee = logs
    .filter((log: any) => {
      if (!log.createdAt || new Date(log.createdAt) < thirtyDaysAgo) return false;
      if (!archivedEmployeeIds.has(String(log.entityId || ''))) return false;
      return (log.details?.changes || []).some((change: any) => {
        const field = String(change.field || '').toLowerCase();
        return (field === 'isarchived' || field === 'is_archived') && String(change.to).toLowerCase() === 'true';
      });
    })
    .reduce((map: Map<string, any>, log: any) => {
      const employeeId = String(log.entityId || '');
      const current = map.get(employeeId);
      if (!current || new Date(log.createdAt) > new Date(current.createdAt)) map.set(employeeId, log);
      return map;
    }, new Map<string, any>());

  const archivedRows = archivedEmployees.map((e: any) => {
    const archivedLog = latestArchiveLogByEmployee.get(String(e.id || e.employeeId || e.employeeNumber || ''));
    return {
    'Employee ID': na(e.id),
    'Full Name': na(e.fullName),
    'Status': na(capitalize(e.status)),
    'Job Title': na(e.position),
    'Site': na(e.site),
    'Department/Campaign': na(e.accountAssignment),
    'Archived': 'Yes',
    'Separation Reason': na(e.separationReason),
    'Archived Date': na(formatDate(archivedLog?.createdAt || e.updatedAt)),
    'Archived By': na(archivedLog?.userEmail),
    'Last Updated': na(formatDate(e.updatedAt)),
    };
  });

  const parts: string[] = [];
  if (archivedEmployees.length) parts.push(`${archivedEmployees.length} archived employee${archivedEmployees.length === 1 ? '' : 's'}`);

  return {
    sheets: [
      { name: 'Archived Employees', rows: archivedRows },
    ],
    filename: 'Recent_Terminations_Archives.xlsx',
    message: parts.length ? parts.join(', ') : 'No archived employees found'
  };
}

// ─── Report 6: Workforce Analytics ───────────────────────────────────────────

async function generateWorkforceAnalytics(): Promise<ReportData> {
  const allEmployees = asArray(await employeeService.list());
  const employees = excludeArchivedEmployees(allEmployees);
  
  const active = allEmployees.filter((e) => String(e.status ?? '').toLowerCase() === 'active').length;
  const inactive = allEmployees.filter((e) => {
    const status = String(e.status ?? '').toLowerCase();
    return status === 'inactive' || status === 'terminated' || status === 'offboarding' || status === 'separated' || status === 'floating';
  }).length;
  const turnoverRate = active + inactive > 0 ? ((inactive / (active + inactive)) * 100).toFixed(1) + '%' : '0.0%';

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHiresCount = employees.filter(emp => {
    const joinedAt = emp.dateHired || emp.date_hired;
    return joinedAt && new Date(joinedAt) >= thirtyDaysAgo;
  }).length;

  const kpiRows = [
    { 'Metric': 'Total Personnel', 'Value': employees.length },
    { 'Metric': 'Active Personnel', 'Value': active },
    { 'Metric': 'Turnover Rate', 'Value': turnoverRate },
    { 'Metric': 'New Hires (Last 30 Days)', 'Value': recentHiresCount },
  ];

  const deptCounts = new Map<string, number>();
  employees.forEach(emp => {
    if (String(emp.status ?? '').toLowerCase() === 'active' && emp.department) {
      deptCounts.set(emp.department, (deptCounts.get(emp.department) || 0) + 1);
    }
  });
  const deptRows = Array.from(deptCounts.entries()).map(([name, count]) => ({
    'Department/Campaign': name,
    'Active Employees': count
  })).sort((a, b) => b['Active Employees'] - a['Active Employees']);

  const siteCounts = new Map<string, number>();
  employees.forEach(emp => {
    if (String(emp.status ?? '').toLowerCase() === 'active') {
      let siteName = emp.site || 'Unassigned';
      if (siteName === 'HQ') siteName = 'HQ';
      siteCounts.set(siteName, (siteCounts.get(siteName) || 0) + 1);
    }
  });
  const siteRows = Array.from(siteCounts.entries()).map(([site, count]) => ({
    'Site / Office': site,
    'Active Employees': count
  })).sort((a, b) => b['Active Employees'] - a['Active Employees']);

  const months = new Map<string, number>();
  const sortedEmployees = [...employees]
    .filter(e => e.dateHired || e.date_hired || e.createdAt || e.created_at)
    .sort((a, b) => new Date(a.dateHired || a.date_hired || a.createdAt || a.created_at).getTime() - new Date(b.dateHired || b.date_hired || b.createdAt || b.created_at).getTime());
  
  let cumulative = 0;
  sortedEmployees.forEach(emp => {
    const date = new Date(emp.dateHired || emp.date_hired || emp.createdAt || emp.created_at);
    const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date);
    cumulative++;
    months.set(monthYear, cumulative);
  });
  const growthRows = Array.from(months.entries()).map(([month, count]) => ({
    'Month': month,
    'Total Employees (Cumulative)': count
  }));

  return {
    sheets: [
      { name: 'KPI Summary', rows: kpiRows },
      { name: 'Department Distribution', rows: deptRows },
      { name: 'Site Distribution', rows: siteRows },
      { name: 'Growth Trend', rows: growthRows }
    ],
    filename: 'Workforce_Analytics.xlsx',
    message: 'Workforce analytics exported'
  };
}

// ─── Report 7: Audit History ─────────────────────────────────────────────────

async function generateAuditHistory(params?: any): Promise<ReportData> {
  const scope = params?.departmentScope || 'all';
  const [logs, accounts, allEmployees] = await Promise.all([
    auditLogService.list({ limit: 5000 }).then(asArray),
    accountService.list().then(asArray),
    employeeService.list().then(asArray)
  ]);
  const employees = excludeArchivedEmployees(allEmployees);
  const archivedEmployeeIds = new Set(
    allEmployees
      .filter(isEmployeeArchived)
      .map((employee) => String(employee.id || employee.employeeId || employee.employeeNumber || ''))
      .filter(Boolean)
  );

  let filteredLogs = logs.filter((log) => {
    const entityType = String(log.entityType || '').toLowerCase();
    if (entityType !== 'employees' && entityType !== 'employee') return true;
    return !archivedEmployeeIds.has(String(log.entityId || ''));
  });
  if (scope !== 'all') {
    let targetAccounts = accounts;
    if (scope === 'internal') targetAccounts = accounts.filter(a => a.accountType === 'internal');
    else if (scope === 'external') targetAccounts = accounts.filter(a => a.accountType === 'external');
    else if (scope.startsWith('dept_')) {
      const dName = scope.replace('dept_', '');
      targetAccounts = accounts.filter(a => a.name === dName);
    }
    const accountNames = targetAccounts.map(a => a.name);
    
    const validEmails = new Set(
      employees
        .filter(e => accountNames.includes(e.accountAssignment || (e as any).account || ''))
        .map(e => e.boEmail)
        .filter(Boolean)
    );
    
    filteredLogs = logs.filter(log => validEmails.has(log.userEmail));
  }

  if (!filteredLogs.length) throw new Error('No audit log records found for this scope.');

  const rows = filteredLogs.map((log: any) => ({
    'Date & Time': formatDate(log.createdAt),
    'Action': capitalize(log.action ?? '').replace(/_/g, ' '),
    'Target Entity': log.entityLabel || log.entityId || log.entityType || 'System',
    'Entity Type': capitalize(log.entityType ?? ''),
    'Performed By': log.userEmail ?? 'System',
    'Role': capitalize(log.userRole ?? ''),
    'Details': typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details ?? ''),
    'IP Address': log.ipAddress ?? '',
  }));

  const safeScope = scope.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    sheets: [{ name: 'Audit History', rows }],
    filename: `Audit_History_${safeScope}.xlsx`,
    message: `${filteredLogs.length} audit logs exported`
  };
}

// ─── Report 8: Department Roster ─────────────────────────────────────────────

async function generateDepartmentRoster(params?: any): Promise<ReportData> {
  const scope = params?.departmentScope || 'all';
  
  const [allEmployees, accounts] = await Promise.all([
    employeeService.list().then(asArray),
    accountService.list().then(asArray)
  ]);
  const employees = excludeArchivedEmployees(allEmployees);

  let targetAccounts = accounts;
  if (scope === 'internal') targetAccounts = accounts.filter(a => a.accountType === 'internal');
  else if (scope === 'external') targetAccounts = accounts.filter(a => a.accountType === 'external');
  else if (scope.startsWith('dept_')) {
    const dName = scope.replace('dept_', '');
    targetAccounts = accounts.filter(a => a.name === dName);
  }

  const accountNames = targetAccounts.map(a => a.name);

  const filteredEmployees = employees.filter(e => {
    const acc = e.accountAssignment || (e as any).account || '';
    return accountNames.includes(acc) && String(e.status ?? '').toLowerCase() === 'active';
  });

  const rows = filteredEmployees.map(e => ({
    'Employee ID': na(e.id),
    'Full Name': na(e.fullName),
    'Status': na(capitalize(e.status)),
    'Job Title': na(e.position),
    'Department/Campaign': na(e.accountAssignment),
    'Site': na(e.site),
    'BO Email': na(e.boEmail),
  }));

  const safeScope = scope.replace(/[^a-zA-Z0-9]/g, '_');
  
  return {
    sheets: [{ name: 'Department Roster', rows }],
    filename: `Department_Roster_${safeScope}.xlsx`,
    message: `${filteredEmployees.length} active employees exported`
  };
}

// ─── Report 8: Employee Evaluations ────────────────────────────────────────────

async function generateEvaluationReport(params?: any): Promise<ReportData> {
  const scope = params?.departmentScope || 'all';
  const [allEmployees, accounts] = await Promise.all([
    employeeService.list().then(asArray),
    accountService.list().then(asArray)
  ]);
  const employees = allEmployees.filter(e => !e.isArchived);
  
  let targetAccounts = accounts;
  if (scope === 'internal') targetAccounts = accounts.filter(a => a.accountType === 'internal');
  else if (scope === 'external') targetAccounts = accounts.filter(a => a.accountType === 'external');
  else if (scope.startsWith('dept_')) {
    const dName = scope.replace('dept_', '');
    targetAccounts = accounts.filter(a => a.name === dName);
  }

  const accountNames = targetAccounts.map(a => a.name);

  const filteredEmployees = employees.filter(e => {
    if (scope === 'all') return true;
    const acc = e.accountAssignment || (e as any).account || '';
    return accountNames.includes(acc);
  });

  if (!filteredEmployees.length) throw new Error('No employee records found for this scope.');

  const rows = filteredEmployees.map((e) => ({
    'Employee ID': na(e.id),
    'Full Name': na(e.fullName),
    'Position': na(e.position),
    'Department/Campaign': na(e.accountAssignment),
    'Site': na(e.site),
    'Employee Status': na(capitalize(e.employeeStatus)),
    'Sex': na(capitalize(e.sex)),
    'Civil Status': na(capitalize(e.civilStatus)),
    'Date Hired': na(e.dateHired),
    '1st Month Eval': na(e.evalFirstMonth),
    '3rd Month Eval': na(e.evalThirdMonth),
    '5th Month Eval': na(e.evalFifthMonth),
    '6th Month Eval': na(e.evalSixthMonth),
    'Anniversary Eval': na(e.evalAnniversary)
  }));

  const safeScope = scope.replace(/[^a-zA-Z0-9]/g, '_');
  return {
    sheets: [{ name: 'Evaluations', rows }],
    filename: `Employee_Evaluations_Report_${safeScope}.xlsx`,
    message: `${filteredEmployees.length} employee evaluation records exported`
  };
}

// ─── Report definitions ───────────────────────────────────────────────────────

type ReportDef = {
  title: string;
  desc: string;
  icon: any;
  color: string;
  generate: (params?: any) => Promise<ReportData>;
  requiresDepartmentScope?: boolean;
  requiredExportCapability: Capability;
};

const REPORTS: ReportDef[] = [
  {
    title: 'Employee Master List',
    desc: 'Complete overview of all personnel, credentials, and hardware assignments.',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white',
    generate: generateEmployeeMasterList,
    requiresDepartmentScope: true,
    requiredExportCapability: 'reports.export.master_list',
  },
  {
    title: 'Workforce Analytics',
    desc: 'Comprehensive statistics on company growth, turnover, and distribution.',
    icon: TrendingUp,
    color: 'text-cyan-600 bg-cyan-50 border-cyan-100 group-hover:bg-cyan-600 group-hover:border-cyan-600 group-hover:text-white',
    generate: generateWorkforceAnalytics,
    requiredExportCapability: 'reports.export.analytics',
  },
  {
    title: 'Department Roster',
    desc: 'List of active employees filtered by department or account type.',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white',
    generate: generateDepartmentRoster,
    requiresDepartmentScope: true,
    requiredExportCapability: 'reports.export.department_roster',
  },
  {
    title: 'IT Asset & License Report',
    desc: 'Detailed mapping of PCs, Windows license keys, and remote IDs.',
    icon: PieChart,
    color: 'text-purple-600 bg-purple-50 border-purple-100 group-hover:bg-purple-600 group-hover:border-purple-600 group-hover:text-white',
    generate: generateITAssetReport,
    requiresDepartmentScope: true,
    requiredExportCapability: 'reports.export.it_asset',
  },
  {
    title: 'Site Occupancy Report',
    desc: 'Breakdown of personnel distribution across all physical sites.',
    icon: BarChart,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:border-emerald-600 group-hover:text-white',
    generate: generateSiteOccupancy,
    requiredExportCapability: 'reports.export.site_occupancy',
  },
  {
    title: 'Security Compliance Audit',
    desc: 'List of devices missing ESET or Activity Watch software.',
    icon: ShieldAlert,
    color: 'text-red-600 bg-red-50 border-red-100 group-hover:bg-red-600 group-hover:border-red-600 group-hover:text-white',
    generate: generateSecurityAudit,
    requiredExportCapability: 'reports.export.security_audit',
  },
  {
    title: 'Recent Terminations & Archives',
    desc: 'Audit trail for off-boarding activities over the last 30 days.',
    icon: Trash2,
    color: 'text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white',
    generate: generateTerminationsReport,
    requiredExportCapability: 'reports.export.terminations',
  },
  {
    title: 'System Audit History',
    desc: 'Full historical log of all system activities, changes, and access.',
    icon: ClipboardList,
    color: 'text-slate-600 bg-slate-50 border-slate-100 group-hover:bg-slate-600 group-hover:border-slate-600 group-hover:text-white',
    generate: generateAuditHistory,
    requiresDepartmentScope: true,
    requiredExportCapability: 'reports.export.system_audit',
  },
  {
    title: 'Employee Evaluations Report',
    desc: 'Extract tracking dates for all 1st Month, 3rd Month, 5th Month, 6th Month, and Anniversary evaluations.',
    icon: CalendarCheck,
    color: 'text-orange-600 bg-orange-50 border-orange-100 group-hover:bg-orange-600 group-hover:border-orange-600 group-hover:text-white',
    generate: generateEvaluationReport,
    requiresDepartmentScope: true,
    requiredExportCapability: 'reports.export.evaluations',
  }
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const { can, refreshUser } = useAuth();
  const canViewDepartments = can('departments.view');
  const [generating, setGenerating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<typeof REPORTS[number] | null>(null);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv' | null>(null);
  const [departments, setDepartments] = useState<{ id: string, name: string, type: string }[]>([]);
  const [departmentScope, setDepartmentScope] = useState('all');
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [lastReport, setLastReport] = useState<{ report: ReportDef, scope: string } | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  const filteredPreviewData = useMemo(() => {
    if (!previewData) return null;
    return {
      ...previewData,
      sheets: previewData.sheets.map(sheet => ({
        ...sheet,
        rows: sheet.rows.map(row => {
          const newRow: Record<string, string | number> = {};
          Object.keys(row).forEach(key => {
            if (selectedColumns.includes(key)) {
              newRow[key] = row[key];
            }
          });
          return newRow;
        })
      }))
    };
  }, [previewData, selectedColumns]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    if (!canViewDepartments) {
      setDepartments([]);
      return () => clearTimeout(timer);
    }

    accountService.list().then(res => {
      setDepartments(asArray(res).map(d => ({
        id: d.id || '',
        name: d.name || '',
        type: d.accountType || d.account_type || 'external'
      })));
    }).catch(() => setDepartments([]));
    return () => clearTimeout(timer);
  }, [canViewDepartments]);

  async function hasFreshExportPermission() {
    const freshUser = await refreshUser();
    const allowed = Boolean(freshUser?.capabilities?.includes('reports.export'));
    if (!allowed) toast.error("You don't have permission to export reports.");
    return allowed;
  }

  async function handleDownload(format: 'xlsx' | 'csv') {
    if (!selectedReport || generating) return;
    if (!(await hasFreshExportPermission())) {
      setSelectedReport(null);
      return;
    }
    setGenerating(selectedReport.title);
    const report = selectedReport;
    const scope = departmentScope;
    
    const toastId = toast.loading(`Generating preview for ${report.title}…`);
    try {
      const data = await report.generate({ departmentScope: scope });
      
      // Generation succeeded, now close the modal and show preview
      setSelectedReport(null);
      setLastReport({ report, scope });
      
      const uniqueKeys = new Set<string>();
      data.sheets.forEach(sheet => {
        sheet.rows.forEach(row => {
          Object.keys(row).forEach(key => uniqueKeys.add(key));
        });
      });
      setSelectedColumns(Array.from(uniqueKeys));
      setPreviewData(data);
      setSelectedFormat(format);
      toast.success('Preview generated', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message ?? `Failed to generate ${report.title}`, { id: toastId });
      // We don't close the modal here, so the user can try a different scope!
    } finally {
      setGenerating(null);
    }
  }

  async function confirmDownload() {
    if (!filteredPreviewData || !selectedFormat) return;
    if (!(await hasFreshExportPermission())) {
      setPreviewData(null);
      setSelectedFormat(null);
      setLastReport(null);
      return;
    }
    try {
      await buildWorkbook(filteredPreviewData.sheets, filteredPreviewData.filename, selectedFormat);
      toast.success(filteredPreviewData.message);
    } catch (err: any) {
      toast.error('Failed to download file');
    } finally {
      setPreviewData(null);
      setSelectedFormat(null);
      setLastReport(null);
    }
  }

  function goBackToOptions() {
    if (lastReport) {
      setSelectedReport(lastReport.report);
      setDepartmentScope(lastReport.scope);
    }
    setPreviewData(null);
    setSelectedFormat(null);
  }

  return (
    <PageLayout title="Analytical Reports">
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div key="skeleton-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative">
            {[...Array(REPORTS.length)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm animate-pulse flex flex-col h-full min-h-[290px]">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200"></div>
                  <div className="w-16 h-6 rounded-lg bg-gray-200"></div>
                </div>
                <div className="w-3/4 h-6 rounded bg-gray-200 mb-3"></div>
                <div className="w-full h-4 rounded bg-gray-200 mb-2"></div>
                <div className="w-2/3 h-4 rounded bg-gray-200 mb-8"></div>
                <div className="w-full h-11 rounded-xl bg-gray-200 mt-auto"></div>
              </div>
            ))}
            <SkeletonLoadingMessage message="Preparing report templates..." />
          </motion.div>
        ) : (
          <motion.div key="content-reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {REPORTS.filter(report => can(report.requiredExportCapability)).map((report, index) => {
              const isGenerating = generating === report.title;
              const isDisabled = generating !== null;

              return (
                <motion.div
                  key={report.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 380, damping: 30 }}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-2xl transition-all duration-300 border ${report.color}`}>
                      <report.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[0.625rem] font-black uppercase px-2 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#6B7280] tracking-widest">
                      XLSX / CSV
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-[#111827] mb-2">{report.title}</h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed mb-8 flex-1">{report.desc}</p>

                  <button
                    onClick={() => setSelectedReport(report)}
                    disabled={isDisabled}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] hover:bg-[#111827] hover:text-white dark:hover:bg-white dark:hover:text-[#111827] dark:hover:border-white transition-all shadow-sm group-hover:border-[#111827] disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating…' : 'Generate & Download'}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) { setSelectedReport(null); setIsDepartmentDropdownOpen(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden"
            >
              <div className="flex items-start gap-4 border-b border-[#F3F4F6] px-6 py-5 bg-[#F9FAFB]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                  <Download className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#111827]">Export Format</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                    Select a format to download <strong>{selectedReport.title}</strong>
                  </p>
                </div>
              </div>

              {selectedReport.requiresDepartmentScope && (
                <div className="px-6 pb-4">
                  <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase tracking-widest">Department Scope</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDepartmentDropdownOpen((current) => !current)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm font-bold text-[#4B5563] outline-none transition-all hover:border-[#CBD5E1] focus:ring-2 focus:ring-[#111827]',
                        'border-[#E5E7EB]'
                      )}
                    >
                      <span className="truncate">
                        {departmentScope === 'all' && 'All Departments'}
                        {departmentScope === 'internal' && 'Internal Only'}
                        {departmentScope === 'external' && 'External Only'}
                        {departmentScope.startsWith('dept_') && departmentScope.replace('dept_', '')}
                      </span>
                      <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform', isDepartmentDropdownOpen && 'rotate-90')} />
                    </button>
                    <AnimatePresence>
                      {isDepartmentDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl shadow-[#11182714]"
                        >
                        <div className="max-h-64 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => { setDepartmentScope('all'); setIsDepartmentDropdownOpen(false); }}
                            className="flex w-full items-center justify-between gap-3 border-b border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-bold text-[#111827] transition-all hover:bg-[#F9FAFB]"
                          >
                            <span className="truncate">All Departments</span>
                            {departmentScope === 'all' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDepartmentScope('internal'); setIsDepartmentDropdownOpen(false); }}
                            className="flex w-full items-center justify-between gap-3 border-b border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-bold text-[#111827] transition-all hover:bg-[#F9FAFB]"
                          >
                            <span className="truncate">Internal Only</span>
                            {departmentScope === 'internal' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDepartmentScope('external'); setIsDepartmentDropdownOpen(false); }}
                            className="flex w-full items-center justify-between gap-3 border-b border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-bold text-[#111827] transition-all hover:bg-[#F9FAFB]"
                          >
                            <span className="truncate">External Only</span>
                            {departmentScope === 'external' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                          </button>

                          {departments.some(d => d.type === 'internal') && (
                            <div className="border-b border-[#F3F4F6] last:border-b-0">
                              <div className="sticky top-0 bg-[#F9FAFB] px-3 py-2 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
                                Specific Internal
                              </div>
                              {departments.filter(d => d.type === 'internal').map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => { setDepartmentScope(`dept_${d.name}`); setIsDepartmentDropdownOpen(false); }}
                                  className="flex w-full items-center justify-between gap-3 border-t border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-bold text-[#111827] transition-all hover:bg-[#F9FAFB]"
                                >
                                  <span className="truncate">{d.name}</span>
                                  {departmentScope === `dept_${d.name}` && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {departments.some(d => d.type === 'external') && (
                            <div className="border-b border-[#F3F4F6] last:border-b-0">
                              <div className="sticky top-0 bg-[#F9FAFB] px-3 py-2 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
                                Specific External
                              </div>
                              {departments.filter(d => d.type === 'external').map(d => (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => { setDepartmentScope(`dept_${d.name}`); setIsDepartmentDropdownOpen(false); }}
                                  className="flex w-full items-center justify-between gap-3 border-t border-[#F3F4F6] px-3 py-2.5 text-left text-sm font-bold text-[#111827] transition-all hover:bg-[#F9FAFB]"
                                >
                                  <span className="truncate">{d.name}</span>
                                  {departmentScope === `dept_${d.name}` && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <div className="p-6 pt-2 space-y-3">
                {can('reports.export') ? (
                  <>
                    <button
                      onClick={() => handleDownload('xlsx')}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] hover:border-[#111827] hover:bg-[#F9FAFB] transition-all group"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-[#111827]">Excel Workbook (.xlsx)</span>
                        <span className="text-xs text-[#6B7280] mt-0.5">Includes multiple sheets and formatting</span>
                      </div>
                      <FileText className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#111827]" />
                    </button>
                    <button
                      onClick={() => handleDownload('csv')}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-[#E5E7EB] hover:border-[#111827] hover:bg-[#F9FAFB] transition-all group"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-[#111827]">CSV Document (.csv)</span>
                        <span className="text-xs text-[#6B7280] mt-0.5">Plain text format, primary sheet only</span>
                      </div>
                      <FileText className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#111827]" />
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 text-center text-sm font-bold text-[#6B7280]">
                    You don't have permission to export reports.
                  </div>
                )}
              </div>

              <div className="border-t border-[#F3F4F6] px-6 py-4 bg-[#F9FAFB] flex justify-end">
                <button
                  onClick={() => { setSelectedReport(null); setIsDepartmentDropdownOpen(false); }}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewData && selectedFormat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) { setPreviewData(null); setSelectedFormat(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-5xl rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-start gap-4 border-b border-[#F3F4F6] px-6 py-5 bg-[#F9FAFB]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-[#111827]">Data Preview</h3>
                  <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                    Previewing the first 10 rows of <strong>{previewData.filename.replace('.xlsx', selectedFormat === 'csv' ? '.csv' : '.xlsx')}</strong>
                  </p>
                </div>
                <button
                  onClick={() => { setPreviewData(null); setSelectedFormat(null); }}
                  className="p-2 text-[#9CA3AF] hover:text-[#111827] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-auto flex-1">
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <button
                      onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all shadow-sm w-max"
                    >
                      <Columns className="w-4 h-4 text-[#6B7280]" />
                      Customize Columns
                      <span className="bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded-md text-xs">{selectedColumns.length} Selected</span>
                      <ChevronRight className={cn('w-4 h-4 text-[#9CA3AF] transition-transform ml-1', isColumnPickerOpen && 'rotate-90')} />
                    </button>
                    
                    <AnimatePresence>
                      {isColumnPickerOpen && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3"
                        >
                          <button
                            onClick={() => {
                              const commonFieldNames = ['Employee ID', 'Full Name', 'First Name', 'Last Name', 'Status', 'Job Title', 'Department/Campaign', 'Department', 'Account', 'AccountAssignment', 'Site', 'BO Email'];
                              const itFieldNames = ['PC Name', 'Remote ID', 'ESET Status', 'Activity Watch', 'Windows Key', 'BIOS Date', 'Outlook Email', 'Google Account', 'Teams Account', 'Mattermost Account', 'LMS Account', 'MAC Addresses'];
                              const secretFieldNames = ['Email Password', 'Disk Encryption Key'];
                              
                              const canViewHr = can('reports.export.hr');
                              const canViewIt = can('reports.export.it');
                              const canViewSecrets = can('reports.export.secrets');

                              const allKeys = new Set<string>();
                              previewData.sheets.forEach(sheet => sheet.rows.forEach(row => Object.keys(row).forEach(k => allKeys.add(k))));
                              
                              const allowedKeys = Array.from(allKeys).filter(col => {
                                if (commonFieldNames.includes(col)) return true;
                                if (itFieldNames.includes(col)) return canViewIt;
                                if (secretFieldNames.includes(col)) return canViewSecrets;
                                return canViewHr;
                              });
                              
                              setSelectedColumns(allowedKeys);
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedColumns([])}
                            className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Deselect All
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <AnimatePresence>
                    {isColumnPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] space-y-6">
                          {(() => {
                            const commonFieldNames = ['Employee ID', 'Full Name', 'First Name', 'Last Name', 'Status', 'Job Title', 'Department/Campaign', 'Department', 'Account', 'AccountAssignment', 'Site', 'BO Email'];
                            const itFieldNames = ['PC Name', 'Remote ID', 'ESET Status', 'Activity Watch', 'Windows Key', 'BIOS Date', 'Outlook Email', 'Google Account', 'Teams Account', 'Mattermost Account', 'LMS Account', 'MAC Addresses'];
                            const secretFieldNames = ['Email Password', 'Disk Encryption Key'];

                            const canViewHr = can('reports.export.hr');
                            const canViewIt = can('reports.export.it');
                            const canViewSecrets = can('reports.export.secrets');

                            const allAvailableColumns = Array.from(new Set(previewData.sheets.flatMap(s => s.rows.flatMap(r => Object.keys(r)))));
                            
                            const commonColumns = allAvailableColumns.filter(c => commonFieldNames.includes(c));
                            const itColumns = allAvailableColumns.filter(c => itFieldNames.includes(c));
                            const secretColumns = allAvailableColumns.filter(c => secretFieldNames.includes(c));
                            const hrColumns = allAvailableColumns.filter(c => !commonFieldNames.includes(c) && !itFieldNames.includes(c) && !secretFieldNames.includes(c));

                            const renderColumnButton = (col: string) => {
                              const isSelected = selectedColumns.includes(col);
                              return (
                                <button
                                  key={col}
                                  onClick={() => {
                                    if (isSelected) setSelectedColumns(selectedColumns.filter(c => c !== col));
                                    else setSelectedColumns([...selectedColumns, col]);
                                  }}
                                  className={cn(
                                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left group",
                                    isSelected 
                                      ? "bg-[#111827] border-[#111827] text-white shadow-md shadow-gray-900/10" 
                                      : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-gray-50 hover:shadow-sm"
                                  )}
                                >
                                  <div className={cn(
                                    "flex items-center justify-center w-5 h-5 rounded-full border transition-colors shrink-0",
                                    isSelected ? "bg-white border-white" : "border-[#D1D5DB] group-hover:border-[#9CA3AF] bg-white"
                                  )}>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#111827]" />}
                                  </div>
                                  <span className="truncate">{col}</span>
                                </button>
                              );
                            };

                            return (
                              <>
                                {commonColumns.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest mb-3 px-1">COMMON INFORMATION</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {commonColumns.map(renderColumnButton)}
                                    </div>
                                  </div>
                                )}
                                {canViewHr && hrColumns.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest mb-3 px-1">HR INFORMATION</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {hrColumns.map(renderColumnButton)}
                                    </div>
                                  </div>
                                )}
                                {canViewIt && itColumns.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest mb-3 px-1">IT INFORMATION</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {itColumns.map(renderColumnButton)}
                                    </div>
                                  </div>
                                )}
                                {canViewSecrets && secretColumns.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-black text-[#9CA3AF] uppercase tracking-widest mb-3 px-1">SECRETS</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {secretColumns.map(renderColumnButton)}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {filteredPreviewData && filteredPreviewData.sheets.length > 0 && filteredPreviewData.sheets[0].rows.length > 0 && Object.keys(filteredPreviewData.sheets[0].rows[0]).length > 0 ? (
                  <div className="rounded-xl border border-[#E5E7EB] overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#4B5563] min-w-max">
                      <thead className="bg-[#F9FAFB] text-xs uppercase text-[#6B7280] font-black tracking-widest border-b border-[#E5E7EB]">
                        <tr>
                          {Object.keys(filteredPreviewData.sheets[0].rows[0]).map(key => (
                            <th key={key} className="px-4 py-3 whitespace-nowrap">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB] bg-white">
                        {filteredPreviewData.sheets[0].rows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="hover:bg-[#F9FAFB] transition-colors">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-4 py-3 whitespace-nowrap max-w-xs truncate" title={String(val)}>{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-[#6B7280] text-sm font-semibold">No columns selected or no data available for preview.</div>
                )}
                
                {filteredPreviewData && filteredPreviewData.sheets.length > 0 && filteredPreviewData.sheets[0].rows.length > 10 && (
                  <p className="mt-4 text-xs font-semibold text-center text-[#9CA3AF]">
                    Showing 10 of {filteredPreviewData.sheets[0].rows.length} total rows in this sheet.
                  </p>
                )}
              </div>

              <div className="border-t border-[#F3F4F6] px-6 py-4 bg-[#F9FAFB] flex justify-between items-center">
                <button
                  onClick={goBackToOptions}
                  className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setPreviewData(null); setSelectedFormat(null); setLastReport(null); }}
                    className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6] transition-all"
                  >
                    Cancel
                  </button>
                  {can('reports.export') && (
                  <button
                    onClick={confirmDownload}
                    disabled={!previewData?.sheets.some(s => s.rows.length > 0)}
                    className="px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#374151] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Confirm & Download
                  </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageLayout>
  );
}
