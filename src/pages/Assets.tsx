import { Laptop, Database, Cpu, Wifi, Key, ExternalLink, ShieldCheck, Search, Filter } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { MOCK_EMPLOYEES } from '@/src/types';

export default function Assets() {
  return (
    <PageLayout title="IT Asset Management">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
             <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
             <input 
                type="text" 
                placeholder="Search by PC Name, Remote ID, or License..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#111827] outline-none"
             />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563]">
              <Wifi className="w-4 h-4" />
              Check Conn.
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] bg-white rounded-xl text-sm font-bold text-[#4B5563]">
              <Database className="w-4 h-4" />
              Scan Network
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Total Assigned', value: '1,210', icon: Laptop, color: 'text-blue-600' },
             { label: 'Unlicensed Win', value: '5', icon: Key, color: 'text-orange-600' },
             { label: 'ESET Sync OK', value: '1,202', icon: ShieldCheck, color: 'text-green-600' },
             { label: 'Incomplete Bio', value: '12', icon: Cpu, color: 'text-red-600' },
           ].map((stat) => (
             <div key={stat.label} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-[#F9FAFB] ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                   <p className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-2xl font-black text-[#111827]">{stat.value}</p>
             </div>
           ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Asset Identifier</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Assignee</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">License Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Remote Access (RustDesk)</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_EMPLOYEES.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-[#111827] font-mono">{emp.pcName}</p>
                    <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-tighter mt-0.5">BIOS: {emp.biosDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-[#4B5563]">{emp.fullName}</span>
                       <Link to={`/employee/${emp.id}`}><ExternalLink className="w-3 h-3 text-[#D1D5DB]" /></Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <Key className="w-3.5 h-3.5 text-[#9CA3AF]" />
                       <span className="text-xs font-bold text-[#111827] uppercase">Win 11 Pro / Individual</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="py-1 px-3 bg-[#F3F4F6] rounded-lg w-fit">
                        <p className="text-xs font-black text-[#111827] font-mono">{emp.rustDeskId}</p>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[10px] font-black uppercase text-[#111827] hover:underline">Full Specs</button>
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

import { Link } from 'react-router-dom';
