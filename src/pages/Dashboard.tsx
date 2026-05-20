import { Users, UserCheck, UserMinus, ShieldAlert, Laptop, Key, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight, MapPin } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { motion } from 'motion/react';
import { Clock as ClockIcon } from 'lucide-react';

const stats = [
  { label: 'Total Personnel', value: '1,248', change: '+24', trend: 'up', icon: Users },
  { label: 'Active Staff', value: '1,192', change: '+12', trend: 'up', icon: UserCheck },
  { label: 'Inactive/Archive', value: '56', change: '-2', trend: 'down', icon: UserMinus },
  { label: 'Assigned Assets', value: '1,210', change: '+8', trend: 'up', icon: Laptop },
];

const securityalerts = [
  { label: 'Missing ESET', value: '12', color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Missing ActivityWatch', value: '8', color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Unlicensed Windows', value: '5', color: 'text-yellow-600', bg: 'bg-yellow-50' },
];

export default function Dashboard() {
  return (
    <PageLayout title="System Overview">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#F3F4F6] rounded-xl text-[#111827]">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change}
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <p className="text-xs text-[#6B7280] font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-black text-[#111827] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Security Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {securityalerts.map((alert) => (
          <div key={alert.label} className={`flex items-center justify-between p-5 rounded-2xl border border-[#E5E7EB] ${alert.bg}`}>
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg bg-white shadow-sm ${alert.color}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase">{alert.label}</p>
                <p className={`text-xl font-black ${alert.color}`}>{alert.value} Devices</p>
              </div>
            </div>
            <button className="text-[10px] font-black uppercase text-[#111827] hover:underline">View All</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Site Distribution */}
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm">
          <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#9CA3AF]" /> 
            Personnel per Site
          </h3>
          <div className="space-y-6">
            {[
              { site: 'Main Office - Manila', count: 540, total: 1248, color: 'bg-[#111827]' },
              { site: 'Satellite - Cebu', count: 320, total: 1248, color: 'bg-[#374151]' },
              { site: 'Remote Operations', count: 388, total: 1248, color: 'bg-[#6B7280]' },
            ].map((item) => (
              <div key={item.site} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#4B5563]">{item.site}</span>
                  <span className="text-[#111827] text-xs font-black">{Math.round((item.count / item.total) * 100)}% ({item.count})</span>
                </div>
                <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / item.total) * 100}%` }}
                    className={`h-full ${item.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white p-8 rounded-2xl border border-[#E5E7EB] shadow-sm">
           <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#9CA3AF]" /> 
            Recent Activity
          </h3>
          <div className="space-y-6">
            {[
              { user: 'HR Admin', action: 'Archived Employee', target: 'John Doe (BO-2021-092)', time: '12 mins ago' },
              { user: 'IT Admin', action: 'Updated ESET Status', target: 'BO-LAP-88', time: '45 mins ago' },
              { user: 'Super Admin', action: 'Revealed Windows Key', target: 'Jane Smith (BO-2022-015)', time: '2 hours ago' },
              { user: 'HR Admin', action: 'Added New Employee', target: 'Mark Wilson', time: '5 hours ago' },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-[#F3F4F6] last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-[#111827] mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#111827]">
                    {log.user} <span className="font-medium text-[#6B7280]">{log.action.toLowerCase()} for</span> {log.target}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase font-bold mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-xs font-bold text-[#111827] border border-[#E5E7EB] rounded-xl hover:bg-[#F9FAFB] transition-colors">
            View Full Audit Logs
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
