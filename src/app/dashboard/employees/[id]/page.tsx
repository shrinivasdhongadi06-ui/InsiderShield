"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ShieldCheck, AlertTriangle, BrainCircuit, Activity, ArrowLeft,
  Download, Clock, MapPin, Monitor, FileText, ShieldAlert,
  LogIn, LogOut, Upload, Usb, Mail, Video, Lock, Send, Zap,
  ChevronRight, TrendingDown, TrendingUp, Minus, X, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { getRiskLevelFromScore } from "@/utils";
import { POLLING_INTERVALS } from "@/constants";
import TrustBadge from "@/components/TrustBadge";
import ReasoningPanel from "@/components/ReasoningPanel";

function getRiskLevel(score: number) {
  const { label, color, bg } = getRiskLevelFromScore(score);
  const labelMap: Record<string, string> = {
    Low: 'Low Risk', Medium: 'Medium Risk', High: 'High Risk', Critical: 'Critical Risk',
  };
  return { label: labelMap[label] ?? label, color, bg, border: bg.replace('bg-', 'border-').replace('-50', '-200').replace('-100', '-300') };
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className="text-lg font-bold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

// ── Action definitions ──────────────────────────────────────────────────────
const ACTIONS = [
  { id: "login",           label: "Login",                  icon: LogIn,   color: "text-green-600 bg-green-50 border-green-200" },
  { id: "logout",          label: "Logout",                 icon: LogOut,  color: "text-slate-600 bg-slate-50 border-slate-200" },
  { id: "access_file",     label: "Access File",            icon: FileText, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "download_file",   label: "Download File",          icon: Download, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "upload_file",     label: "Upload File",            icon: Upload,  color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "email_sent",      label: "Email Sent",             icon: Mail,    color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { id: "join_meeting",    label: "Join Meeting",           icon: Video,   color: "text-teal-600 bg-teal-50 border-teal-200" },
  { id: "usb_inserted",    label: "USB Device Inserted",    icon: Usb,     color: "text-orange-600 bg-orange-50 border-orange-200" },
  { id: "remote_login",    label: "Remote Login",           icon: Monitor, color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  { id: "unauth_file",     label: "Unauthorized File Access", icon: Lock,  color: "text-red-600 bg-red-50 border-red-200" },
] as const;

// ── Per-action field visibility map ─────────────────────────────────────────
// Only the fields listed here will render in the submission form.
const FIELD_MAP: Record<string, string[]> = {
  login:       ['device', 'location', 'loginHour'],
  logout:      ['sessionDuration'],
  access_file: ['filesAccessed', 'device', 'location'],
  download_file: ['downloads', 'device', 'location'],
  upload_file: ['filesAccessed', 'device', 'location'],
  email_sent:  ['device', 'location'],
  join_meeting: ['device', 'location'],
  usb_inserted: ['deviceName', 'device', 'location'],
  remote_login: ['device', 'location', 'loginHour'],
  unauth_file: ['filesAccessed', 'device', 'location'],
};

// Which fields should appear in the Live Timeline for each action.
const TIMELINE_FIELDS: Record<string, string[]> = {
  login:       ['device', 'location', 'loginHour'],
  logout:      ['sessionDuration'],
  access_file: ['filesAccessed', 'device', 'location'],
  download_file: ['downloads', 'device'],
  upload_file: ['filesAccessed', 'device', 'location'],
  email_sent:  ['device', 'location'],
  join_meeting: ['device', 'location'],
  usb_inserted: ['device', 'location'],
  remote_login: ['device', 'location', 'loginHour'],
  unauth_file: ['filesAccessed', 'device', 'location'],
};

// Resolve an action label → id for FIELD_MAP lookups in the timeline.
function actionLabelToId(label: string): string {
  const found = ([
    ['login', 'Login'],
    ['logout', 'Logout'],
    ['access_file', 'Access File'],
    ['download_file', 'Download File'],
    ['upload_file', 'Upload File'],
    ['email_sent', 'Email Sent'],
    ['join_meeting', 'Join Meeting'],
    ['usb_inserted', 'USB Device Inserted'],
    ['remote_login', 'Remote Login'],
    ['unauth_file', 'Unauthorized File Access'],
  ] as [string, string][]).find(([, lbl]) => lbl.toLowerCase() === label.toLowerCase());
  return found ? found[0] : '';
}

export default function EmployeeDashboard() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Activity Actions panel state
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // Form field state (pre-filled from baseline on action select)
  const [formDevice, setFormDevice]         = useState("");
  const [formDeviceName, setFormDeviceName] = useState("");  // USB-specific
  const [formLocation, setFormLocation]     = useState("");
  const [formDownloads, setFormDownloads]   = useState(0);
  const [formFiles, setFormFiles]           = useState(0);
  const [formSession, setFormSession]       = useState(0);
  const [formHour, setFormHour]             = useState(new Date().getHours());

  const fetchData = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/employees/${params.id}`);
      if (res.status === 404) { router.push("/dashboard/employees"); return; }
      const json = await res.json();
      const result = json?.success ? json.data : json;
      if (result?.employee) setData(result);
      setLoading(false);
    } catch (err) {
      console.error('[Employee Detail]', err);
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVALS.EMPLOYEES);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Pre-fill form when an action is selected
  const handleSelectAction = (actionId: string, employee: any) => {
    setSelectedAction(actionId);
    setFormDevice(employee.baseline.trustedDevices?.[0] || "");
    setFormDeviceName("");
    setFormLocation(employee.baseline.normalLocation || "Office");
    setFormDownloads(employee.baseline.normalDownloads || 0);
    setFormFiles(employee.baseline.normalFilesAccessed || 0);
    setFormSession(employee.baseline.normalSessionDuration || 0);
    setFormHour(new Date().getHours());
    setFormOpen(true);
    setLastResult(null);
    setShowResult(false);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedAction(null);
  };

  const handleSubmitActivity = async () => {
    if (!selectedAction || !data?.employee) return;
    setSubmitting(true);
    try {
      const actionDef = ACTIONS.find(a => a.id === selectedAction);
      const res = await fetch("/api/activity/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId:     data.employee._id,
          action:         actionDef?.label ?? selectedAction,
          device:         formDeviceName ? `${formDeviceName} (${formDevice})` : formDevice,
          location:       formLocation,
          downloads:      formDownloads,
          filesAccessed:  formFiles,
          sessionDuration: formSession,
          loginHour:      formHour,
        }),
      });
      const json = await res.json();
      const result = json?.success ? json.data : null;
      setLastResult(result);
      setShowResult(true);
      setFormOpen(false);
      await fetchData();
    } catch (err) {
      console.error('[Submit Activity]', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.employee) {
    return <div className="text-center p-8 text-slate-500">Employee not found.</div>;
  }

  const { employee, logs, alerts, trustHistory } = data;
  const risk = getRiskLevel(employee.currentTrustScore);

  const trustChartData = trustHistory.map((th: any) => ({
    time: format(new Date(th.timestamp), "HH:mm"),
    score: th.score,
    reason: th.changeReason,
  }));

  const downloadChartData = logs.slice(0, 20).reverse().map((log: any, i: number) => ({
    i: i + 1,
    downloads: log.downloads || 0,
    baseline: employee.baseline.normalDownloads,
  }));

  const recentAnomalies = logs.filter((l: any) => l.anomalyScore > 0).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/employees">
            <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${risk.bg} ${risk.border} ${risk.color}`}>
                {risk.label}
              </span>
              {employee.status === "Isolated" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                  <ShieldAlert className="w-3.5 h-3.5" /> Session Isolated
                </span>
              )}
              {employee.status === "Active" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active Monitoring
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{employee.role} · {employee.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium mb-1">Trust Score</div>
            <TrustBadge score={employee.currentTrustScore} showBar showLabel size="lg" />
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Login Hours" value={employee.baseline.normalLoginHourRange} color="bg-blue-50 text-blue-600" />
        <StatCard icon={MapPin} label="Primary Location" value={employee.baseline.normalLocation} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Download} label="Daily Downloads" value={`~${employee.baseline.normalDownloads ?? 0} files`} color="bg-green-50 text-green-600" />
        <StatCard icon={Monitor} label="Trusted Devices" value={employee.baseline.trustedDevices?.length ?? 0} sub={employee.baseline.trustedDevices[0]} color="bg-orange-50 text-orange-600" />
      </div>

      {/* ── Behavior Baseline Card ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Behavior Baseline Profile</h3>
          <span className="ml-auto text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">Read-only · Used by Trust Engine</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Trusted Devices",      value: (employee.baseline.trustedDevices ?? []).join(", ") || "—" },
            { label: "Normal Location",       value: employee.baseline.normalLocation || "—" },
            { label: "Normal Downloads",      value: `${employee.baseline.normalDownloads ?? 0} files/day` },
            { label: "Normal Files Accessed", value: `${employee.baseline.normalFilesAccessed ?? 0} files/day` },
            { label: "Normal Session",        value: `${employee.baseline.normalSessionDuration ?? 0} min` },
            { label: "Login Hour Range",      value: employee.baseline.normalLoginHourRange || "09:00–17:00" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-xs font-medium text-slate-800 truncate" title={value}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity Actions Panel ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Activity Actions</h3>
          <span className="ml-2 text-xs text-slate-500">Select an action to submit through the Trust Engine</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleSelectAction(action.id, employee)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all hover:shadow-sm hover:scale-[1.02] ${action.color}`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-50" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Activity Input Form (inline slide-in) ─────────────────────────── */}
      {formOpen && selectedAction && (() => {
        const actionDef = ACTIONS.find(a => a.id === selectedAction);
        const ActionIcon = actionDef?.icon ?? Activity;
        return (
          <div className="bg-white border-2 border-indigo-200 rounded-xl shadow-lg p-5 relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <ActionIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Submit Activity: {actionDef?.label}</div>
                <div className="text-xs text-slate-500">Values pre-filled from baseline · Modify as needed</div>
              </div>
              <button onClick={handleCloseForm} className="ml-auto p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Dynamic fields — only fields relevant to this action are shown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              {(FIELD_MAP[selectedAction] ?? []).map((field) => {
                if (field === 'device') return (
                  <div key="device">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Device</label>
                    <input type="text" value={formDevice} onChange={e => setFormDevice(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="e.g. Corporate Laptop" />
                  </div>
                );
                if (field === 'deviceName') return (
                  <div key="deviceName">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">USB Device Name</label>
                    <input type="text" value={formDeviceName} onChange={e => setFormDeviceName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="e.g. Kingston 64GB" />
                  </div>
                );
                if (field === 'location') return (
                  <div key="location">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                    <input type="text" value={formLocation} onChange={e => setFormLocation(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="e.g. Office" />
                  </div>
                );
                if (field === 'loginHour') return (
                  <div key="loginHour">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Login Hour (0–23)</label>
                    <input type="number" min={0} max={23} value={formHour} onChange={e => setFormHour(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                );
                if (field === 'downloads') return (
                  <div key="downloads">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Downloads (files)</label>
                    <input type="number" min={0} value={formDownloads} onChange={e => setFormDownloads(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                );
                if (field === 'filesAccessed') return (
                  <div key="filesAccessed">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Files Accessed</label>
                    <input type="number" min={0} value={formFiles} onChange={e => setFormFiles(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                );
                if (field === 'sessionDuration') return (
                  <div key="sessionDuration">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Session Duration (min)</label>
                    <input type="number" min={0} value={formSession} onChange={e => setFormSession(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  </div>
                );
                return null;
              })}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmitActivity}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting to Trust Engine..." : "Submit Activity"}
              </button>
              <button onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <span className="ml-auto text-xs text-slate-400">Will flow: Activity → Trust Engine → Alert</span>
            </div>
          </div>
        );
      })()}

      {/* ── Trust Engine Result Card ──────────────────────────────────────── */}
      {showResult && lastResult && (
        <div className={`rounded-xl border-2 p-5 relative ${
          lastResult.anomalyScore > 0
            ? "bg-red-50 border-red-200"
            : "bg-green-50 border-green-200"
        }`}>
          <button onClick={() => setShowResult(false)} className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3 mb-3">
            {lastResult.anomalyScore > 0
              ? <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              : <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            }
            <div>
              <div className="font-semibold text-slate-900 text-sm">
                Trust Engine Result · <span className="font-bold">{lastResult.action}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {lastResult.alertCreated ? `🚨 Alert generated · Severity: ${lastResult.severity}` : "✅ No alert — behavior within normal range"}
              </div>
            </div>
            <div className="ml-auto flex gap-4 text-right">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Anomaly</div>
                <div className={`text-lg font-bold ${lastResult.anomalyScore > 0 ? "text-red-600" : "text-green-600"}`}>
                  {lastResult.anomalyScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Trust Δ</div>
                <div className={`text-lg font-bold flex items-center gap-1 ${
                  lastResult.trustImpact > 0 ? "text-green-600" : lastResult.trustImpact < 0 ? "text-red-600" : "text-slate-500"
                }`}>
                  {lastResult.trustImpact > 0 ? <TrendingUp className="w-4 h-4" /> : lastResult.trustImpact < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  {lastResult.trustImpact > 0 ? "+" : ""}{lastResult.trustImpact}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">New Score</div>
                <div className="text-lg font-bold text-slate-800">{lastResult.newTrustScore}</div>
              </div>
            </div>
          </div>
          {lastResult.reasoning?.length > 0 && (
            <div className="border-t border-current border-opacity-10 pt-3 mt-1">
              <div className="text-xs font-semibold text-slate-600 mb-2">Trust Engine Reasoning</div>
              <ul className="space-y-1">
                {lastResult.reasoning.map((line: string, i: number) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="text-slate-400 mt-0.5">›</span>{line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trust Score Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Trust Score Evolution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Historical trust score over time. Red line = isolation threshold (50).</p>
          <div className="w-full min-w-0 h-[220px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trustChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: any, _: any, props: any) => [value, `Score (${props.payload.reason || ""})`]}
                />
                <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" dot={false} activeDot={{ r: 5, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Explainability Panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">AI Risk Analysis</h3>
            {alerts.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{alerts.length}</span>
            )}
          </div>
          <div className="flex-1 max-h-[320px] overflow-y-auto space-y-3 pr-1">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-green-400" />
                No anomalies detected
              </div>
            ) : (
              alerts.map((alert: any) => (
                <div key={alert._id} className={`p-3 rounded-lg border text-sm ${
                  alert.severity === "Critical" || alert.severity === "High"
                    ? "bg-red-50 border-red-100"
                    : "bg-orange-50 border-orange-100"
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 text-xs leading-snug">{alert.title}</span>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      alert.severity === "Critical" ? "bg-red-200 text-red-800" :
                      alert.severity === "High" ? "bg-red-100 text-red-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{alert.description}</p>
                  <ReasoningPanel reasoning={alert.reasoning ?? []} compact />
                  <div className="mt-2 text-[10px] text-slate-400">
                    {formatDistanceToNow(new Date(alert.timestamp))} ago
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Download Behavior Chart */}
      {downloadChartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" /> Download Behavior vs Baseline
          </h3>
          <p className="text-xs text-slate-500 mb-4">Recent activity compared to expected baseline. Orange bar = baseline threshold.</p>
          <div className="w-full min-w-0 h-[200px] sm:h-[250px] lg:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downloadChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="i" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} label={{ value: "Activity Events", position: "insideBottom", offset: -2, fontSize: 10, fill: "#94a3b8" }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
                <ReferenceLine y={employee.baseline.normalDownloads} stroke="#f97316" strokeDasharray="4 4" label={{ value: "baseline", fill: "#f97316", fontSize: 10, position: "insideTopRight" }} />
                <Bar dataKey="downloads" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* ── Live Activity Timeline ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-slate-900">Recent Activity Timeline</h3>
          <span className="ml-auto text-xs text-slate-500">{logs.length} events · newest first</span>
        </div>
        {logs.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">
            No activities yet. Use the Activity Actions panel above to generate events.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.slice(0, 15).map((log: any) => {
              const isAnomaly = log.anomalyScore > 0;
              return (
                <div key={log._id} className={`px-6 py-4 hover:bg-slate-50 transition-colors ${
                  isAnomaly ? "border-l-2 border-l-red-400" : "border-l-2 border-l-green-300"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isAnomaly ? "bg-red-100" : "bg-green-100"
                    }`}>
                      {isAnomaly
                        ? <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        : <ShieldCheck className="w-3.5 h-3.5 text-green-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{log.action}</span>
                        {isAnomaly && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">ANOMALY +{log.anomalyScore}</span>
                        )}
                        {log.trustImpact !== undefined && log.trustImpact !== 0 && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            log.trustImpact > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            Trust {log.trustImpact > 0 ? "+" : ""}{log.trustImpact ?? 0}
                          </span>
                        )}
                      </div>
                      {/* Timeline meta — only relevant fields per action */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        {(() => {
                          const aid = actionLabelToId(log.action);
                          const fields = TIMELINE_FIELDS[aid] ?? ['device', 'location'];
                          return (
                            <>
                              {fields.includes('device')        && log.device        && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{log.device}</span>}
                              {fields.includes('location')      && log.location       && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{log.location}</span>}
                              {fields.includes('loginHour')     && log.loginHour != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.loginHour}:00</span>}
                              {fields.includes('downloads')     && (log.downloads ?? 0) > 0 && <span className="flex items-center gap-1"><Download className="w-3 h-3" />{log.downloads} files</span>}
                              {fields.includes('filesAccessed') && (log.filesAccessed ?? 0) > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{log.filesAccessed} files</span>}
                              {fields.includes('sessionDuration') && (log.sessionDuration ?? 0) > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.sessionDuration} min</span>}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-medium text-slate-700">{format(new Date(log.timestamp), "MMM d, HH:mm")}</div>
                      <div className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(log.timestamp))} ago</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Legacy Detailed Activity Log Table ───────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Full Activity Log</h3>
          <span className="ml-auto text-xs text-slate-500">{logs.length} events</span>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Device</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Downloads</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Session</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Anomaly</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No activity recorded yet.</td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${log.anomalyScore > 0 ? "border-l-2 border-l-red-300" : ""}` }>
                    <td className="py-3 px-5">
                      <div className="text-xs font-medium text-slate-700">{format(new Date(log.timestamp), "MMM d, HH:mm:ss")}</div>
                      <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(log.timestamp))} ago</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-900">{log.action}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{log.details}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Monitor className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{log.device || "—"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {log.location || "—"}
                      </div>
                      <div className="text-slate-400 text-[11px]">{log.ipAddress}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {log.downloads ?? 0} files
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {log.sessionDuration ?? 0} min
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {log.anomalyScore > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="w-3 h-3" /> +{log.anomalyScore}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
                          <ShieldCheck className="w-3 h-3" /> Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
