"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, AlertTriangle, User, X, Menu } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EmpResult {
  _id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  currentTrustScore: number;
  status: string;
}

interface AlertResult {
  _id: string;
  title: string;
  severity: string;
  status: string;
  employeeId?: { name: string };
}

interface SearchResults {
  employees: EmpResult[];
  alerts: AlertResult[];
}

// ─── Trust colour helper ────────────────────────────────────────────────────────
function trustColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-orange-500";
  return "text-red-600";
}

const SEV_COLOR: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-blue-100 text-blue-700",
};

// ─── Search Dropdown ────────────────────────────────────────────────────────────
function SearchDropdown({
  query,
  results,
  loading,
  onSelectEmployee,
  onSelectAlert,
  onClear,
}: {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  onSelectEmployee: (id: string) => void;
  onSelectAlert: (id: string) => void;
  onClear: () => void;
}) {
  const hasResults =
    results && (results.employees.length > 0 || results.alerts.length > 0);

  if (!query || query.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
          <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Searching…
        </div>
      ) : !hasResults ? (
        <div className="px-4 py-4 text-sm text-slate-400 text-center">
          No results for <span className="font-semibold text-slate-600">"{query}"</span>
        </div>
      ) : (
        <div className="max-h-[380px] overflow-y-auto">
          {/* Employees section */}
          {results!.employees.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Employees
              </div>
              {results!.employees.map((emp) => (
                <button
                  key={emp._id}
                  onClick={() => onSelectEmployee(emp._id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {emp.role} · {emp.department}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-sm font-bold ${trustColor(emp.currentTrustScore)}`}>
                      {emp.currentTrustScore}
                    </p>
                    <p className="text-[10px] text-slate-400">trust</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Alerts section */}
          {results!.alerts.length > 0 && (
            <div className={results!.employees.length > 0 ? "border-t border-slate-100" : ""}>
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Alerts
              </div>
              {results!.alerts.map((alert) => (
                <button
                  key={alert._id}
                  onClick={() => onSelectAlert(alert._id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{alert.title}</p>
                    <p className="text-xs text-slate-500">
                      {alert.employeeId?.name || "Unknown employee"}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      SEV_COLOR[alert.severity] || "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <span className="text-[10px] text-slate-400">
              {(results!.employees.length + results!.alerts.length)} result
              {results!.employees.length + results!.alerts.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onClear}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ────────────────────────────────────────────────────────────────
export default function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 280);
  };

  const handleSelectEmployee = (id: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(`/dashboard/employees/${id}`);
  };

  const handleSelectAlert = (id: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(`/dashboard/threat-center`);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setOpen(false);
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center text-xs sm:text-sm text-slate-500 gap-2">
        <button 
          onClick={onMenuClick}
          className="p-1.5 -ml-1.5 mr-1 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> SOC Active
        </span>
        <span className="hidden sm:inline px-2 text-slate-300">|</span>
        <span className="hidden sm:inline">Environment: Production</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Smart Search */}
        <div className="relative" ref={wrapperRef}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => query.length >= 2 && setOpen(true)}
            placeholder="Search…"
            className="bg-slate-50 border border-slate-200 rounded-full pl-9 pr-8 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white w-32 sm:w-56 lg:w-72 transition-all"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {open && (
            <SearchDropdown
              query={query}
              results={results}
              loading={searching}
              onSelectEmployee={handleSelectEmployee}
              onSelectAlert={handleSelectAlert}
              onClear={handleClear}
            />
          )}
        </div>

        {/* Bell */}
        <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-medium text-slate-900">Admin</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
