"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  AlertTriangle,
  ShieldAlert,
  Lock,
  TrendingDown,
  X,
  ChevronRight,
  Clock,
  User,
  RefreshCw,
  ArrowUpDown,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type { IAlert, IThreatStats, IPaginatedResponse, IPaginationMeta, AlertSeverity, AlertStatus } from "@/types";
import {
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getSeverityRiskPercent,
  getSeverityBarColor,
  safeArray,
} from "@/utils";
import { POLLING_INTERVALS } from "@/constants";
import { apiClient } from "@/services/apiClient";
import { updateAlertStatus as apiUpdateAlertStatus, isTerminalStatus } from "@/services/alertLifecycle";
import Pagination from "@/components/Pagination";
import TableSkeleton from "@/components/TableSkeleton";
import ReasoningPanel from "@/components/ReasoningPanel";
import TrustBadge from "@/components/TrustBadge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTimeline(alert: IAlert) {
  const base = new Date(alert.timestamp).getTime();
  const entries = [
    { delta: 0, label: "Anomaly detected", icon: "🔍" },
    { delta: -120000, label: "Suspicious login recorded", icon: "🔐" },
    { delta: 60000, label: "Behavioral deviation flagged", icon: "⚠️" },
    { delta: 120000, label: "Alert raised in SOC", icon: "🚨" },
  ];
  if (alert.status === "Isolated") {
    entries.push({ delta: 180000, label: "Session isolated", icon: "🔒" });
  }
  if (alert.status === "Resolved") {
    entries.push({ delta: 300000, label: "Incident resolved", icon: "✅" });
  }
  if (alert.status === "Escalated") {
    entries.push({ delta: 240000, label: "Escalated to Tier 2 SOC Analyst", icon: "🔺" });
  }
  if (alert.status === "FalsePositive") {
    entries.push({ delta: 200000, label: "Marked as False Positive", icon: "ℹ️" });
  }
  return entries
    .map((e) => ({ ...e, time: new Date(base + e.delta) }))
    .sort((a, b) => a.time.getTime() - b.time.getTime());
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Alert Detail Drawer ──────────────────────────────────────────────────────

function AIPanel({
  alert,
  onClose,
  updateAlertStatus,
  actionLoading,
  actionError,
}: {
  alert: IAlert;
  onClose: () => void;
  updateAlertStatus: (alertId: string, status: AlertStatus, note?: string) => Promise<void>;
  actionLoading: boolean;
  actionError: string | null;
}) {
  const timeline = buildTimeline(alert);
  const employee = typeof alert.employeeId === "object" ? alert.employeeId as any : null;
  const [analystNote, setAnalystNote] = useState(alert.resolvedNote || "");
  const [noteValidationError, setNoteValidationError] = useState<string | null>(null);

  // For Investigate / Escalate — no note required, fire immediately
  const handleDirectAction = (targetStatus: AlertStatus) => {
    updateAlertStatus(alert._id, targetStatus);
  };

  // For Resolved / FalsePositive — note is mandatory
  const handleTerminalAction = (targetStatus: AlertStatus) => {
    const trimmed = analystNote.trim();
    if (!trimmed) {
      setNoteValidationError("Analyst note is required before resolving this alert.");
      return;
    }
    setNoteValidationError(null);
    updateAlertStatus(alert._id, targetStatus, trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Incident Details
              </p>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {alert.title}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityBadgeClass(alert.severity)}`}
                >
                  {alert.severity}
                </span>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(alert.status)}`}
                >
                  {alert.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* Employee Info */}
            {employee && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Subject
                  </span>
                </div>
                <p className="font-semibold text-slate-900">{employee.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{employee.email}</p>
                <p className="text-xs text-slate-500">{employee.department}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-500">Trust Score</span>
                  <TrustBadge score={employee.currentTrustScore} showBar showLabel size="sm" />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Threat Summary
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{alert.description}</p>
            </div>

            {/* Trust Intelligence Reasoning */}
            <ReasoningPanel reasoning={alert.reasoning} title="Trust Intelligence Reasoning" />

            {/* Incident Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Incident Timeline
                </p>
              </div>
              <div className="relative pl-5">
                {timeline.map((entry, i) => (
                  <div key={i} className="relative mb-4 last:mb-0">
                    {i < timeline.length - 1 && (
                      <div className="absolute left-[-13px] top-5 bottom-[-16px] w-px bg-slate-200" />
                    )}
                    <div className="absolute left-[-18px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {format(entry.time, "hh:mm a")}
                    </p>
                    <p className="text-sm text-slate-800 font-medium">
                      {entry.icon} {entry.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Resolution Summary (Resolved / FalsePositive only) ── */}
            {(alert.status === "Resolved" || alert.status === "FalsePositive") && (
              <div className="rounded-xl border overflow-hidden">
                {/* Section header */}
                <div className={`px-4 py-2.5 flex items-center gap-2 ${alert.status === "Resolved"
                    ? "bg-green-50 border-b border-green-100"
                    : "bg-slate-50 border-b border-slate-200"
                  }`}>
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 ${alert.status === "Resolved" ? "text-green-600" : "text-slate-500"
                    }`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${alert.status === "Resolved" ? "text-green-700" : "text-slate-600"
                    }`}>
                    Resolution Summary
                  </span>
                  {/* Status badge */}
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${alert.status === "Resolved"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                    {alert.status === "Resolved" ? "Resolved" : "False Positive"}
                  </span>
                </div>

                {/* Resolution body */}
                <div className={`px-4 py-3 space-y-3 ${alert.status === "Resolved" ? "bg-green-50/40" : "bg-slate-50/60"
                  }`}>
                  {/* Timestamp row */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        Resolved At
                      </p>
                      <p className="text-xs font-medium text-slate-700">
                        {alert.resolvedAt
                          ? format(new Date(alert.resolvedAt), "MMM d, yyyy • h:mm a")
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Analyst note */}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Analyst Note
                    </p>
                    {alert.resolvedNote ? (
                      <div className={`rounded-lg px-3 py-2.5 border text-xs text-slate-700 leading-relaxed whitespace-pre-wrap ${alert.status === "Resolved"
                          ? "bg-white border-green-100"
                          : "bg-white border-slate-200"
                        }`}>
                        {alert.resolvedNote}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No analyst note recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions for threat center lifecycle */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
          {/* Error toast */}
          {actionError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {alert.status !== "Resolved" && alert.status !== "FalsePositive" ? (
            <>
              {/* Investigate / Escalate — no note required */}
              <div className="flex gap-2">
                {alert.status !== "Investigating" && (
                  <button
                    onClick={() => handleDirectAction("Investigating")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Updating..." : "Investigate"}
                  </button>
                )}
                {alert.status !== "Escalated" && (
                  <button
                    onClick={() => handleDirectAction("Escalated")}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? "Updating..." : "Escalate"}
                  </button>
                )}
              </div>

              {/* Analyst Note — mandatory for Resolve / False Positive */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Analyst Note
                </label>
                <textarea
                  value={analystNote}
                  onChange={(e) => {
                    setAnalystNote(e.target.value);
                    if (noteValidationError) setNoteValidationError(null);
                  }}
                  placeholder="Enter investigation findings or justification..."
                  disabled={actionLoading}
                  rows={3}
                  className={`w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed ${noteValidationError
                      ? "border-red-400 bg-red-50/30"
                      : "border-slate-200 bg-white"
                    }`}
                />
                {noteValidationError && (
                  <p className="text-[11px] text-red-600 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {noteValidationError}
                  </p>
                )}
              </div>

              {/* Resolve / False Positive — note mandatory */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTerminalAction("FalsePositive")}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Updating..." : "False Positive"}
                </button>
                <button
                  onClick={() => handleTerminalAction("Resolved")}
                  disabled={actionLoading}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Updating..." : "Resolve Alert"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {alert.status === "FalsePositive" ? "Marked as False Positive" : "Resolved Incident"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Critical", "High", "Medium", "Open", "Investigating", "Resolved", "Escalated", "FalsePositive"] as const;
type Filter = (typeof FILTERS)[number];

const DEFAULT_STATS: IThreatStats = {
  activeThreats: 0,
  criticalIncidents: 0,
  isolatedSessions: 0,
  avgRiskScore: 0,
};

export default function ThreatCenterPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [paginationMeta, setPaginationMeta] = useState<IPaginationMeta | null>(null);
  const [stats, setStats] = useState<IThreatStats>(DEFAULT_STATS);

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedAlert, setSelectedAlert] = useState<IAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const updateAlertStatus = async (alertId: string, targetStatus: AlertStatus, note?: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await apiUpdateAlertStatus(alertId, targetStatus, { note });

      if (!result.success || !result.updated) {
        setActionError(result.error ?? "Failed to update alert. Please try again.");
        return;
      }

      const updated = result.updated;

      // Optimistic local update
      setAlerts((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));

      // Auto-close panel for terminal statuses (Resolved / FalsePositive)
      if (isTerminalStatus(targetStatus)) {
        setSelectedAlert(null);
      } else {
        // Keep panel open for Investigate / Escalate, update the displayed alert
        setSelectedAlert(updated);
      }

      // Refresh backend data to sync counts and list
      fetchData(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected error. Please try again.";
      setActionError(msg);
      console.error("[ThreatCenter] updateAlertStatus failed:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvestigateClick = (alert: IAlert) => {
    const emp = typeof alert.employeeId === "object" ? alert.employeeId as any : null;
    const empId = emp?._id;
    if (empId) {
      router.push(`/dashboard/employees/${empId}`);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const queryParams: Record<string, any> = {
        page,
        pageSize: 10,
        sortBy,
        sortOrder,
      };

      // Set filter params based on tab selection
      if (activeFilter !== "All") {
        if (["Critical", "High", "Medium", "Low"].includes(activeFilter)) {
          queryParams.severity = activeFilter;
        } else {
          queryParams.status = activeFilter;
        }
      }

      const [alertsRes, statsRes] = await Promise.all([
        apiClient.get<IPaginatedResponse<IAlert>>("/api/alerts", queryParams),
        apiClient.get<IThreatStats>("/api/alerts/stats"),
      ]);

      const items = safeArray<IAlert>(alertsRes?.items);
      setAlerts(items);
      if (alertsRes?.pagination) {
        setPaginationMeta(alertsRes.pagination);
      }
      if (statsRes && typeof statsRes === "object") {
        setStats(statsRes);
      }
    } catch (e) {
      console.error("Failed to fetch threat data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, page, sortBy, sortOrder]);

  useEffect(() => {
    setLoading(true);
    fetchData(true);
  }, [activeFilter, page, sortBy, sortOrder, fetchData]);

  useEffect(() => {
    const interval = setInterval(() => fetchData(true), POLLING_INTERVALS.THREAT_CENTER);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Client-side search match (since populate join might match name)
  const filtered = alerts.filter((a) => {
    if (!search) return true;
    const emp = typeof a.employeeId === "object" ? a.employeeId as any : null;
    const empName = emp?.name?.toLowerCase() ?? "";
    const title = (a.title ?? "").toLowerCase();
    const desc = (a.description ?? "").toLowerCase();
    const s = search.toLowerCase();
    return empName.includes(s) || title.includes(s) || desc.includes(s);
  });

  return (
    <div className="space-y-6">
      {/* ── Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Threat Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered incident management &amp; anomaly investigation
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Active Threats" value={stats.activeThreats} icon={ShieldAlert} color="bg-red-50 text-red-600" sub="Open + Investigating" />
        <MetricCard label="Critical Incidents" value={stats.criticalIncidents} icon={AlertTriangle} color="bg-orange-50 text-orange-600" sub="Severity: Critical" />
        <MetricCard label="Isolated Sessions" value={stats.isolatedSessions} icon={Lock} color="bg-purple-50 text-purple-600" sub="Access suspended" />
        <MetricCard label="Avg Anomaly Score" value={`${stats.avgRiskScore}%`} icon={TrendingDown} color="bg-blue-50 text-blue-600" sub="Across all employees" />
      </div>

      {/* ── Filter Tabs + Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between min-h-[500px]">
        <div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-4 border-b border-slate-100 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => { setActiveFilter(f); setPage(1); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeFilter === f
                    ? "bg-blue-600 text-white shadow-sm border border-blue-600"
                    : "text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by subject name or keyword..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th
                    onClick={() => handleSort("severity")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Severity
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Threat Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("timestamp")}
                    className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Timestamp
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <TableSkeleton cols={7} rows={8} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                      No incidents found for this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((alert) => {
                    const emp = typeof alert.employeeId === "object" ? alert.employeeId as any : null;
                    return (
                      <tr
                        key={alert._id}
                        onClick={() => setSelectedAlert(alert)}
                        className="hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getSeverityBadgeClass(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-900">{emp?.name || "Unknown"}</p>
                          <p className="text-xs text-slate-400">{emp?.department || ""}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 max-w-[180px]">
                          <p className="font-medium text-slate-800 truncate">{alert.title}</p>
                          <p className="text-xs text-slate-400 truncate">{alert.description?.slice(0, 55)}…</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getSeverityBarColor(alert.severity)}`}
                                style={{ width: `${getSeverityRiskPercent(alert.severity)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-700">
                              {getSeverityRiskPercent(alert.severity)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusBadgeClass(alert.status)}`}>
                            {alert.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
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

      {/* ── Alert Detail Drawer */}
      {selectedAlert && (
        <AIPanel
          alert={selectedAlert}
          onClose={() => { setSelectedAlert(null); setActionError(null); }}
          updateAlertStatus={updateAlertStatus}
          actionLoading={actionLoading}
          actionError={actionError}
        />
      )}
    </div>
  );
}
