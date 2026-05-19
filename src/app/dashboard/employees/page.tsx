"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Search, Plus, ShieldCheck, AlertTriangle, ChevronRight } from "lucide-react";

function getRiskLevel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: "Low", color: "text-green-700", bg: "bg-green-50 border-green-200" };
  if (score >= 60) return { label: "Medium", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
  if (score >= 40) return { label: "High", color: "text-red-700", bg: "bg-red-50 border-red-200" };
  return { label: "Critical", color: "text-red-900", bg: "bg-red-100 border-red-300" };
}

export default function EmployeesList() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const load = () => {
      fetch("/api/employees")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setEmployees(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = employees.filter((emp) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      emp.name?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || emp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Monitored Personnel
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} under continuous behavioral surveillance
          </p>
        </div>
        <Link href="/dashboard/employees/add">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </Link>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, department, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Active", "Isolated", "Suspended"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trust Score</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading personnel...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    {searchTerm ? "No employees match your search." : "No employees found. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const risk = getRiskLevel(emp.currentTrustScore);
                  return (
                    <tr
                      key={emp._id}
                      onClick={() => router.push(`/dashboard/employees/${emp._id}`)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{emp.name}</div>
                            <div className="text-xs text-slate-500">{emp.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-600">{emp.department}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                emp.currentTrustScore >= 80 ? "bg-green-500" :
                                emp.currentTrustScore >= 60 ? "bg-orange-400" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.max(0, emp.currentTrustScore)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{emp.currentTrustScore}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold border ${risk.bg} ${risk.color}`}>
                          {risk.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.status === "Active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <ShieldCheck className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : emp.status === "Isolated" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Isolated
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium group-hover:underline">
                          Monitor <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            Showing {filtered.length} of {employees.length} employees
          </div>
        )}
      </div>
    </div>
  );
}
