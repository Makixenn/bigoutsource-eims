import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageLayout } from "@/src/components/layout/PageLayout";
import { useAuth } from "@/src/contexts/AuthContext";
import { employeeService } from "@/src/features/employees/services/employeeService";
import { cn } from "@/src/lib/utils";
import { Employee } from "@/src/types";

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
      } catch (error) {
        console.error("Failed to load employees for evaluations", error);
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

  if (!can("employees.view")) return null;

  const monthYearLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <PageLayout title="Evaluations">
      <div className="flex flex-col gap-6">
        
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
