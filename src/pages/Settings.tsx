import { Bell, Shield, Wallet, Globe, Mail, Lock } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { user } = useAuth();

  const settingsGroups = [
    {
      title: 'General',
      items: [
        { label: 'Profile Information', desc: 'Update company name and branding', icon: Globe },
        { label: 'Notifications', desc: 'Configure email and system alerts', icon: Bell },
        { label: 'Emails', desc: 'Manage automated employee emails', icon: Mail },
      ]
    },
    {
      title: 'Security',
      items: [
        { label: 'Password', desc: 'Last changed 3 months ago', icon: Lock },
        { label: 'Roles & Permissions', desc: 'Manage access control for HR and Admins', icon: Shield },
      ]
    },
    {
      title: 'Billing & Payroll',
      items: [
        { label: 'Subscription', desc: 'Manage your Nexus EIMS plan', icon: Wallet },
      ]
    }
  ];

  return (
    <PageLayout title="System Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        {settingsGroups.map((group) => (
          <div key={group.title} className="space-y-4">
            <h3 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider px-2">{group.title}</h3>
            <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
              {group.items.map((item, i) => (
                <button 
                  key={item.label} 
                  className={`w-full flex items-center justify-between p-6 text-left hover:bg-[#F9FAFB] transition-colors ${i !== group.items.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-[#F3F4F6] rounded-xl text-[#111827]">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{item.label}</p>
                      <p className="text-xs text-[#6B7280] mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[#9CA3AF]">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        
        <div className="pt-4 flex justify-end gap-3">
          <button className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827]">Cancel</button>
          <button className="px-6 py-2 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#374151] shadow-md transition-all">
            Save All Changes
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
