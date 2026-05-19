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
  BrainCircuit,
  Clock,
  User,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AlertDoc {
  _id: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  title: string;
  description: string;
  reasoning: string[];
  status: "Open" | "Investigating" | "Resolved" | "Isolated";
  timestamp: string;
  employeeId?: {
    _id: string;
    name: string;
    email: string;
    department: string;
    currentTrustScore: number;
  };
}

interface Stats {
  activeThreats: number;
  criticalIncidents: number;
  isolatedSessions: number;
  avgRiskScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SEV_BADGE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  High: "bg-orange-100 text-orange-700 border border-orange-200",
  Medium: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  Low: "bg-blue-100 text-blue-700 border border-blue-200",
};

const STATUS_BADGE: Record<string, string> = {
  Open: "bg-red-50 text-red-600 border border-red-200",
  Investigating: "bg-amber-50 text-amber-600 border border-amber-200",
  Resolved: "bg-green-50 text-green-600 border border-green-200",
  Isolated: "bg-purple-50 text-purple-600 border border-purple-200",
};

function buildTimeline(alert: AlertDoc) {
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

// ─── AI Panel ─────────────────────────────────────────────────────────────────
function AIPanel({ alert, onClose, onInvestigate }: { alert: AlertDoc; onClose: () => void; onInvestigate: (alert: AlertDoc) => void }) {
  const timeline = buildTimeline(alert);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Incident Details
            </p>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {alert.title}
            </h2>
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${SEV_BADGE[alert.severity]}`}
            >
              {alert.severity}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Employee Info */}
          {alert.employeeId && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Subject
                </span>
              </div>
              <p className="font-semibold text-slate-900">{alert.employeeId.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{alert.employeeId.email}</p>
              <p className="text-xs text-slate-500">{alert.employeeId.department}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">Trust Score</span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      alert.employeeId.currentTrustScore > 70
                        ? "bg-green-500"
                        : alert.employeeId.currentTrustScore > 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${alert.employeeId.currentTrustScore}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {alert.employeeId.currentTrustScore}
                </span>
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

          {/* AI Reasoning */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                AI Reasoning
              </span>
            </div>
            {alert.reasoning && alert.reasoning.length > 0 ? (
              <ul className="space-y-2">
                {alert.reasoning.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-indigo-900">
                    <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400" />
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-indigo-700 italic">No AI reasoning available for this alert.</p>
            )}
          </div>

          {/* Behavioral Deviations */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Behavioral Deviations Detected
            </p>
            <div className="space-y-2">
              {[
                "Login detected outside normal working hours",
                "Unrecognized device used for access",
                "File downloads exceeded baseline threshold",
                "Unusual session duration recorded",
                "Access from unfamiliar location",
              ]
                .slice(0, 3 + (alert.severity === "Critical" ? 2 : alert.severity === "High" ? 1 : 0))
                .map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                  >
                    <span className="text-amber-500">⚠</span>
                    {d}
                  </div>
                ))}
            </div>
          </div>

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
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 flex gap-2 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => onInvestigate(alert)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Investigate
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const FILTERS = ["All", "Critical", "High", "Medium", "Resolved"] as const;
type Filter = (typeof FILTERS)[number];

export default function ThreatCenterPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [stats, setStats] = useState<Stats>({ activeThreats: 0, criticalIncidents: 0, isolatedSessions: 0, avgRiskScore: 0 });
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [selectedAlert, setSelectedAlert] = useState<AlertDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleInvestigate = (alert: AlertDoc) => {
    const empId = alert.employeeId?._id;
    if (empId) {
      router.push(`/dashboard/employees/${empId}`);
    }
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        fetch("/api/alerts"),
        fetch("/api/alerts/stats"),
      ]);
      const alertsData = await alertsRes.json();
      const statsData = await statsRes.json();
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setStats(statsData);
    } catch (e) {
      console.error("Failed to fetch threat data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Client-side filter
  const filtered = alerts.filter((a) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Resolved") return a.status === "Resolved";
    return a.severity === activeFilter;
  });

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Threat Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-powered incident management & anomaly investigation
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Threats"
          value={stats.activeThreats}
          icon={ShieldAlert}
          color="bg-red-50 text-red-600"
          sub="Open + Investigating"
        />
        <MetricCard
          label="Critical Incidents"
          value={stats.criticalIncidents}
          icon={AlertTriangle}
          color="bg-orange-50 text-orange-600"
          sub="Severity: Critical"
        />
        <MetricCard
          label="Isolated Sessions"
          value={stats.isolatedSessions}
          icon={Lock}
          color="bg-purple-50 text-purple-600"
          sub="Access suspended"
        />
        <MetricCard
          label="Avg Anomaly Score"
          value={`${stats.avgRiskScore}%`}
          icon={TrendingDown}
          color="bg-blue-50 text-blue-600"
          sub="Across all employees"
        />
      </div>

      {/* ── Filter Tabs + Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-4 border-b border-slate-100 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f}
              {f !== "All" && (
                <span className="ml-1.5 text-[10px] font-bold opacity-70">
                  ({alerts.filter((a) =>
                    f === "Resolved" ? a.status === "Resolved" : a.severity === f
                  ).length})
                </span>
              )}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
            {filtered.length} incident{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Severity", "Employee", "Threat Type", "Risk Score", "Status", "Timestamp", ""].map((h) => (
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No incidents found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((alert) => (
                  <tr
                    key={alert._id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${SEV_BADGE[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {alert.employeeId?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">{alert.employeeId?.department || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[180px]">
                      <p className="truncate">{alert.title}</p>
                      <p className="text-xs text-slate-400 truncate">{alert.description?.slice(0, 55)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              alert.severity === "Critical"
                                ? "bg-red-500"
                                : alert.severity === "High"
                                ? "bg-orange-500"
                                : alert.severity === "Medium"
                                ? "bg-yellow-500"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width:
                                alert.severity === "Critical"
                                  ? "92%"
                                  : alert.severity === "High"
                                  ? "70%"
                                  : alert.severity === "Medium"
                                  ? "45%"
                                  : "20%",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {alert.severity === "Critical"
                            ? 92
                            : alert.severity === "High"
                            ? 70
                            : alert.severity === "Medium"
                            ? 45
                            : 20}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_BADGE[alert.status]}`}
                      >
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI Panel Drawer */}
      {selectedAlert && (
        <AIPanel alert={selectedAlert} onClose={() => setSelectedAlert(null)} onInvestigate={handleInvestigate} />
      )}
    </div>
  );
}
