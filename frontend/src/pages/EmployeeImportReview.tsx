import { useEffect, useMemo, useState, useRef } from 'react';
import type { ReactNode, ElementType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Edit,
  Loader2,
  Merge,
  Trash2,
  UploadCloud,
  XCircle,
  Briefcase,
  Laptop,
  ShieldCheck,
  Phone,
  ChevronRight,
  X,
  Save,
  Building2,
  AlertTriangle,
  CalendarDays,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { cn } from '@/src/lib/utils';
import { employeeImportService } from '@/src/features/imports/services/employeeImportService';
import { accountService } from '@/src/services/accountService';

type ImportRow = {
  id: string;
  importBatchId: string;
  sourceRow: number;
  normalizedData: Record<string, any>;
  existingData?: Record<string, any>;
  issues: Array<{ code: string; message: string; severity?: 'warning' | 'info' }>;
  status: 'ready' | 'issue' | 'imported' | 'skipped';
  duplicateKey?: string;
};

type DuplicateGroupInfo = {
  key: string;
  importBatchId: string;
  duplicateKey: string;
  rows: ImportRow[];
};

type AccountOption = {
  id: string;
  name: string;
};

type DepartmentType = 'internal' | 'external';

type DepartmentRecord = {
  id: string;
  name: string;
  code: string;
  type: DepartmentType;
};

type PendingDepartment = {
  name: string;
  type: DepartmentType;
  code: string;
};

type DeleteIntent = {
  title: string;
  detail: string;
  phrase: string;
  ids: string[];
};

const siteOptions = ['HQ', 'Candelaria', 'WFH', 'Hybrid'];

function suggestDepartmentCode(name = ''): string {
  const clean = name.trim().replace(/[^a-zA-Z]/g, '').toLowerCase();
  return clean.charAt(0);
}

function sanitizeDepartmentCode(value = ''): string {
  return value.toLowerCase().replace(/[^a-z\/]/g, '').slice(0, 4);
}

function isValidDepartmentCode(code: string): boolean {
  return /^[a-z]{1,4}$/.test(code) || code === 'n/a';
}

const importReviewCache: {
  rows: ImportRow[];
  focusedBatchId: string;
  activeView: 'ready' | 'issues' | 'duplicates';
  hasLoaded: boolean;
} = {
  rows: [],
  focusedBatchId: '',
  activeView: 'issues',
  hasLoaded: false,
};

const fieldLabels: Array<[string, string]> = [
  ['employeeNumber', 'ID'],
  ['fullName', 'Name'],
  ['nickname', 'Nickname'],
  ['accountAssignment', 'Department/Campaign'],
  ['position', 'Position'],
  ['status', 'Status'],
  ['dateHired', 'Date Hired'],
  ['siteName', 'Site'],
  ['phone', 'Phone'],
  ['address', 'Address'],
  ['sex', 'Sex'],
  ['civilStatus', 'Civil Status'],
  ['boEmail', 'BO Email'],
  ['personalEmail', 'Personal Email'],
  ['emailPassword', 'Email Password'],
  ['lmsAccount', 'LMS Account'],
  ['mattermostAccount', 'Mattermost'],
  ['pcName', 'PC Name'],
  ['rustdeskId', 'Remote ID'],
  ['esetStatus', 'ESET'],
  ['biosDate', 'BIOS Date'],
  ['activityWatchStatus', 'Activity Watch'],
  ['windowsKey', 'Windows Key'],
  ['sssNo', 'SSS No'],
  ['tinNo', 'TIN No'],
  ['philhealthNo', 'PhilHealth No'],
  ['pagibigNo', 'Pag-IBIG No'],
  ['bdoAccountNo', 'BDO Account'],
  ['emergencyContactName', 'Emergency Contact Name'],
  ['emergencyContactNo', 'Emergency Contact No'],
  ['idIssuance', 'ID Issuance'],
  ['hoodieIssuance', 'Hoodie Issuance'],
  ['hmoEnrollment', 'HMO Enrollment'],
  ['hmoMemberCode', 'HMO Code'],
  ['eval1stMonth', '1st Month Eval'],
  ['eval3rdMonth', '3rd Month Eval'],
  ['eval5thMonth', '5th Month Eval'],
  ['eval6thMonth', '6th Month Eval'],
  ['evalAnniversary', 'Anniversary Eval'],
  ['is_archived', 'Archived'],
];

function completenessForData(data: Record<string, any> = {}) {
  return fieldLabels.reduce((count, [key]) => {
    const value = data?.[key];
    if (typeof value === 'boolean') return count + 1;
    return value ? count + 1 : count;
  }, 0);
}

function completeness(row: ImportRow) {
  const mergedData = row.existingData ? { ...row.existingData, ...row.normalizedData } : row.normalizedData;
  return completenessForData(mergedData);
}

function updatedFieldsText(row: ImportRow) {
  if (!row.existingData) return '';
  const changes: string[] = [];
  for (const [key, label] of fieldLabels) {
    const existingVal = row.existingData[key];
    const incomingVal = row.normalizedData[key];
    const isEmpty = existingVal === null || existingVal === undefined || existingVal === '';
    
    if (incomingVal && isEmpty) {
      changes.push(`${label}: (empty) -> ${incomingVal}`);
    }
  }
  if (changes.length === 0) return 'No new fields will be added.';
  return changes.join('\n');
}

function blockingIssues(row: ImportRow) {
  return (row.issues || []).filter((issue) => issue.severity !== 'warning' && issue.severity !== 'info');
}

function rowWarnings(row: ImportRow) {
  return (row.issues || []).filter((issue) => issue.severity === 'warning');
}

function rowInfos(row: ImportRow) {
  return (row.issues || []).filter((issue) => issue.severity === 'info');
}

function issueText(row: ImportRow) {
  const blocking = blockingIssues(row);
  return blocking.length ? blocking.map((issue) => issue.message).join(', ') : 'Needs review';
}

function infoText(row: ImportRow) {
  return rowInfos(row).map((issue) => issue.message).join(', ');
}

function warningText(row: ImportRow) {
  return rowWarnings(row).map((issue) => issue.message).join(', ');
}

function normalizeSiteOption(value?: string) {
  const next = String(value || '').trim().toLowerCase();
  if (next === 'can' || next === 'cand' || next === 'candelaria') return 'Candelaria';
  if (next === 'wfh/hybrid' || next === 'hybrid') return 'Hybrid';
  if (next === 'hq' || next === 'san pablo' || next === 'san pablo city' || next === 'san pablo (hq)' || next === 'san pablo city (hq)') return 'HQ';
  if (next === 'wfh') return 'WFH';
  return value || '';
}

function normalizeFormOptions(data: Record<string, any>) {
  return {
    ...data,
    siteName: normalizeSiteOption(data.siteName),
  };
}

function mergeDefaults(rows: ImportRow[]) {
  const sorted = [...rows].sort((a, b) => completeness(b) - completeness(a));
  const merged = { ...sorted[0]?.normalizedData };

  sorted.slice(1).forEach((row) => {
    fieldLabels.forEach(([key]) => {
      if ((merged[key] === undefined || merged[key] === null || merged[key] === '') && row.normalizedData?.[key]) {
        merged[key] = row.normalizedData[key];
      }
    });
  });

  return normalizeFormOptions(merged);
}

export default function EmployeeImportReview() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ImportRow[]>(() => importReviewCache.rows);
  const [isLoading, setIsLoading] = useState(() => !importReviewCache.hasLoaded);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [isSavingMerge, setIsSavingMerge] = useState(false);
  const [isDeletingRows, setIsDeletingRows] = useState(false);
  const [editingRow, setEditingRow] = useState<ImportRow | null>(null);
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroupInfo | null>(null);
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [mergeForm, setMergeForm] = useState<Record<string, any>>({});
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [pendingDepartments, setPendingDepartments] = useState<PendingDepartment[] | null>(null);
  const [isResolvingDepts, setIsResolvingDepts] = useState(false);
  const [focusedBatchId, setFocusedBatchId] = useState(() => importReviewCache.focusedBatchId);
  const [activeView, setActiveView] = useState<'ready' | 'issues' | 'duplicates'>(() => importReviewCache.activeView);

  async function loadRows() {
    if (!importReviewCache.hasLoaded) setIsLoading(true);
    try {
      let targetBatchId = batchId || focusedBatchId;
      let result = await employeeImportService.list(targetBatchId ? { importBatchId: targetBatchId } : { status: 'pending' });

      const hasActionableRows = Array.isArray(result.rows) && result.rows.some(
        (row) => row.status === 'ready' || row.status === 'issue'
      );

      // If the cached batch has no actionable rows left, auto-advance to the next pending batch
      if (targetBatchId && !batchId && !hasActionableRows) {
        targetBatchId = '';
        importReviewCache.focusedBatchId = '';
        setFocusedBatchId('');
        result = await employeeImportService.list({ status: 'pending' });
      }

      if (!targetBatchId) {
        const pendingRows = Array.isArray(result.rows) ? result.rows : [];
        const nextBatchId = pendingRows[0]?.importBatchId;

        if (nextBatchId) {
          result = await employeeImportService.list({ importBatchId: nextBatchId });
          importReviewCache.focusedBatchId = nextBatchId;
          setFocusedBatchId(nextBatchId);
        }
      }

      const nextRows = Array.isArray(result.rows) ? result.rows : [];
      importReviewCache.rows = nextRows;
      importReviewCache.focusedBatchId = targetBatchId || importReviewCache.focusedBatchId;
      importReviewCache.hasLoaded = true;
      setRows(nextRows);
    } catch (error: any) {
      toast.error(error.message || 'Unable to load import review');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [batchId, focusedBatchId]);

  useEffect(() => {
    importReviewCache.activeView = activeView;
  }, [activeView]);

  useEffect(() => {
    let isMounted = true;

    accountService.list()
      .then((value) => {
        const valid = Array.isArray(value)
          ? value.filter((account: any) => account?.id && account?.name)
          : [];
        const accountOptions = valid.map((account: any) => ({ id: account.id, name: account.name }));
        const departmentRecords: DepartmentRecord[] = valid.map((account: any) => ({
          id: account.id,
          name: account.name,
          code: account.departmentCode || account.department_code || '',
          type: (account.accountType || account.account_type) === 'internal' ? 'internal' : 'external',
        }));

        if (isMounted) {
          setAccounts(accountOptions);
          setDepartments(departmentRecords);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccounts([]);
          setDepartments([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const readyRows = rows.filter((row) => row.status === 'ready');
  const issueRows = rows.filter((row) => row.status === 'issue');
  const importedRows = rows.filter((row) => row.status === 'imported');
  const duplicateGroups = useMemo(() => {
    const groups = new Map<string, ImportRow[]>();
    rows
      .filter((row) => row.status === 'issue' && row.duplicateKey)
      .forEach((row) => {
        const key = `${row.importBatchId}:${row.duplicateKey}`;
        groups.set(key, [...(groups.get(key) || []), row]);
      });

    return [...groups.entries()].map(([key, items]): DuplicateGroupInfo => ({
      key,
      importBatchId: items[0].importBatchId,
      duplicateKey: items[0].duplicateKey!,
      rows: items,
    }));
  }, [rows]);

  const visibleIssueRows = issueRows.filter((row) => !row.duplicateKey);
  const duplicateRows = duplicateGroups.flatMap((group) => group.rows);

  const requestDeleteRows = (intent: DeleteIntent) => {
    if (!intent.ids.length) return;
    setDeleteIntent(intent);
  };

  const deleteRows = async () => {
    if (!deleteIntent) return;

    setIsDeletingRows(true);
    try {
      const result = await employeeImportService.deleteRows(deleteIntent.ids);
      toast.success(`${result.deleted || 0} staging record${result.deleted === 1 ? '' : 's'} deleted`);
      setDeleteIntent(null);
      await loadRows();
    } catch (error: any) {
      toast.error(error.message || 'Unable to delete staging records');
    } finally {
      setIsDeletingRows(false);
    }
  };

  const runImport = async (targetBatchId: string, newDepartments: PendingDepartment[] = []) => {
    setIsImporting(true);
    try {
      const result = await employeeImportService.importReady(targetBatchId, newDepartments);
      const importedCount = result.imported || 0;
      const deptCount = result.departmentsCreated || 0;
      toast.success(
        `${importedCount} employee record${importedCount === 1 ? '' : 's'} imported`
        + (deptCount ? ` · ${deptCount} department${deptCount === 1 ? '' : 's'} created` : '')
      );

      // Register newly created departments locally so a follow-up import in this
      // session won't re-prompt for the same departments.
      if (newDepartments.length) {
        const additions = newDepartments.map((dept) => ({
          id: `dept:${dept.name.toLowerCase()}`,
          name: dept.name,
          code: dept.code,
          type: dept.type,
        }));
        setDepartments((prev) => {
          const existing = new Set(prev.map((dept) => dept.name.trim().toLowerCase()));
          return [...prev, ...additions.filter((dept) => !existing.has(dept.name.trim().toLowerCase()))];
        });
        setAccounts((prev) => {
          const existing = new Set(prev.map((account) => account.name.trim().toLowerCase()));
          return [
            ...prev,
            ...additions
              .filter((dept) => !existing.has(dept.name.trim().toLowerCase()))
              .map((dept) => ({ id: dept.id, name: dept.name })),
          ];
        });
      }

      await loadRows();
      navigate('/directory');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Unable to import ready records');
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const importReady = async () => {
    const targetBatchId = batchId || rows[0]?.importBatchId;
    if (!targetBatchId) return;

    // Detect department/account names on the ready rows that don't exist yet,
    // deduplicated by name (case-insensitive) so each unknown department appears once.
    const existingNames = new Set(departments.map((dept) => dept.name.trim().toLowerCase()));
    const missing = new Map<string, string>();

    readyRows.forEach((row) => {
      const name = String(row.normalizedData?.accountAssignment || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!existingNames.has(key) && !missing.has(key)) {
        missing.set(key, name);
      }
    });

    if (missing.size > 0) {
      // Block the import until every unknown department is created.
      setPendingDepartments(
        [...missing.values()].map((name) => ({
          name,
          type: 'internal',
          code: suggestDepartmentCode(name),
        }))
      );
      return;
    }

    await runImport(targetBatchId);
  };

  const updatePendingDepartment = (index: number, patch: Partial<PendingDepartment>) => {
    setPendingDepartments((current) => {
      if (!current) return current;
      return current.map((dept, i) => (i === index ? { ...dept, ...patch } : dept));
    });
  };

  const createPendingDepartments = async () => {
    if (!pendingDepartments?.length) return;
    const targetBatchId = batchId || rows[0]?.importBatchId;
    if (!targetBatchId) return;

    setIsResolvingDepts(true);
    try {
      // Departments are created server-side as part of the import (authorized by
      // imports.manage), so importers without departments.edit can resolve them.
      const ok = await runImport(targetBatchId, pendingDepartments);
      if (ok) setPendingDepartments(null);
    } finally {
      setIsResolvingDepts(false);
    }
  };

  const resolveDuplicate = async (
    importBatchId: string,
    duplicateKey: string,
    action: 'keep' | 'merge',
    keepRowId?: string,
    normalizedData?: Record<string, any>
  ) => {
    try {
      const result = await employeeImportService.resolveDuplicate({ importBatchId, duplicateKey, action, keepRowId, normalizedData });
      const refreshed = await employeeImportService.list({ importBatchId });
      const keptRow = Array.isArray(result.rows)
        ? result.rows.find((row: ImportRow) => row.status === 'ready' || row.status === 'issue')
        : null;

      const nextRows = Array.isArray(refreshed.rows) ? refreshed.rows : [];
      importReviewCache.focusedBatchId = importBatchId;
      importReviewCache.rows = nextRows;
      importReviewCache.hasLoaded = true;
      setFocusedBatchId(importBatchId);
      setRows(nextRows);

      if (keptRow?.status === 'ready') {
        toast.success(`${action === 'merge' ? 'Merged row' : 'Selected row'} moved to Ready. Click Import Ready Records to add it to Employee Records.`);
      } else {
        const reason = keptRow?.issues?.map((issue: any) => issue.message).join(', ') || 'remaining issues';
        toast(`${action === 'merge' ? 'Merged row' : 'Selected row'} still needs review: ${reason}`, { icon: '⚠️' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to resolve duplicate');
      throw error;
    }
  };

  const openEditor = (row: ImportRow) => {
    setEditingRow(row);
    setEditForm(normalizeFormOptions({ ...row.normalizedData }));
  };

  const updateEditForm = (field: string, value: string | boolean) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const openMergeModal = (group: DuplicateGroupInfo) => {
    setMergeGroup(group);
    setMergeForm(mergeDefaults(group.rows));
  };

  const updateMergeForm = (field: string, value: string | boolean) => {
    setMergeForm((current) => ({ ...current, [field]: value }));
  };

  const saveMergedRow = async () => {
    if (!mergeGroup) return;

    setIsSavingMerge(true);
    try {
      await resolveDuplicate(mergeGroup.importBatchId, mergeGroup.duplicateKey, 'merge', undefined, mergeForm);
      setMergeGroup(null);
      setMergeForm({});
    } finally {
      setIsSavingMerge(false);
    }
  };

  const saveEditedRow = async () => {
    if (!editingRow) return;

    setIsSavingRow(true);
    try {
      const updated = await employeeImportService.updateRow(editingRow.id, editForm);
      setFocusedBatchId(updated.importBatchId);
      const refreshed = await employeeImportService.list({ importBatchId: updated.importBatchId });
      const nextRows = Array.isArray(refreshed.rows) ? refreshed.rows : [];
      importReviewCache.focusedBatchId = updated.importBatchId;
      importReviewCache.rows = nextRows;
      importReviewCache.hasLoaded = true;
      setRows(nextRows);
      setEditingRow(null);
      setEditForm({});
      if (updated.status === 'ready') {
        toast.success('Row fixed and moved to Ready');
      } else {
        toast('Row saved, but still needs review', { icon: '⚠️' });
      }
    } catch (error: any) {
      toast.error(error.message || 'Unable to save import row');
    } finally {
      setIsSavingRow(false);
    }
  };

  return (
    <PageLayout title="Import Review" contentClassName="w-full max-w-none" backFallback="/directory">
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric label="Ready" value={readyRows.length} tone="green" />
          <Metric label="Issues" value={visibleIssueRows.length} tone="red" />
          <Metric label="Duplicates" value={duplicateRows.length} tone="amber" />
          <Metric label="Imported" value={importedRows.length} tone="gray" />
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 shrink-0">
            <Tab active={activeView === 'issues'} onClick={() => setActiveView('issues')}>Issues</Tab>
            <Tab active={activeView === 'duplicates'} onClick={() => setActiveView('duplicates')}>Duplicates</Tab>
            <Tab active={activeView === 'ready'} onClick={() => setActiveView('ready')}>Ready</Tab>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-4 flex-1 xl:justify-end">
            <p className="max-w-xl text-xs font-bold leading-relaxed text-[#6B7280] xl:text-right">
              Keep and Merge only resolve staged rows. Nothing goes into Employee Records until you click Import Ready Records.
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
            {activeView === 'issues' && (
              <BulkDeleteButton
                disabled={!visibleIssueRows.length}
                onClick={() => requestDeleteRows({
                  title: 'Delete All Issue Records',
                  detail: `This will permanently delete ${visibleIssueRows.length} non-duplicate issue staging record${visibleIssueRows.length === 1 ? '' : 's'} from the database.`,
                  phrase: 'DELETE ISSUE RECORDS',
                  ids: visibleIssueRows.map((row) => row.id),
                })}
              >
                Delete All Issues
              </BulkDeleteButton>
            )}
            {activeView === 'duplicates' && (
              <BulkDeleteButton
                disabled={!duplicateRows.length}
                onClick={() => requestDeleteRows({
                  title: 'Delete All Duplicate Records',
                  detail: `This will permanently delete ${duplicateRows.length} duplicate staging record${duplicateRows.length === 1 ? '' : 's'} from the database.`,
                  phrase: 'DELETE DUPLICATE RECORDS',
                  ids: duplicateRows.map((row) => row.id),
                })}
              >
                Delete All Duplicates
              </BulkDeleteButton>
            )}
            {activeView === 'ready' && (
              <BulkDeleteButton
                disabled={!readyRows.length}
                onClick={() => requestDeleteRows({
                  title: 'Delete All Ready Records',
                  detail: `This will permanently delete ${readyRows.length} ready-to-import staging record${readyRows.length === 1 ? '' : 's'} from the database.`,
                  phrase: 'DELETE READY RECORDS',
                  ids: readyRows.map((row) => row.id),
                })}
              >
                Delete All Ready
              </BulkDeleteButton>
            )}
            <button
              type="button"
              onClick={importReady}
              disabled={!readyRows.length || isImporting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-[#11182720] transition-all hover:bg-[#374151] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Import Ready Records
            </button>
          </div>
        </div>
      </div>

        <>
          {isLoading ? (
            <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm w-full">
              <table className="w-full min-w-[920px] text-left border-collapse">
                <thead className="bg-[#F9FAFB] [&_th:first-child]:rounded-tl-2xl [&_th:last-child]:rounded-tr-2xl">
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Status</th>
                    <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Row</th>
                    <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Employee</th>
                    <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Issues</th>
                    <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]"></th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child_td:first-child]:rounded-bl-2xl [&_tr:last-child_td:last-child]:rounded-br-2xl">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-[#F3F4F6] last:border-0">
                      <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-200 rounded-lg"></div></td>
                      <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-200 rounded"></div></td>
                      <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 rounded"></div></td>
                      <td className="px-4 py-3"><div className="h-4 w-48 bg-gray-200 rounded"></div></td>
                      <td className="px-4 py-3"><div className="h-9 w-20 bg-gray-200 rounded-lg ml-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col gap-0 w-full">
              {activeView === 'duplicates' && (
                <div className="space-y-5">
                  {duplicateGroups.length ? (
                    duplicateGroups.map((group) => (
                      <DuplicateGroup
                        key={group.key}
                        importBatchId={group.importBatchId}
                        groupKey={group.duplicateKey}
                        rows={group.rows}
                        onResolve={resolveDuplicate}
                        onMerge={() => openMergeModal(group)}
                        onDelete={(ids, label) => requestDeleteRows({
                          title: 'Delete Duplicate Records',
                          detail: `This will permanently delete ${ids.length} duplicate staging record${ids.length === 1 ? '' : 's'} for ${label} from the database.`,
                          phrase: 'DELETE DUPLICATES',
                          ids,
                        })}
                        onEdit={openEditor}
                      />
                    ))
                  ) : (
                    <EmptyState title="No duplicate issues" detail="Duplicate employee IDs will appear here after staging." />
                  )}
                </div>
              )}
    
              {activeView === 'issues' && (
                <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm mt-0">
                  {visibleIssueRows.length ? (
                    <IssueTable
                      rows={visibleIssueRows}
                      onEdit={openEditor}
                      onDelete={(row) => requestDeleteRows({
                        title: 'Delete Import Staging Record',
                        detail: `This will permanently delete staging row ${row.sourceRow} from the database.`,
                        phrase: 'DELETE IMPORT ROW',
                        ids: [row.id],
                      })}
                    />
                  ) : (
                    <EmptyState title="No non-duplicate issues" detail="Blank IDs, missing required fields, and database errors appear here." />
                  )}
                </div>
              )}
    
              {activeView === 'ready' && (
                <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-sm mt-0">
                  {readyRows.length ? (
                    <IssueTable
                      rows={readyRows}
                      ready
                      onEdit={openEditor}
                      onDelete={(row) => requestDeleteRows({
                        title: 'Delete Ready Import Record',
                        detail: `This will permanently delete ready staging row ${row.sourceRow} from the database.`,
                        phrase: 'DELETE IMPORT ROW',
                        ids: [row.id],
                      })}
                    />
                  ) : (
                    <EmptyState title="No ready rows" detail="Resolve issues to move rows into the ready list." />
                  )}
                </div>
              )}
            </div>
          )}
        </>
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-12 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F3F4F6]">
              <Loader2 className="h-8 w-8 animate-spin text-[#9CA3AF]" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">
              Loading import data...
            </h3>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingRow && (
          <EditRowModal
            row={editingRow}
            form={editForm}
            accounts={accounts}
            isSaving={isSavingRow}
            onChange={updateEditForm}
            onClose={() => {
              if (isSavingRow) return;
              setEditingRow(null);
              setEditForm({});
            }}
            onSave={saveEditedRow}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mergeGroup && (
          <MergeRowsModal
            group={mergeGroup}
            form={mergeForm}
            accounts={accounts}
            isSaving={isSavingMerge}
            onChange={updateMergeForm}
            onClose={() => {
              if (isSavingMerge) return;
              setMergeGroup(null);
              setMergeForm({});
            }}
            onSave={saveMergedRow}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteIntent && (
          <ConfirmDeleteModal
            intent={deleteIntent}
            isDeleting={isDeletingRows}
            onClose={() => {
              if (!isDeletingRows) setDeleteIntent(null);
            }}
            onConfirm={deleteRows}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDepartments && (
          <ResolveDepartmentsModal
            departments={pendingDepartments}
            existingCodes={new Set(departments.map((dept) => dept.code.trim().toLowerCase()).filter(Boolean))}
            isSaving={isResolvingDepts}
            onChange={updatePendingDepartment}
            onClose={() => {
              if (!isResolvingDepts) setPendingDepartments(null);
            }}
            onSubmit={createPendingDepartments}
          />
        )}
      </AnimatePresence>
    </PageLayout>
  );
}

function BulkDeleteButton({ children, disabled, onClick }: { children: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mr-auto inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#E5E7EB] disabled:text-[#D1D5DB]"
    >
      <Trash2 className="h-4 w-4" />
      {children}
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' | 'amber' | 'gray' }) {
  const tones = {
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    gray: 'bg-[#F3F4F6] text-[#374151]',
  };

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <p className="text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">{label}</p>
      <p className={cn('mt-3 w-fit rounded-xl px-3 py-1 text-2xl font-black', tones[tone])}>{value}</p>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl border px-4 py-2 text-sm font-black transition-all',
        active ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:text-[#111827]'
      )}
    >
      {children}
    </button>
  );
}

function DuplicateGroup({
  groupKey,
  importBatchId,
  rows,
  onResolve,
  onMerge,
  onDelete,
  onEdit,
}: {
  importBatchId: string;
  groupKey: string;
  rows: ImportRow[];
  onResolve: (importBatchId: string, duplicateKey: string, action: 'keep' | 'merge', keepRowId?: string) => void;
  onMerge: () => void;
  onDelete: (ids: string[], label: string) => void;
  onEdit: (row: ImportRow) => void;
}) {
  const maxCompleteness = Math.max(...rows.map(completeness));
  const moreCompleteRows = rows.filter((row) => completeness(row) === maxCompleteness);

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#111827]">Duplicate ID: {groupKey}</p>
          <p className="mt-1 text-xs font-bold text-[#6B7280]">Compare rows side by side, keep one, or merge non-empty fields.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onDelete(rows.map((row) => row.id), groupKey)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-600 transition-all hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Group
          </button>
          <button
            type="button"
            onClick={onMerge}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-black text-[#4B5563] transition-all hover:text-[#111827]"
          >
            <Merge className="h-4 w-4" />
            Merge
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {rows.map((row) => {
          const score = completeness(row);
          const isMoreComplete = moreCompleteRows.length === 1 && score === maxCompleteness;

          return (
            <div key={row.id} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#9CA3AF]">Spreadsheet row {row.sourceRow}</p>
                  <p className="mt-1 text-sm font-black text-[#111827]">{score}/{fieldLabels.length} fields filled</p>
                </div>
                {isMoreComplete && (
                  <span className="rounded-lg bg-green-50 px-2 py-1 text-[0.625rem] font-black uppercase text-green-700">
                    More complete
                  </span>
                )}
              </div>
              <FieldGrid row={row} />
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => onResolve(importBatchId, groupKey, 'keep', row.id)}
                  className="w-full rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-black text-white transition-all hover:bg-[#374151]"
                >
                  Keep This One
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-black text-[#4B5563] transition-all hover:bg-[#F9FAFB] hover:text-[#111827]"
                >
                  Edit Row
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MergeRowsModal({
  group,
  form,
  accounts,
  isSaving,
  onChange,
  onClose,
  onSave,
}: {
  group: DuplicateGroupInfo;
  form: Record<string, any>;
  accounts: AccountOption[];
  isSaving: boolean;
  onChange: (field: string, value: string | boolean) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const leftRow = group.rows[0];
  const rightRow = group.rows[1] || group.rows[0];
  const mergedCompleteness = completenessForData(form);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-[#111827]">Merge Duplicate ID {group.duplicateKey}</h2>
            <p className="mt-1 text-xs font-bold text-[#6B7280]">
              Compare the duplicate rows and manually choose the final values in the middle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-[#9CA3AF] transition-all hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,1.15fr)_minmax(0,1fr)]">
          <ComparePanel title={`Row ${leftRow.sourceRow}`} row={leftRow} />
          <div className="rounded-2xl border border-[#111827] bg-white p-4 shadow-lg shadow-[#11182714]">
            <div className="mb-4">
              <p className="text-sm font-black text-[#111827]">Final Merged Record</p>
              <p className="mt-1 text-xs font-bold text-[#6B7280]">Edit these values before saving the merge.</p>
              <p className="mt-1 text-xs font-black text-[#6B7280]">
                Merged result: {mergedCompleteness}/{fieldLabels.length} fields filled
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="ID" required>
                <Input value={form.employeeNumber || ''} onChange={(value) => onChange('employeeNumber', value)} />
              </Field>
              <Field label="Name" required>
                <Input value={form.fullName || ''} onChange={(value) => onChange('fullName', value)} />
              </Field>
              <SelectDropdown
                label="Account"
                value={form.accountAssignment || ''}
                options={accounts.map(acc => ({ id: acc.name, name: acc.name }))}
                onSelect={(val) => onChange('accountAssignment', val)}
                required
                placeholder="Select account"
              />
              <Field label="Bigoutsource Email" required>
                <Input value={form.boEmail || ''} onChange={(value) => onChange('boEmail', value)} />
              </Field>
              <SelectDropdown
                label="Site"
                value={form.siteName || ''}
                options={siteOptions.map(site => ({ id: site, name: site }))}
                onSelect={(val) => onChange('siteName', val)}
                required
                placeholder="Select site"
              />
              <SelectDropdown
                label="Status"
                value={form.status || 'active'}
                options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
                onSelect={(val) => onChange('status', val)}
              />
              <Field label="Phone">
                <Input value={form.phone || ''} onChange={(value) => onChange('phone', value)} />
              </Field>
              <Field label="Address">
                <Input value={form.address || ''} onChange={(value) => onChange('address', value)} />
              </Field>
              <Field label="Email Password">
                <Input value={form.emailPassword || ''} onChange={(value) => onChange('emailPassword', value)} />
              </Field>
              <Field label="LMS Account">
                <Input value={form.lmsAccount || ''} onChange={(value) => onChange('lmsAccount', value)} />
              </Field>
              <Field label="PC Name">
                <Input value={form.pcName || ''} onChange={(value) => onChange('pcName', value)} />
              </Field>
              <Field label="Remote ID">
                <Input value={form.rustdeskId || ''} onChange={(value) => onChange('rustdeskId', value)} />
              </Field>
              <SelectDropdown
                label="ESET"
                value={form.esetStatus || 'inactive'}
                options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
                onSelect={(val) => onChange('esetStatus', val)}
              />
              <Field label="BIOS Date">
                <Input type="date" value={form.biosDate || ''} onChange={(value) => onChange('biosDate', value)} />
              </Field>
              <SelectDropdown
                label="Activity Watch"
                value={form.activityWatchStatus || 'missing'}
                options={[{ id: 'installed', name: 'Installed' }, { id: 'missing', name: 'Missing' }]}
                onSelect={(val) => onChange('activityWatchStatus', val)}
              />
              <Field label="Windows Key">
                <Input value={form.windowsKey || ''} onChange={(value) => onChange('windowsKey', value)} />
              </Field>
              <Field label="Date Hired">
                <Input type="date" value={form.dateHired || ''} onChange={(value) => onChange('dateHired', value)} />
              </Field>
              <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 hover:bg-[#F3F4F6] transition-colors cursor-pointer shadow-xs">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_archived)}
                  onChange={(event) => onChange('is_archived', event.target.checked)}
                  className="h-4 w-4 accent-[#111827] rounded cursor-pointer"
                />
                <span className="text-xs font-black uppercase tracking-widest text-[#4B5563]">Archived</span>
              </label>
            </div>
          </div>
          <ComparePanel title={`Row ${rightRow.sourceRow}`} row={rightRow} />
        </div>

        {group.rows.length > 2 && (
          <p className="border-t border-[#E5E7EB] px-6 py-3 text-xs font-bold text-[#6B7280]">
            This duplicate group has {group.rows.length} rows. The center form was prefilled from all rows, while the side-by-side view shows the first two.
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#4B5563] transition-all hover:text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white transition-all hover:bg-[#374151] disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Merged Record
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ComparePanel({ title, row }: { title: string; row: ImportRow }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#111827]">{title}</p>
          <p className="mt-1 text-xs font-bold text-[#6B7280]">{completeness(row)}/{fieldLabels.length} fields filled</p>
        </div>
      </div>
      <FieldGrid row={row} />
    </div>
  );
}

function FieldGrid({ row }: { row: ImportRow }) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {fieldLabels.map(([key, label]) => (
        <div key={key} className="min-w-0 rounded-lg bg-white px-3 py-2">
          <p className="text-[0.625rem] font-black uppercase text-[#9CA3AF]">{label}</p>
          <p className="truncate text-xs font-bold text-[#111827]">{String(row.normalizedData?.[key] ?? '') || '-'}</p>
        </div>
      ))}
    </div>
  );
}

function IssueTable({
  rows,
  ready = false,
  onEdit,
  onDelete,
}: {
  rows: ImportRow[];
  ready?: boolean;
  onEdit: (row: ImportRow) => void;
  onDelete: (row: ImportRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left">
        <thead className="bg-[#F9FAFB] [&_th:first-child]:rounded-tl-2xl [&_th:last-child]:rounded-tr-2xl">
          <tr>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Row</th>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">ID</th>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Name</th>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Email</th>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Status</th>
            <th className="px-4 py-3 text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">{ready ? 'Completeness' : 'Issue'}</th>
            <th className="px-4 py-3 text-right text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Actions</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child_td:first-child]:rounded-bl-2xl [&_tr:last-child_td:last-child]:rounded-br-2xl">
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[#F3F4F6] last:border-0">
              <td className="px-4 py-3 text-sm font-bold text-[#111827]">{row.sourceRow}</td>
              <td className="px-4 py-3 text-sm font-bold text-[#111827]">{row.normalizedData.employeeNumber || '-'}</td>
              <td className="px-4 py-3 text-sm font-bold text-[#111827]">{row.normalizedData.fullName || '-'}</td>
              <td className="px-4 py-3 text-sm font-bold text-[#111827]">{row.normalizedData.boEmail || '-'}</td>
              <td className="px-4 py-3 text-sm font-bold text-[#111827]">
                {row.normalizedData.status || '-'}{row.normalizedData.is_archived ? ' / archived' : ''}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-[#4B5563]">
                <div className="flex flex-col items-start gap-1.5">
                  <div className="flex items-center gap-2">
                    <span>{ready ? `${completeness(row)}/${fieldLabels.length}` : issueText(row)}</span>
                    {ready && rowInfos(row).some(i => i.code === 'existing_id') && (
                      <div className="group relative inline-flex">
                        <span className="cursor-help rounded-md bg-gray-100 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-200">
                          Updates Existing
                        </span>
                        <div className="absolute right-full top-1/2 z-[100] mr-2 flex w-max max-w-[280px] -translate-y-1/2 items-center pointer-events-none opacity-0 translate-x-1 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
                          <div className="rounded-lg bg-[#111827] px-3 py-2 text-left text-[0.625rem] font-medium leading-relaxed text-white shadow-xl whitespace-pre-wrap">
                            <p className="mb-1 font-bold text-gray-300">Incoming Updates:</p>
                            {updatedFieldsText(row)}
                          </div>
                          <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-[#111827]" />
                        </div>
                      </div>
                    )}
                  </div>
                  {ready && (
                    <div className="mt-0.5 h-1 w-full max-w-[60px] overflow-visible rounded-full bg-gray-100">
                      <div className={cn("h-full rounded-full transition-all duration-500", completeness(row) === fieldLabels.length ? "bg-green-500" : "bg-amber-400")} style={{ width: `${(completeness(row) / fieldLabels.length) * 100}%` }} />
                    </div>
                  )}
                  {rowWarnings(row).length > 0 && <WarningChip text={warningText(row)} />}
                  {rowInfos(row).length > 0 && !ready && <WarningChip text={infoText(row)} />}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-black text-[#4B5563] transition-all hover:text-[#111827]"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-600 transition-all hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResolveDepartmentsModal({
  departments,
  existingCodes,
  isSaving,
  onChange,
  onClose,
  onSubmit,
}: {
  departments: PendingDepartment[];
  existingCodes: Set<string>;
  isSaving: boolean;
  onChange: (index: number, patch: Partial<PendingDepartment>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const codeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    departments.forEach((dept) => {
      const code = dept.code.trim().toLowerCase();
      if (code) counts.set(code, (counts.get(code) || 0) + 1);
    });
    return counts;
  }, [departments]);

  const errors = departments.map((dept) => {
    const code = dept.code.trim().toLowerCase();
    if (!isValidDepartmentCode(code)) return 'Code must be 1-4 lowercase letters or n/a';
    if (code !== 'n/a' && existingCodes.has(code)) return 'Code already used by another department';
    if (code !== 'n/a' && (codeCounts.get(code) || 0) > 1) return 'Duplicate code in this list';
    return '';
  });

  const allValid = departments.length > 0 && errors.every((error) => !error);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#111827]">New Departments Detected</h2>
              <p className="mt-1 text-xs font-bold leading-relaxed text-[#6B7280]">
                {departments.length} department{departments.length === 1 ? '' : 's'} on the ready records {departments.length === 1 ? 'is' : 'are'} not in the system yet.
                Choose a type and code for each before importing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-[#9CA3AF] transition-all hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto px-6 py-5">
          {departments.map((dept, index) => (
            <div key={dept.name} className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Department</p>
                  <p className="truncate text-sm font-black text-[#111827]">{dept.name}</p>
                </div>
                <div className="flex rounded-xl border border-[#E5E7EB] bg-white p-1">
                  {(['internal', 'external'] as DepartmentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onChange(index, { type })}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all',
                        dept.type === type ? 'bg-[#111827] text-white' : 'text-[#9CA3AF] hover:text-[#111827]'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1.5">
                <span className="text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">Department Code</span>
                <input
                  value={dept.code}
                  onChange={(event) => onChange(index, { code: sanitizeDepartmentCode(event.target.value) })}
                  disabled={isSaving}
                  placeholder="e.g. acc"
                  className={cn(
                    'w-full max-w-[10rem] rounded-xl border bg-white px-3 py-2 text-sm font-bold uppercase tracking-widest text-[#111827] outline-none transition-all focus:ring-2 focus:ring-[#111827]',
                    errors[index] ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'
                  )}
                />
                {errors[index] && <p className="text-xs font-bold text-red-600">{errors[index]}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#4B5563] transition-all hover:text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allValid || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white transition-all hover:bg-[#374151] disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            Create &amp; Import
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({
  intent,
  isDeleting,
  onClose,
  onConfirm,
}: {
  intent: DeleteIntent;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [typedPhrase, setTypedPhrase] = useState('');
  const requiresPhrase = intent.ids.length > 1;
  const canConfirm = !requiresPhrase || typedPhrase === intent.phrase;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-lg rounded-2xl border border-[#FECACA] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#FEE2E2] px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-[#111827]">{intent.title}</h2>
            <p className="mt-1 text-sm font-bold leading-relaxed text-[#6B7280]">{intent.detail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl p-2 text-[#9CA3AF] transition-all hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {requiresPhrase ? (
            <>
              <p className="text-xs font-bold text-[#4B5563]">
                Type <span className="font-black text-red-600">{intent.phrase}</span> to confirm.
              </p>
              <input
                value={typedPhrase}
                onChange={(event) => setTypedPhrase(event.target.value)}
                disabled={isDeleting}
                autoFocus
                className="w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-bold text-[#111827] outline-none transition-all focus:ring-2 focus:ring-red-500"
              />
            </>
          ) : (
            <p className="text-xs font-bold text-[#4B5563]">This action cannot be undone.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#FEE2E2] bg-[#FFF7F7] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#4B5563] transition-all hover:text-[#111827]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-[#D1D5DB]"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete Records
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EditRowModal({
  row,
  form,
  accounts,
  isSaving,
  onChange,
  onClose,
  onSave,
}: {
  row: ImportRow;
  form: Record<string, any>;
  accounts: AccountOption[];
  isSaving: boolean;
  onChange: (field: string, value: string | boolean) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 px-4 py-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-2xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-white bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] shadow flex items-center justify-center text-xl font-black text-[#111827] uppercase tracking-tighter shrink-0">
              {form.fullName?.split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0]).join('') || 'EP'}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#111827] leading-tight">{form.fullName || 'New Employee'}</h2>
              <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest mt-0.5">
                Staging Row {row.sourceRow} | ID: {form.employeeNumber || 'Not Set'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-[#9CA3AF] transition-all hover:bg-[#E5E7EB]/50 hover:text-[#111827]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto p-6 bg-[#F9FAFB]">
          {/* Column 1: EMPLOYEE INFORMATION */}
          <div className="space-y-8">
            <ProfileSection icon={Briefcase} title="EMPLOYEE INFORMATION" iconColorClass="text-blue-600 bg-blue-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectDropdown
                  label="Department/Campaign"
                  value={form.accountAssignment || ''}
                  options={accounts.map(acc => ({ id: acc.name, name: acc.name }))}
                  onSelect={(val) => onChange('accountAssignment', val)}
                  required
                  placeholder="Select department/campaign"
                />
                <Field label="Job Title">
                  <Input value={form.position || ''} onChange={(val) => onChange('position', val)} placeholder="e.g. CSR" />
                </Field>
                <Field label="Bigoutsource Email" required>
                  <Input value={form.boEmail || ''} onChange={(val) => onChange('boEmail', val)} placeholder="e.g. john@bigoutsource.com" />
                </Field>
                <Field label="Email Password">
                  <Input value={form.emailPassword || ''} onChange={(val) => onChange('emailPassword', val)} placeholder="e.g. P@ssw0rd123" />
                </Field>
                <Field label="LMS Account">
                  <Input value={form.lmsAccount || ''} onChange={(val) => onChange('lmsAccount', val)} placeholder="e.g. john.smith" />
                </Field>
                <SelectDropdown
                  label="Status"
                  value={form.status || 'active'}
                  options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
                  onSelect={(val) => onChange('status', val)}
                />
                <SelectDropdown
                  label="Site"
                  value={form.siteName || ''}
                  options={siteOptions.map(site => ({ id: site, name: site }))}
                  onSelect={(val) => onChange('siteName', val)}
                  required
                  placeholder="Select site"
                />
                <Field label="Position">
                  <Input value={form.position || ''} onChange={(val) => onChange('position', val)} placeholder="e.g. CSR" />
                </Field>
                <Field label="Nickname">
                  <Input value={form.nickname || ''} onChange={(val) => onChange('nickname', val)} placeholder="e.g. Johnny" />
                </Field>
                <SelectDropdown
                  label="Sex"
                  value={form.sex || ''}
                  options={[{ id: 'Male', name: 'Male' }, { id: 'Female', name: 'Female' }]}
                  onSelect={(val) => onChange('sex', val)}
                  placeholder="Select sex"
                />
                <SelectDropdown
                  label="Civil Status"
                  value={form.civilStatus || ''}
                  options={[{ id: 'Single', name: 'Single' }, { id: 'Married', name: 'Married' }, { id: 'Widowed', name: 'Widowed' }, { id: 'Divorced', name: 'Divorced' }]}
                  onSelect={(val) => onChange('civilStatus', val)}
                  placeholder="Select civil status"
                />
                <Field label="SSS No.">
                  <Input value={form.sssNo || ''} onChange={(val) => onChange('sssNo', val)} placeholder="e.g. 12-3456789-0" />
                </Field>
                <Field label="TIN No.">
                  <Input value={form.tinNo || ''} onChange={(val) => onChange('tinNo', val)} placeholder="e.g. 123-456-789-000" />
                </Field>
                <Field label="PhilHealth No.">
                  <Input value={form.philhealthNo || ''} onChange={(val) => onChange('philhealthNo', val)} placeholder="e.g. 12-3456789-0" />
                </Field>
                <Field label="Pag-Ibig No.">
                  <Input value={form.pagibigNo || ''} onChange={(val) => onChange('pagibigNo', val)} placeholder="e.g. 1234-5678-9012" />
                </Field>
              </div>
            </ProfileSection>

            <ProfileSection icon={Phone} title="Contact & Communication" iconColorClass="text-green-600 bg-green-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={form.phone || ''} onChange={(val) => onChange('phone', val)} placeholder="e.g. 09123456789" />
                </Field>
                <Field label="Address">
                  <Input value={form.address || ''} onChange={(val) => onChange('address', val)} placeholder="e.g. 123 Main St" />
                </Field>
                <Field label="Outlook Email">
                  <Input value={form.outlookEmail || ''} onChange={(val) => onChange('outlookEmail', val)} placeholder="e.g. john@outlook.com" />
                </Field>
                <Field label="Teams Account">
                  <Input value={form.teamsAccount || ''} onChange={(val) => onChange('teamsAccount', val)} placeholder="e.g. john.teams" />
                </Field>
                <Field label="Mattermost Account">
                  <Input value={form.mattermostAccount || ''} onChange={(val) => onChange('mattermostAccount', val)} placeholder="e.g. john.mattermost" />
                </Field>
                <Field label="Personal Email">
                  <Input value={form.personalEmail || ''} onChange={(val) => onChange('personalEmail', val)} placeholder="e.g. john@gmail.com" />
                </Field>
                <Field label="Main Contact">
                  <Input value={form.mainContact || ''} onChange={(val) => onChange('mainContact', val)} placeholder="e.g. 09123456789" />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={form.emergencyContact || ''} onChange={(val) => onChange('emergencyContact', val)} placeholder="e.g. Jane Doe" />
                </Field>
                <Field label="Emergency Number">
                  <Input value={form.emergencyContactNumber || ''} onChange={(val) => onChange('emergencyContactNumber', val)} placeholder="e.g. 09123456789" />
                </Field>
              </div>
            </ProfileSection>
          </div>

          {/* Column 2: System Details & Compliance */}
          <div className="space-y-6">
            <ProfileSection icon={Laptop} title="System Details" iconColorClass="text-indigo-600 bg-indigo-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID" required>
                  <Input value={form.employeeNumber || ''} onChange={(val) => onChange('employeeNumber', val)} placeholder="e.g. 1004" />
                </Field>
                <Field label="Employee Full Name" required>
                  <Input value={form.fullName || ''} onChange={(val) => onChange('fullName', val)} placeholder="e.g. John Doe" />
                </Field>
                <Field label="PC Name">
                  <Input value={form.pcName || ''} onChange={(val) => onChange('pcName', val)} placeholder="e.g. PC-JOHN" />
                </Field>
                <Field label="Remote ID">
                  <Input value={form.rustdeskId || ''} onChange={(val) => onChange('rustdeskId', val)} placeholder="e.g. 123 456 789" />
                </Field>
                <Field label="Windows Key">
                  <Input value={form.windowsKey || ''} onChange={(val) => onChange('windowsKey', val)} placeholder="e.g. XXXX-XXXX" />
                </Field>
                <Field label="BIOS Date">
                  <Input type="date" value={form.biosDate || ''} onChange={(val) => onChange('biosDate', val)} />
                </Field>
              </div>
            </ProfileSection>

            <ProfileSection icon={CalendarDays} title="Employment Timeline" iconColorClass="text-purple-600 bg-purple-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Birthdate">
                  <Input type="date" value={form.birthdate || ''} onChange={(val) => onChange('birthdate', val)} />
                </Field>
                <Field label="Date Hired">
                  <Input type="date" value={form.dateHired || ''} onChange={(val) => onChange('dateHired', val)} />
                </Field>
                <Field label="Float Date">
                  <Input type="date" value={form.floatDate || ''} onChange={(val) => onChange('floatDate', val)} />
                </Field>
                <Field label="Separation Date">
                  <Input type="date" value={form.separationDate || ''} onChange={(val) => onChange('separationDate', val)} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Separation Reason">
                    <Input value={form.separationReason || ''} onChange={(val) => onChange('separationReason', val)} placeholder="e.g. Resigned" />
                  </Field>
                </div>
              </div>
            </ProfileSection>

            <ProfileSection icon={ShieldCheck} title="Compliance & State" iconColorClass="text-emerald-600 bg-emerald-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectDropdown
                  label="ESET"
                  value={form.esetStatus || 'inactive'}
                  options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
                  onSelect={(val) => onChange('esetStatus', val)}
                />
                <SelectDropdown
                  label="Activity Watch"
                  value={form.activityWatchStatus || 'missing'}
                  options={[{ id: 'installed', name: 'Installed' }, { id: 'missing', name: 'Missing' }]}
                  onSelect={(val) => onChange('activityWatchStatus', val)}
                />
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 hover:bg-[#F9FAFB] transition-colors cursor-pointer shadow-xs">
                    <input
                      type="checkbox"
                      checked={Boolean(form.is_archived)}
                      onChange={(event) => onChange('is_archived', event.target.checked)}
                      className="h-4 w-4 accent-[#111827] rounded cursor-pointer"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-[#4B5563]">Archived (Staged record is archived)</span>
                  </label>
                </div>
              </div>
            </ProfileSection>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] transition-all"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#374151] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Row
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProfileSection({
  icon: Icon,
  title,
  children,
  iconColorClass = 'text-[#111827] bg-[#F3F4F6]',
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  iconColorClass?: string;
}) {
  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 transition-shadow duration-300 hover:shadow-md text-left">
      <div className="flex items-center gap-3 border-b border-[#F3F4F6] pb-3 mb-4">
        <div className={cn("p-2 rounded-xl", iconColorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-black text-[#111827] tracking-tight">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <span className="text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#111827] outline-none focus:ring-2 focus:ring-[#111827] transition-all"
    />
  );
}

function SelectDropdown({
  label,
  value,
  options,
  onSelect,
  required = false,
  placeholder = 'Select option',
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onSelect: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayLabel = options.find((opt) => opt.id === value || opt.name === value)?.name || value || placeholder;

  return (
    <div className="flex flex-col gap-1.5 w-full relative text-left" ref={dropdownRef}>
      <span className="text-[0.625rem] font-black uppercase tracking-widest text-[#9CA3AF]">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-left text-sm font-bold text-[#4B5563] outline-none transition-all hover:border-[#CBD5E1] focus:ring-2 focus:ring-[#111827]',
          required && !value ? 'border-red-300 bg-red-50' : 'border-[#E5E7EB]'
        )}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronRight className={cn('h-4 w-4 shrink-0 transition-transform text-[#9CA3AF]', isOpen && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-64 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white shadow-xl shadow-[#11182714]"
          >
            <div className="py-1">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelect(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-[#F3F4F6]',
                    value === opt.id || value === opt.name ? 'bg-[#EFF6FF] text-[#2563EB]' : 'text-[#4B5563]'
                  )}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WarningChip({ text }: { text: string }) {
  const isInfo = text.includes('fields');
  return (
    <span
      title={text}
      className={cn(
        "group relative inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-1 text-[0.625rem] font-black uppercase tracking-wide",
        isInfo ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
      )}
    >
      {isInfo ? <Info className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
      <span className="truncate">{isInfo ? 'Incomplete Fields' : 'Warning'}</span>
      <div className="absolute right-full top-1/2 z-[100] mr-2 flex w-max max-w-[250px] -translate-y-1/2 items-center pointer-events-none opacity-0 translate-x-1 scale-95 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-100">
        <div className="rounded-lg bg-[#111827] px-3 py-2 text-left text-[0.625rem] font-medium leading-relaxed text-white shadow-xl whitespace-pre-wrap">
          {text}
        </div>
        <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-[#111827]" />
      </div>
    </span>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F6]">
        {title.includes('No') ? <CheckCircle2 className="h-7 w-7 text-green-600" /> : <XCircle className="h-7 w-7 text-[#9CA3AF]" />}
      </div>
      <p className="text-lg font-black text-[#111827]">{title}</p>
      <p className="mt-1 text-sm font-bold text-[#6B7280]">{detail}</p>
    </div>
  );
}
