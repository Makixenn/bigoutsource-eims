import { History, Search, Filter, AlertCircle, Download } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { AuditLog } from '@/src/types';

const MOCK_LOGS: AuditLog[] = [
  { id: '1', timestamp: '2024-05-19 14:22:15', uid: 'admin_1', userName: 'Alex Thompson', action: 'Archive Employee', details: 'Archived record for BO-2021-008', affectedRecord: 'John Doe' },
  { id: '2', timestamp: '2024-05-19 13:05:42', uid: 'it_1', userName: 'Michael Chen', action: 'Reveal Sensitive Info', details: 'Viewed Windows License Key for BO-2022-015', affectedRecord: 'Sarah Jenkins' },
  { id: '3', timestamp: '2024-05-19 11:45:00', uid: 'hr_1', userName: 'Sarah Jenkins', action: 'Update Employee', details: 'Changed site assignment to Site B', affectedRecord: 'Michael Chen' },
  { id: '4', timestamp: '2024-05-19 09:12:33', uid: 'admin_1', userName: 'Alex Thompson', action: 'Add Employee', details: 'Created new record for employee ID BO-2024-055', affectedRecord: 'Elena Rodriguez' },
];

export default function AuditLogs() {
  return (
    <PageLayout title="System Audit logs">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search logs by action, user, or record..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#111827] outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827]">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] hover:bg-[#F9FAFB] shadow-sm">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>

        <div className="bg-[#FEF2F2] border border-[#FEE2E2] p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#EF4444] mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#991B1B]">Security Notice</p>
            <p className="text-xs text-[#B91C1C]">Audit logs are immutable and cannot be deleted. All sensitive data reveals are recorded here for compliance mapping.</p>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Operator</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-[#111827] whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#111827]">{log.userName}</p>
                    <p className="text-[10px] text-[#6B7280] uppercase font-bold tracking-tighter">ID: {log.uid}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      log.action.includes('Reveal') ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-[#F3F4F6] text-[#4B5563]'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#4B5563]">{log.details}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1 italic">Target: {log.affectedRecord}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
