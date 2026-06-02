"use client";

import React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Radio,
  BrainCircuit,
  RefreshCw,
  ArrowUpDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { IActivityLog, IActivityAnalytics, IPaginatedResponse, IPaginationMeta } from "@/types";
import { getRiskLevel, RISK_BADGE_CLASSES, RISK_DOT_CLASSES } from "@/utils";
import { POLLING_INTERVALS } from "@/constants";
import { safeArray, formatShortDate } from "@/utils";
import { apiClient } from "@/services/apiClient";
import Pagination from "@/components/Pagination";
import TableSkeleton from "@/components/TableSkeleton";

// ─── Live Feed Entry ──────────────────────────────────────────────────────────

function FeedEntry({ log, isNew }: { log: IActivityLog; isNew: boolean }) {
  const emp = typeof log.employeeId === "object" ? log.employeeId as any : null;
  const risk = getRiskLevel(log.anomalyScore, log.riskScore);
  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg transition-all ${
        isNew ? "animate-pulse bg-blue-50/60" : "hover:bg-slate-50"
      }`}
    >
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RISK_DOT_CLASSES[risk]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700">
          <span className="font-semibold">{emp?.name || "Unknown"}</span>{" "}
          <span className="text-slate-500">{log.action}</span>
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          [{format(new Date(log.timestamp), "HH:mm")}] · {log.device} · {log.location}
        </p>
      </div>
    </div>
  );
}

// ─── Expanded Row Details ─────────────────────────────────────────────────────

function ExpandedDetails({ log }: { log: IActivityLog }) {
  return (
    <tr className="bg-slate-50/40">
      <td colSpan={9} className="px-6 py-4 border-b border-slate-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { label: "Login Hour", value: `${log.loginHour ?? "N/A"}:00` },
            { label: "Session Duration", value: `${log.sessionDuration ?? 0} min` },
            { label: "Downloads", value: log.downloads ?? 0 },
            { label: "Files Accessed", value: log.filesAccessed ?? 0 },
            { label: "Anomaly Score", value: `${log.anomalyScore ?? 0}%` },
            { label: "Trust Impact", value: log.trustImpact ?? 0 },
            { label: "IP Address", value: log.ipAddress || "N/A" },
            { label: "Risk Score", value: log.riskScore ?? 0 },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg p-3 border border-slate-200">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
        {log.details && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                AI Reasoning
              </span>
            </div>
            <p className="text-xs text-indigo-900 leading-relaxed">{log.details}</p>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Analytics Charts Section ─────────────────────────────────────────────────

function AnalyticsSection({ analytics }: { analytics: IActivityAnalytics | null }) {
  if (!analytics) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Downloads Over Time */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-900 mb-1">Downloads Over Time</p>
        <p className="text-xs text-slate-400 mb-4">Total file downloads per day</p>
        <div className="w-full min-w-0 h-[220px] sm:h-[280px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.downloadsByDay.map((d) => ({ ...d, date: formatShortDate(d.date) }))}>
              <defs>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="downloads" stroke="#3b82f6" strokeWidth={2} fill="url(#dlGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Score Spikes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-900 mb-1">Anomaly Score Spikes</p>
        <p className="text-xs text-slate-400 mb-4">Average anomaly score per day</p>
        <div className="w-full min-w-0 h-[220px] sm:h-[280px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.anomalyByDay.map((d) => ({ ...d, date: formatShortDate(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="anomaly" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trust Score Changes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-900 mb-1">Trust Score Trend</p>
        <p className="text-xs text-slate-400 mb-4">Average trust score across employees</p>
        <div className="w-full min-w-0 h-[220px] sm:h-[280px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trustHistory.map((d) => ({ ...d, date: formatShortDate(d.date) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="avgTrust" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Login Hour Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-900 mb-1">Login Hour Distribution</p>
        <p className="text-xs text-slate-400 mb-4">When employees log in (0–23h)</p>
        <div className="w-full min-w-0 h-[220px] sm:h-[280px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.loginHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 9 }} stroke="#cbd5e1" />
              <YAxis tick={{ fontSize: 10 }} stroke="#cbd5e1" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const FILTER_OPTIONS = ["All", "Normal", "Suspicious", "Critical"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<IPaginationMeta | null>(null);
  const [analytics, setAnalytics] = useState<IActivityAnalytics | null>(null);
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const queryParams: Record<string, any> = {
        page,
        pageSize: 10,
        sortBy,
        sortOrder,
      };
      if (filter !== "All") queryParams.filter = filter.toLowerCase();
      if (search) queryParams.search = search;

      const [logsRes, analyticsRes] = await Promise.all([
        apiClient.get<IPaginatedResponse<IActivityLog>>("/api/activity", queryParams),
        apiClient.get<IActivityAnalytics>("/api/activity/analytics"),
      ]);

      const incoming = safeArray<IActivityLog>(logsRes?.items);
      const incomingIds = new Set(incoming.map((l) => l._id));
      const freshIds = new Set<string>();
      incomingIds.forEach((id) => {
        if (!prevIdsRef.current.has(id)) freshIds.add(id);
      });
      setNewIds(freshIds);
      prevIdsRef.current = incomingIds;
      setTimeout(() => setNewIds(new Set()), 3000);

      setLogs(incoming);
      if (logsRes?.pagination) {
        setPaginationMeta(logsRes.pagination);
      }
      if (analyticsRes && typeof analyticsRes === "object") {
        setAnalytics(analyticsRes);
      }
    } catch (e) {
      console.error("Failed to fetch activity logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search, page, sortBy, sortOrder]);

  useEffect(() => {
    setLoading(true);
    fetchLogs(true);
  }, [filter, search, page, sortBy, sortOrder, fetchLogs]);

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(true), POLLING_INTERVALS.ACTIVITY_LOGS);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const liveFeed = logs.slice(0, 8);

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time employee behavior monitoring &amp; audit trail
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Main grid: Table + Live Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Table (3/4) */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
          <div>
            {/* Search + Filters */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search employee, device, location…"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-1">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filter === f
                        ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                        : "text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 ml-auto">
                {paginationMeta ? `${paginationMeta.total} records` : "Loading..."}
              </span>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th
                      onClick={() => handleSort("downloads")}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Downloads
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("filesAccessed")}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Files
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("anomalyScore")}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Risk
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("timestamp")}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                    >
                      <div className="flex items-center gap-1">
                        Time
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <TableSkeleton cols={9} rows={8} />
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                        No activity logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const emp = typeof log.employeeId === "object" ? log.employeeId as any : null;
                      const risk = getRiskLevel(log.anomalyScore, log.riskScore);
                      const isExpanded = expandedId === log._id;
                      return (
                        <React.Fragment key={log._id}>
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : log._id)}
                            className={`cursor-pointer transition-colors group ${
                              newIds.has(log._id) ? "bg-blue-50/50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{emp?.name || "Unknown"}</p>
                              <p className="text-xs text-slate-400">{emp?.department || ""}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 max-w-[130px]">
                              <span className="truncate block">{log.action}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600">{log.device || "—"}</td>
                            <td className="px-4 py-3 text-xs text-slate-600">{log.location || "—"}</td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.downloads ?? 0}</td>
                            <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.filesAccessed ?? 0}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${RISK_BADGE_CLASSES[risk]}`}>
                                {risk}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                              )}
                            </td>
                          </tr>
                          {isExpanded && <ExpandedDetails log={log} />}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination meta={paginationMeta} onPageChange={setPage} />
        </div>

        {/* Live Feed (1/4) */}
        <div className="xl:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-green-500" />
              <span className="text-sm font-semibold text-slate-900">Live Feed</span>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[440px]">
            {loading ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-slate-200 mt-1.5" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-slate-200 rounded-md w-2/3" />
                      <div className="h-2 bg-slate-100 rounded-md w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : liveFeed.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent activity.</p>
            ) : (
              liveFeed.map((log) => (
                <FeedEntry key={log._id} log={log} isNew={newIds.has(log._id)} />
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 text-center bg-slate-50">
            <p className="text-[10px] text-slate-400">Auto-refreshes every 5 seconds</p>
          </div>
        </div>
      </div>

      {/* ── Analytics Charts */}
      <AnalyticsSection analytics={analytics} />
    </div>
  );
}
