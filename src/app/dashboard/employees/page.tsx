"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Search, Plus, ShieldCheck, AlertTriangle, ChevronRight, ArrowUpDown } from "lucide-react";
import type { IEmployee, IPaginatedResponse, IPaginationMeta } from "@/types";
import { getRiskLevelFromScore } from "@/utils";
import { POLLING_INTERVALS } from "@/constants";
import { safeArray } from "@/utils";
import { apiClient } from "@/services/apiClient";
import Pagination from "@/components/Pagination";
import TableSkeleton from "@/components/TableSkeleton";

export default function EmployeesList() {
  const router = useRouter();
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<IPaginationMeta | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("currentTrustScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [loading, setLoading] = useState(true);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc"); // Trust scores default to lowest first to spot risks
    }
    setPage(1);
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const queryParams: Record<string, any> = {
        page,
        pageSize: 10,
        sortBy,
        sortOrder,
      };
      if (searchTerm) queryParams.search = searchTerm;
      if (statusFilter !== "All") queryParams.status = statusFilter;

      const res = await apiClient.get<IPaginatedResponse<IEmployee>>("/api/employees", queryParams);
      setEmployees(safeArray<IEmployee>(res?.items));
      if (res?.pagination) {
        setPaginationMeta(res.pagination);
      }
    } catch (e) {
      console.error("Failed to load employees:", e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(true), POLLING_INTERVALS.EMPLOYEES);
    return () => clearInterval(interval);
  }, [load]);

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
            {paginationMeta ? `${paginationMeta.total} employees` : "Loading employees..."} under continuous surveillance
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
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, department, role..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Active", "Isolated", "Suspended"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Employee
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("department")}
                    className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Department
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("currentTrustScore")}
                    className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Trust Score
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <TableSkeleton cols={6} rows={6} />
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                      {searchTerm ? "No employees match your search." : "No employees found. Add one to get started."}
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const risk = getRiskLevelFromScore(emp.currentTrustScore);
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
        </div>

        <Pagination meta={paginationMeta} onPageChange={setPage} />
      </div>
    </div>
  );
}
