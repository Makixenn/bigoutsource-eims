import { Building2, Search, MoreVertical, Plus } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';

const depts = [
  { name: 'Engineering', lead: 'Sarah Jenkins', employees: 42, budget: '$1.2M', growth: '+12%' },
  { name: 'Design', lead: 'Michael Chen', employees: 18, budget: '$450K', growth: '+5%' },
  { name: 'Marketing', lead: 'Elena Rodriguez', employees: 24, budget: '$600K', growth: '+8%' },
  { name: 'Human Resources', lead: 'David Kim', employees: 8, budget: '$200K', growth: '+2%' },
  { name: 'Product Management', lead: 'Alex Thompson', employees: 12, budget: '$350K', growth: '+15%' },
];

export default function Departments() {
  return (
    <PageLayout title="Organization Departments">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search departments..." 
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:ring-2 focus:ring-[#111827] outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white rounded-lg text-sm font-medium hover:bg-[#374151] transition-shadow shadow-sm">
            <Plus className="w-4 h-4" />
            New Department
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {depts.map((dept) => (
            <div key={dept.name} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <button className="p-2 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-[#111827] mb-1">{dept.name}</h3>
              <p className="text-xs text-[#6B7280] mb-6 flex items-center gap-1.5">
                Lead: <span className="font-semibold text-[#111827]">{dept.lead}</span>
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F3F4F6]">
                <div>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-0.5">Employees</p>
                  <p className="text-sm font-bold text-[#111827]">{dept.employees}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase mb-0.5">Annual Budget</p>
                  <p className="text-sm font-bold text-[#111827]">{dept.budget}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
