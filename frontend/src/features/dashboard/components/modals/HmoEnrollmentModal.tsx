import { useMemo, useState } from 'react';
import { FileCheck, ExternalLink, Calendar, Building2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { BaseDashboardModal } from './BaseDashboardModal';
import { Link } from 'react-router-dom';

interface HmoEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: any[];
}

function formatTime(value?: string) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function getAvatarUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '')}${url}`;
}

export function HmoEnrollmentModal({ isOpen, onClose, employees }: HmoEnrollmentModalProps) {
  const [sortField, setSortField] = useState<'name' | 'department' | 'date'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { sortedEmployees: missingHmoEmployees, missingCount, enrolledCount } = useMemo(() => {
    const filtered = employees.filter(emp => !emp.hmoMemberCode || emp.hmoMemberCode.trim() === '');
    const count = filtered.length;
    const enrolled = employees.length - count;
    
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = (a.fullName || '').toLowerCase();
        const nameB = (b.fullName || '').toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'department') {
        const deptA = (a.accountAssignment || a.account || '').toLowerCase();
        const deptB = (b.accountAssignment || b.account || '').toLowerCase();
        comparison = deptA.localeCompare(deptB);
      } else if (sortField === 'date') {
        const dateA = new Date(a.dateHired || a.date_hired || 0).getTime();
        const dateB = new Date(b.dateHired || b.date_hired || 0).getTime();
        comparison = dateA - dateB;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return { sortedEmployees: sorted, missingCount: count, enrolledCount: enrolled };
  }, [employees, sortField, sortDirection]);

  const handleSort = (field: 'name' | 'department' | 'date') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'department' | 'date' }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#6366F1]" /> : <ArrowDown className="w-3 h-3 text-[#6366F1]" />;
  };

  return (
    <BaseDashboardModal
      isOpen={isOpen}
      onClose={onClose}
      title="HMO Enrollment Status"
      icon={<FileCheck className="w-6 h-6" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-black uppercase tracking-wider text-[#6B7280]">Missing HMO ID</p>
          <p className="text-4xl font-black mt-2 text-[#EA580C]">{missingCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-black uppercase tracking-wider text-[#6B7280]">Enrolled Employees</p>
          <p className="text-4xl font-black mt-2 text-[#10B981]">{enrolledCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#F3F4F6] bg-[#F9FAFB] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Employees Missing HMO ID</h3>
            <p className="text-xs font-medium text-[#6B7280] mt-1">
              Showing {missingHmoEmployees.length} employee{missingHmoEmployees.length === 1 ? '' : 's'} without an HMO Member Code
            </p>
          </div>
        </div>

        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-white border-b border-[#F3F4F6]">
                <th className="p-4 text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280] cursor-pointer group hover:bg-[#F9FAFB] transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    Employee
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="p-4 text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280] cursor-pointer group hover:bg-[#F9FAFB] transition-colors" onClick={() => handleSort('department')}>
                  <div className="flex items-center gap-1.5">
                    Department
                    <SortIcon field="department" />
                  </div>
                </th>
                <th className="p-4 text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280] cursor-pointer group hover:bg-[#F9FAFB] transition-colors" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1.5">
                    Date Hired
                    <SortIcon field="date" />
                  </div>
                </th>
                <th className="p-4 text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {missingHmoEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {emp.avatarUrl || emp.avatar_url ? (
                          <img 
                            src={getAvatarUrl(emp.avatarUrl || emp.avatar_url)} 
                            alt={emp.fullName} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-xs font-black text-[#6B7280]">
                            {(emp.fullName || 'UN').substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#111827] truncate">{emp.fullName || 'Unnamed Employee'}</p>
                        <p className="text-[0.625rem] font-black uppercase tracking-wider text-[#6B7280] truncate mt-0.5">
                          {emp.employeeNumber || emp.employee_number || 'No ID'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span className="text-xs font-bold text-[#4B5563] truncate">
                        {emp.accountAssignment || emp.account || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span className="text-xs font-bold text-[#4B5563]">
                        {formatTime(emp.dateHired || emp.date_hired)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/employees/${emp.id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6366F1] bg-[#EEF2FF] hover:bg-[#E0E7FF] rounded-lg transition-colors border border-[#C7D2FE]"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              
              {missingHmoEmployees.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#6B7280] text-sm font-bold">
                    All employees are currently enrolled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </BaseDashboardModal>
  );
}
