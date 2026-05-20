import { UsersRound, Search, UserPlus, ShieldPlus, MoreVertical, ShieldCheck, Mail, ShieldAlert } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { AppUser } from '@/src/types';

const MOCK_USERS: AppUser[] = [
  { uid: '1', email: 'admin@bigoutsource.com', role: 'super_admin', status: 'active', site: 'HQ' },
  { uid: '2', email: 'hr.jane@bigoutsource.com', role: 'hr_admin', status: 'active', site: 'Site A' },
  { uid: '3', email: 'it.mark@bigoutsource.com', role: 'it_admin', status: 'active', site: 'HQ' },
  { uid: '4', email: 'viewer@bigoutsource.com', role: 'viewer', status: 'disabled', site: 'Remote' },
];

export default function UserManagement() {
  return (
    <PageLayout title="System Permissions & Users">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search authorized accounts..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:ring-2 focus:ring-[#111827] outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-black hover:bg-[#374151] transition-all shadow-lg shadow-[#11182720]">
            <UserPlus className="w-4 h-4" />
            Provision New User
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* RBAC Summary Cards */}
           {[
             { label: 'HR Admin', count: 5, icon: UsersRound, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'IT Admin', count: 3, icon: ShieldPlus, color: 'text-purple-600', bg: 'bg-purple-50' },
             { label: 'Super Admin', count: 2, icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50' },
           ].map((role) => (
             <div key={role.label} className={`p-6 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${role.bg} ${role.color}`}>
                    <role.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-[#111827]">{role.label}</h4>
                    <p className="text-xs text-[#6B7280] font-bold uppercase">{role.count} Active IDs</p>
                  </div>
                </div>
             </div>
           ))}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Authorized User</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Access Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Assigned Site</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_USERS.map((user) => (
                <tr key={user.uid} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[10px] font-black text-[#111827] border border-[#E5E7EB]">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#111827] truncate">{user.email}</p>
                          <p className="text-[10px] text-[#9CA3AF] font-bold tracking-tighter uppercase">ID: {user.uid}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#D1D5DB]" />
                        <span className="text-xs font-black text-[#4B5563] uppercase tracking-tight">{user.role.replace('_', ' ')}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-[#4B5563]">{user.site}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                      user.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-[#D1D5DB] hover:text-[#111827] hover:bg-white rounded-lg transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
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
