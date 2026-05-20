import { useState } from 'react';
import { 
  MoreHorizontal, Search, Filter, UserPlus, Mail, MapPin, 
  Download, Upload, Laptop, ShieldCheck, ChevronRight 
} from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { MOCK_EMPLOYEES } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function Directory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => {
    const matchesSearch = 
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.pcName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.accountAssignment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSite = siteFilter === 'All' || emp.site === siteFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesSite && matchesStatus;
  });

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredEmployees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Nexus_Employees_Export.xlsx");
    toast.success('Excel exported successfully');
  };

  const handleImport = () => {
    toast.error('Import validation: Please select a valid Excel file');
  };

  return (
    <PageLayout title="Personnel Database">
      <div className="flex flex-col gap-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by name, ID, PC, or account..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#111827] transition-all outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
               <select 
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] outline-none focus:ring-2 focus:ring-[#111827]"
              >
                <option>All Sites</option>
                <option>Site A</option>
                <option>Site B</option>
                <option>Remote</option>
              </select>
               <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#4B5563] outline-none focus:ring-2 focus:ring-[#111827]"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] transition-all"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563] hover:text-[#111827] transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-black hover:bg-[#374151] transition-all shadow-lg shadow-[#11182720]">
              <UserPlus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </div>

        {/* Database Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Employee Information</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Account & Site</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">IT Asset (PC Name)</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Security</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F9FAFB] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden">
                        {emp.avatar ? <img src={emp.avatar} alt="" /> : <span className="text-xs font-bold text-[#9CA3AF]">{emp.fullName.charAt(0)}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#111827]">{emp.fullName}</p>
                        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-tighter">{emp.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-bold text-[#111827]">{emp.accountAssignment}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#9CA3AF]" />
                      <span className="text-xs text-[#6B7280]">{emp.site}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-[#D1D5DB]" />
                      <p className="text-sm font-mono font-bold text-[#111827]">{emp.pcName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", emp.esetStatus === 'Installed' ? 'bg-green-500' : 'bg-red-500')} />
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase">ESET</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={cn("w-1.5 h-1.5 rounded-full", emp.activityWatchStatus === 'Installed' ? 'bg-green-500' : 'bg-red-500')} />
                        <span className="text-[10px] font-bold text-[#6B7280] uppercase">ActivityWatch</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                      emp.status === 'active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/employee/${emp.id}`}
                      className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-white rounded-xl transition-all inline-flex items-center gap-2 text-xs font-bold"
                    >
                      View Profile
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#D1D5DB]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">No records found</h3>
              <p className="text-sm text-[#6B7280]">Try adjusting your filters or search keywords.</p>
            </div>
          )}

          <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex items-center justify-between">
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
              Total Personnel: {filteredEmployees.length}
            </p>
            <div className="flex gap-2">
              <button disabled className="px-4 py-1.5 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#9CA3AF] cursor-not-allowed">Previous</button>
              <button className="px-4 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#111827] hover:bg-[#F3F4F6]">Next</button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
