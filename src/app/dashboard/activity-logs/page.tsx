"use client";

import React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  Activity,
  Search,
  ChevronDown,
  ChevronRight,
  Radio,
  BrainCircuit,
  RefreshCw,
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface LogDoc {
  _id: string;
  action: string;
  timestamp: string;
  device: string;
  ipAddress: string;
  riskScore: number;
  loginHour: number;
  downloads: number;
  filesAccessed: number;
  location: string;
  sessionDuration: number;
  anomalyScore: number;
  trustImpact: number;
  details: string;
  employeeId?: { _id: string; name: string; department: string; email: string };
}

interface Analytics {
  downloadsByDay: { date: string; downloads: number }[];
  anomalyByDay: { date: string; anomaly: number }[];
  loginHours: { hour: number; count: number }[];
  trustHistory: { date: string; avgTrust: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRiskLevel(log: LogDoc): "critical" | "suspicious" | "normal" {
  if (log.anomalyScore >= 70 || log.riskScore < -50) return "critical";
  if (log.anomalyScore >= 30 || log.riskScore < 0) return "suspicious";
  return "normal";
}

const RISK_COLORS = {
  critical: "bg-red-100 text-red-700 border border-red-200",
  suspicious: "bg-orange-100 text-orange-700 border border-orange-200",
  normal: "bg-green-100 text-green-700 border border-green-200",
};

const RISK_DOT = {
  critical: "bg-red-500",
  suspicious: "bg-orange-500",
  normal: "bg-green-500",
};

// ─── Live Feed Entry ──────────────────────────────────────────────────────────
function FeedEntry({ log, isNew }: { log: LogDoc; isNew: boolean }) {
  const risk = getRiskLevel(log);
  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg transition-all ${
        isNew ? "animate-pulse bg-blue-50/60" : "hover:bg-slate-50"
      }`}
    >
      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${RISK_DOT[risk]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700">
          <span className="font-semibold">{log.employeeId?.name || "Unknown"}</span>{" "}
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
function ExpandedDetails({ log }: { log: LogDoc }) {
  return (
    <tr>
      <td colSpan={8} className="bg-slate-50 px-6 py-4 border-b border-slate-100">
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
function AnalyticsSection({ analytics }: { analytics: Analytics | null }) {
  if (!analytics) return null;

  const shortDate = (d: string) => d.split("-").slice(1).join("/");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Downloads Over Time */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="text-sm font-semibold text-slate-900 mb-1">Downloads Over Time</p>
        <p className="text-xs text-slate-400 mb-4">Total file downloads per day</p>
        <div className="w-full min-w-0 h-[220px] sm:h-[280px] lg:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.downloadsByDay.map((d) => ({ ...d, date: shortDate(d.date) }))}>
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
            <BarChart data={analytics.anomalyByDay.map((d) => ({ ...d, date: shortDate(d.date) }))}>
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
            <LineChart data={analytics.trustHistory.map((d) => ({ ...d, date: shortDate(d.date) }))}>
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
  const [logs, setLogs] = useState<LogDoc[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterOption>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "All") params.set("filter", filter.toLowerCase());
      if (search) params.set("search", search);

      const [logsRes, analyticsRes] = await Promise.all([
        fetch(`/api/activity?${params.toString()}`),
        fetch("/api/activity/analytics"),
      ]);
      const logsData: LogDoc[] = await logsRes.json();
      const analyticsData = await analyticsRes.json();

      const incoming = Array.isArray(logsData) ? logsData : [];
      const incomingIds = new Set(incoming.map((l) => l._id));
      const freshIds = new Set<string>();
      incomingIds.forEach((id) => {
        if (!prevIdsRef.current.has(id)) freshIds.add(id);
      });
      setNewIds(freshIds);
      prevIdsRef.current = incomingIds;
      setTimeout(() => setNewIds(new Set()), 3000);

      setLogs(incoming);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error("Failed to fetch activity logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, search]);

  useEffect(() => {
    setLoading(true);
    fetchLogs(true);
  }, [filter, search, fetchLogs]);

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(true), 5000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Live feed = top 8 most recent
  const liveFeed = logs.slice(0, 8);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time employee behavior monitoring & audit trail
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
        <div className="xl:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search + Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, device, location…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-1">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto">{logs.length} records</span>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Employee", "Action", "Device", "Location", "Downloads", "Files", "Risk", "Time", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const risk = getRiskLevel(log);
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
                            <p className="text-sm font-semibold text-slate-900">
                              {log.employeeId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-slate-400">{log.employeeId?.department || ""}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 max-w-[130px]">
                            <span className="truncate block">{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{log.device || "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{log.location || "—"}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.downloads ?? 0}</td>
                          <td className="px-4 py-3 text-xs font-medium text-slate-700">{log.filesAccessed ?? 0}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${RISK_COLORS[risk]}`}>
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
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {liveFeed.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No recent activity.</p>
            ) : (
              liveFeed.map((log) => (
                <FeedEntry key={log._id} log={log} isNew={newIds.has(log._id)} />
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400">Auto-refreshes every 5 seconds</p>
          </div>
        </div>
      </div>

      {/* ── Analytics Charts */}
      <AnalyticsSection analytics={analytics} />
    </div>
  );
}
