import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, Search, BarChart3, AlertCircle } from "lucide-react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { useAuth } from "@/src/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { employeeService } from "@/src/features/employees/services/employeeService";
import { cn } from "@/src/lib/utils";
import { Employee } from "@/src/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

function normalizeEmployeeList(value: any) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
}

type EmployeeRecord = Employee & {
  accountAssignment?: string;
};

const MILESTONES = [
  { label: "1st Month", field: "evalFirstMonth" as const },
  { label: "3rd Month", field: "evalThirdMonth" as const },
  { label: "5th Month", field: "evalFifthMonth" as const },
  { label: "6th Month", field: "evalSixthMonth" as const },
  { label: "Anniversary", field: "evalAnniversary" as const },
];

function getEvalStatus(dateStr?: string | null) {
  if (!dateStr) return null;

  const evalDate = new Date(dateStr);
  if (isNaN(evalDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(evalDate);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Due Today", type: "due" };
  if (diffDays > 0 && diffDays <= 7) return { label: "Upcoming", type: "upcoming" };
  if (diffDays < 0) return { label: "Overdue", type: "overdue" };
  return { label: "Future", type: "future" };
}

function EvalBadge({ status }: { status: ReturnType<typeof getEvalStatus> }) {
  if (!status) return null;
  
  const styles = {
    due: "bg-red-100 text-red-700 border-red-200",
    upcoming: "bg-orange-100 text-orange-700 border-orange-200",
    overdue: "bg-gray-100 text-gray-600 border-gray-200",
    future: "bg-blue-50 text-blue-600 border-blue-200"
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[0.625rem] font-bold uppercase tracking-wider border whitespace-nowrap", styles[status.type as keyof typeof styles])}>
      {status.label}
    </span>
  );
}

export default function Evaluations() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date filtering state
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Set to first of month to avoid overflow issues
    return d;
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!can("employees.evaluations.view")) {
      navigate("/");
      return;
    }

    async function fetchEmployees() {
      try {
        const data = await employeeService.list();
        const activeRecords = normalizeEmployeeList(data).filter(e => e.status === "active" && !e.isArchived);
        setEmployees(activeRecords);
      } catch (error: any) {
        console.error("Failed to load employees for evaluations", error);
        toast.error(error.message || "Unable to connect to the server to load evaluations. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, [can, navigate]);

  const nextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const filteredEmployees = useMemo(() => {
    const targetMonth = currentDate.getMonth();
    const targetYear = currentDate.getFullYear();
    const searchLower = searchTerm.toLowerCase();

    return employees.filter(emp => {
      // 1. Check if employee matches search term
      const matchesSearch = emp.fullName?.toLowerCase().includes(searchLower) || 
                            emp.accountAssignment?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      // 2. Check if any evaluation falls in the current target month/year
      const hasEvalThisMonth = MILESTONES.some(m => {
        const dateStr = emp[m.field];
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      });

      return hasEvalThisMonth;
    }).sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
  }, [employees, currentDate, searchTerm]);

  const analyticsStats = useMemo(() => {
    let dueThisMonth = 0;
    let dueNextMonth = 0;
    let dueTodayCount = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const nextMonthDate = new Date(now);
    nextMonthDate.setMonth(currentMonth + 1);
    const nextMonthMonth = nextMonthDate.getMonth();
    const nextMonthYear = nextMonthDate.getFullYear();

    // Forecast for next 6 months
    const forecastMonths = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now);
      d.setMonth(currentMonth + i);
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        count: 0
      };
    });

    const milestoneCounts: Record<string, number> = {
      '1st Month': 0,
      '3rd Month': 0,
      '5th Month': 0,
      '6th Month': 0,
      'Anniversary': 0
    };

    employees.forEach(emp => {
      MILESTONES.forEach(m => {
        const dateStr = emp[m.field];
        if (!dateStr) return;
        
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;

        const status = getEvalStatus(dateStr);
        
        if (status?.type === 'due') {
          dueTodayCount++;
        }

        const forecastBucket = forecastMonths.find(fm => fm.month === d.getMonth() && fm.year === d.getFullYear());
        if (forecastBucket) {
          forecastBucket.count++;
        }

        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          dueThisMonth++;
          milestoneCounts[m.label]++;
        }
        if (d.getMonth() === nextMonthMonth && d.getFullYear() === nextMonthYear) dueNextMonth++;
      });
    });

    const milestoneData = Object.entries(milestoneCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      dueThisMonth,
      dueNextMonth,
      dueTodayCount,
      forecastData: forecastMonths.map(fm => ({ name: fm.label, Total: fm.count })),
      milestoneData
    };
  }, [employees]);

  if (!can("employees.view")) return null;

  const monthYearLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  return (
    <PageLayout title="Evaluations">
      <div className="flex flex-col gap-6">
        
        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Stat Cards */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col justify-between flex-1">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Due This Month</p>
                <h3 className="text-4xl font-bold text-gray-900">{analyticsStats.dueThisMonth}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <CalendarCheck className="w-4 h-4 text-blue-500" />
                <span>Current focus workload</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col justify-between flex-1">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Due Next Month</p>
                <h3 className="text-4xl font-bold text-gray-900">{analyticsStats.dueNextMonth}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <BarChart3 className="w-4 h-4 text-orange-500" />
                <span>Upcoming forecast pipeline</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] p-6 flex flex-col justify-between flex-1">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Due Today</p>
                <h3 className="text-4xl font-bold text-red-600">{analyticsStats.dueTodayCount}</h3>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 font-medium">Focus for today</span>
              </div>
            </div>
          </div>

          {/* Right Column: Forecast Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB] flex flex-col">
            <h3 className="text-lg font-semibold text-[#111827] mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              6-Month Forecast
            </h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsStats.forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-[#E5E7EB]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-bold text-gray-800 w-48 text-center">{monthYearLabel}</h2>
              <button 
                onClick={nextMonth}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#F9FAFB] text-xs uppercase text-gray-500 font-bold border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  {MILESTONES.map(m => (
                    <th key={m.field} className="px-6 py-4 whitespace-nowrap">{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Loading evaluations...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarCheck className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-500 font-medium">No evaluations scheduled for {monthYearLabel}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/employee/${emp.id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {emp.fullName || 'Unnamed Employee'}
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">{emp.accountAssignment || '-'}</div>
                      </td>
                      {MILESTONES.map(m => {
                        const dateStr = emp[m.field as keyof EmployeeRecord] as string | undefined;
                        const status = getEvalStatus(dateStr);
                        const isThisMonth = dateStr && new Date(dateStr).getMonth() === currentDate.getMonth() && new Date(dateStr).getFullYear() === currentDate.getFullYear();
                        
                        return (
                          <td key={m.field} className={cn("px-6 py-4", isThisMonth ? "bg-blue-50/30" : "")}>
                            {dateStr ? (
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={cn("text-sm font-medium whitespace-nowrap", isThisMonth ? "text-gray-900" : "text-gray-400")}>
                                  {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                {isThisMonth && status && <EvalBadge status={status} />}
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
