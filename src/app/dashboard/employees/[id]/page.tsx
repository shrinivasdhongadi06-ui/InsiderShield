"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ShieldCheck, AlertTriangle, BrainCircuit, Activity, ArrowLeft,
  Download, Clock, MapPin, Monitor, FileText, ShieldAlert, UserX
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

function getRiskLevel(score: number) {
  if (score >= 80) return { label: "Low Risk", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
  if (score >= 60) return { label: "Medium Risk", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
  if (score >= 40) return { label: "High Risk", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  return { label: "Critical Risk", color: "text-red-900", bg: "bg-red-100", border: "border-red-300" };
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

export default function EmployeeDashboard() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulatingIsolation, setSimulatingIsolation] = useState(false);

  const fetchData = async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/employees/${params.id}`);
      if (res.status === 404) { router.push("/dashboard/employees"); return; }
      const result = await res.json();
      if (result.employee) setData(result);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleIsolate = async () => {
    setSimulatingIsolation(true);
    await fetch("/api/simulate", { method: "POST" });
    await fetchData();
    setSimulatingIsolation(false);
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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Trust Score</div>
            <div className={`text-4xl font-bold ${employee.currentTrustScore >= 80 ? "text-green-600" : employee.currentTrustScore >= 60 ? "text-orange-500" : "text-red-600"}`}>
              {employee.currentTrustScore}
            </div>
          </div>
          <button
            onClick={handleIsolate}
            disabled={simulatingIsolation}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-60"
          >
            <UserX className="w-4 h-4" />
            {simulatingIsolation ? "Simulating..." : "Force Simulate"}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Login Hours" value={employee.baseline.normalLoginHourRange} color="bg-blue-50 text-blue-600" />
        <StatCard icon={MapPin} label="Primary Location" value={employee.baseline.normalLocation} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Download} label="Daily Downloads" value={`~${employee.baseline.normalDownloads ?? 0} files`} color="bg-green-50 text-green-600" />
        <StatCard icon={Monitor} label="Trusted Devices" value={employee.baseline.trustedDevices?.length ?? 0} sub={employee.baseline.trustedDevices[0]} color="bg-orange-50 text-orange-600" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trust Score Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Trust Score Evolution
          </h3>
          <p className="text-xs text-slate-500 mb-4">Historical trust score over time. Red line = isolation threshold (50).</p>
          <div className="w-full h-[280px] min-w-0">
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
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                  <div className="bg-white rounded p-2 border border-slate-100">
                    <div className="text-[10px] font-semibold text-indigo-600 mb-1 uppercase tracking-wider">Behavioral Deviations</div>
                    <ul className="space-y-0.5">
                      {alert.reasoning?.map((r: string, i: number) => (
                        <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
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
          <div className="w-full h-[200px] min-w-0">
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

      {/* Activity Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-slate-900">Recent Activity Log</h3>
          <span className="ml-auto text-xs text-slate-500">{logs.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
                  <tr key={log._id} className={`hover:bg-slate-50 transition-colors ${log.anomalyScore > 0 ? "border-l-2 border-l-red-300" : ""}`}>
                    <td className="py-3 px-5">
                      <div className="text-xs font-medium text-slate-700">{format(new Date(log.timestamp), "MMM d, HH:mm:ss")}</div>
                      <div className="text-xs text-slate-400">{formatDistanceToNow(new Date(log.timestamp))} ago</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm font-medium text-slate-900">{log.action}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{log.details}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[100px]">{log.device || "—"}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {log.location || "—"}
                      </div>
                      <div className="text-slate-400 text-[11px]">{log.ipAddress}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {log.downloads ?? 0} files
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {log.sessionDuration ?? 0} min
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
