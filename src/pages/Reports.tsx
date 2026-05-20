import { FileText, Download, PieChart, BarChart } from 'lucide-react';
import { PageLayout } from '@/src/components/layout/PageLayout';
import toast from 'react-hot-toast';

const reportTypes = [
  { 
    title: 'Employee Master List', 
    desc: 'Complete database of all staff and their HR records.', 
    icon: FileText,
    type: 'excel'
  },
  { 
    title: 'IT Asset & License Report', 
    desc: 'Detailed mapping of PCs, Windows license keys, and remote IDs.', 
    icon: PieChart,
    type: 'excel'
  },
  { 
    title: 'Security Compliance Audit', 
    desc: 'List of devices missing ESET or ActivityWatch software.', 
    icon: ShieldAlert,
    type: 'pdf'
  },
  { 
    title: 'Site Occupancy Report', 
    desc: 'Breakdown of personnel distribution across all physical sites.', 
    icon: BarChart,
    type: 'excel'
  },
  { 
    title: 'Recent Terminations & Archives', 
    desc: 'Audit trail for off-boarding activities over the last 30 days.', 
    icon: Trash2,
    type: 'pdf'
  },
];

import { ShieldAlert, Trash2 } from 'lucide-react';

export default function Reports() {
  const handleDownload = (name: string) => {
    toast.loading(`Generating ${name}...`, { duration: 2000 });
    setTimeout(() => {
      toast.success(`${name} ready for download`);
    }, 2000);
  };

  return (
    <PageLayout title="Analytical Reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div key={report.title} className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-[#F3F4F6] rounded-2xl text-[#111827] group-hover:bg-[#111827] group-hover:text-white transition-colors border border-[#E5E7EB]">
                <report.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[#6B7280]">
                {report.type}
              </span>
            </div>
            
            <h3 className="text-xl font-black text-[#111827] mb-2">{report.title}</h3>
            <p className="text-sm text-[#6B7280] leading-relaxed mb-8">{report.desc}</p>
            
            <button 
              onClick={() => handleDownload(report.title)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#111827] hover:bg-[#111827] hover:text-white transition-all shadow-sm group-hover:border-transparent"
            >
              <Download className="w-4 h-4" />
              Generate & Download
            </button>
          </div>
        ))}
      </div>
    </PageLayout>
  );
}
