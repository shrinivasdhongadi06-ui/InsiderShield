"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ArrowRight, Sparkles } from 'lucide-react';

export default function EmployeePortalLogin() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('/api/employees?pageSize=100');
        if (!res.ok) throw new Error('Failed to load employees list');
        const resJson = await res.json();
        const items = resJson.data?.items || [];
        setEmployees(items);
        if (items.length > 0) {
          setSelectedId(items[0]._id);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching employees.');
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    localStorage.setItem('insidershield_employee_id', selectedId);
    // Redirect to employee dashboard
    router.push('/employee/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden text-slate-100">
      {/* Background radial and linear glow gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]"></div>
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[130px]"></div>

      <div className="z-10 w-full max-w-lg p-1 bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-violet-500/30 rounded-2xl shadow-2xl border border-slate-800">
        <div className="bg-slate-950/80 backdrop-blur-xl p-8 rounded-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20 shadow-lg shadow-blue-500/5 relative group">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <Shield className="w-8 h-8 text-blue-400 relative z-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-violet-400 bg-clip-text text-transparent">
              InsiderShield Portal
            </h1>
            <p className="text-slate-400 mt-2 text-sm text-center max-w-sm">
              Verify your employee identity to access the company workstation sandbox.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 py-8">
              <div className="h-4 bg-slate-800 animate-pulse rounded w-1/3 mx-auto"></div>
              <div className="h-10 bg-slate-800 animate-pulse rounded"></div>
              <div className="h-10 bg-slate-800/60 animate-pulse rounded"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl text-red-400 text-sm text-center mb-6">
              {error}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="employee-select" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> Select Your Identity
                </label>
                <div className="relative">
                  <select
                    id="employee-select"
                    data-testid="employee-select"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-880 rounded-xl px-4 py-3.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/45 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm shadow-inner"
                  >
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id} className="bg-slate-950 text-slate-200">
                        {emp.name} — {emp.role} ({emp.department})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                data-testid="employee-login-button"
                disabled={!selectedId}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enter Workspace Portal
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-900 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-500/80 animate-pulse" />
              Workstation activity is monitored for enterprise threat analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
