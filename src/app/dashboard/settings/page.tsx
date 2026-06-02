"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Activity,
  BrainCircuit,
  Bell,
  Database,
  Play,
  Download,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { loadSettings, saveSettings } from "@/services/settingsStore";
import type { PlatformSettings } from "@/services/settingsStore";

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
          checked ? "bg-blue-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${color}`}>
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-800 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              value === opt
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ ok = true }: { ok?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        ok
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
      />
      {ok ? "Operational" : "Offline"}
    </span>
  );
}

// ─── Trust Engine Live Status Badge ──────────────────────────────────────────

function EngineStatusBadge({ sensitivity }: { sensitivity: string }) {
  const colors: Record<string, string> = {
    Conservative: "bg-blue-50 text-blue-700 border-blue-200",
    Balanced:     "bg-green-50 text-green-700 border-green-200",
    Aggressive:   "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${colors[sensitivity] ?? colors.Balanced}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      Trust Engine: {sensitivity}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [demoScenario, setDemoScenario] = useState("Insider Threat Scenario");
  const [demoEnabled, setDemoEnabled] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  if (!settings) return null; // wait for hydration

  const update = (patch: Partial<PlatformSettings>) => {
    setSettings((prev) => prev ? { ...prev, ...patch } : prev);
  };

  const handleSave = () => {
    if (!settings) return;
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure threat detection, trust engine, and monitoring parameters
          </p>
          <div className="mt-2">
            <EngineStatusBadge sensitivity={settings.sensitivity} />
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
            saved
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)]"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4" /> Saved to Trust Engine
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* ── 1. Threat Detection — Trust Engine Thresholds */}
      <SectionCard
        title="Trust Engine Thresholds"
        subtitle="These values directly control isolation, alert severity, and risk escalation"
        icon={Shield}
        iconColor="bg-red-50 text-red-600"
      >
        <Slider
          label="Isolation Threshold (auto-isolate below this trust score)"
          value={settings.isolationThreshold}
          min={10}
          max={50}
          unit=" pts"
          color="bg-red-50 text-red-700"
          onChange={(v) => update({ isolationThreshold: v })}
        />
        <Slider
          label="High Anomaly Threshold (anomaly score for High severity)"
          value={settings.highThreshold}
          min={10}
          max={40}
          unit=" pts"
          color="bg-orange-50 text-orange-700"
          onChange={(v) => update({ highThreshold: v })}
        />
        <Slider
          label="Critical Anomaly Threshold (anomaly score for Critical severity)"
          value={settings.criticalThreshold}
          min={30}
          max={80}
          unit=" pts"
          color="bg-rose-50 text-rose-700"
          onChange={(v) => update({ criticalThreshold: v })}
        />
        <div className="border-t border-slate-100 pt-4">
          <Toggle
            label="Auto-Isolate High-Risk Sessions"
            sub="Automatically suspend access when isolation threshold is crossed"
            checked={settings.autoIsolate}
            onChange={(v) => update({ autoIsolate: v })}
          />
        </div>
        <div className="border-t border-slate-100 pt-4">
          <RadioGroup
            label="Detection Sensitivity — affects all trust score calculations"
            options={["Conservative", "Balanced", "Aggressive"]}
            value={settings.sensitivity}
            onChange={(v) => update({ sensitivity: v as PlatformSettings['sensitivity'] })}
          />
          <div className="mt-2 text-xs text-slate-400">
            {settings.sensitivity === 'Conservative' && '↓ 0.7× multiplier — attenuates risk signals, fewer false positives'}
            {settings.sensitivity === 'Balanced'     && '1.0× multiplier — default trust engine behavior'}
            {settings.sensitivity === 'Aggressive'   && '↑ 1.35× multiplier — amplifies risk signals, higher sensitivity'}
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Monitoring Settings */}
      <SectionCard
        title="Monitoring Settings"
        subtitle="Configure behavioral monitoring parameters and polling frequency"
        icon={Activity}
        iconColor="bg-blue-50 text-blue-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle label="Monitor Login Hours"         checked={settings.monitorLogin}     onChange={(v) => update({ monitorLogin: v })} />
          <Toggle label="Monitor Device Usage"        checked={settings.monitorDevice}    onChange={(v) => update({ monitorDevice: v })} />
          <Toggle label="Monitor Downloads"           checked={settings.monitorDownloads} onChange={(v) => update({ monitorDownloads: v })} />
          <Toggle label="Monitor Session Duration"    checked={settings.monitorSession}   onChange={(v) => update({ monitorSession: v })} />
          <Toggle label="Monitor Location Changes"    checked={settings.monitorLocation}  onChange={(v) => update({ monitorLocation: v })} />
          <Toggle label="Monitor File Access Patterns" checked={settings.monitorFiles}   onChange={(v) => update({ monitorFiles: v })} />
        </div>
      </SectionCard>

      {/* ── 3. Trust Intelligence Engine */}
      <SectionCard
        title="Trust Intelligence Engine"
        subtitle="Behavioral trust decay, compounding anomaly detection, and explainability controls"
        icon={BrainCircuit}
        iconColor="bg-indigo-50 text-indigo-600"
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium text-slate-800">Trust Score Decay Sensitivity</p>
            <span className="text-xs text-slate-500 font-medium">
              {settings.trustDecaySensitivity < 34
                ? "Conservative"
                : settings.trustDecaySensitivity < 67
                ? "Balanced"
                : "Aggressive"}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.trustDecaySensitivity}
            onChange={(e) => update({ trustDecaySensitivity: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Conservative (slow decay)</span>
            <span>Aggressive (fast decay)</span>
          </div>
        </div>

        {/* Live Trust Engine summary */}
        <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-800 space-y-1">
          <p className="font-semibold text-indigo-700 uppercase tracking-wider mb-2">Engine Configuration Preview</p>
          <p>🔒 Isolation below trust score: <strong>{settings.isolationThreshold}</strong></p>
          <p>🔴 Critical alert at anomaly score: <strong>≥{settings.criticalThreshold}</strong></p>
          <p>🟠 High alert at anomaly score: <strong>≥{settings.highThreshold}</strong></p>
          <p>⚡ Sensitivity multiplier: <strong>{settings.sensitivity === 'Conservative' ? '0.7×' : settings.sensitivity === 'Balanced' ? '1.0×' : '1.35×'}</strong></p>
          <p>🔁 Auto-isolate: <strong>{settings.autoIsolate ? 'Enabled' : 'Disabled'}</strong></p>
        </div>
      </SectionCard>

      {/* ── 4. Alert Settings */}
      <SectionCard
        title="Alert & Notification Settings"
        subtitle="Configure where and how threat alerts are delivered"
        icon={Bell}
        iconColor="bg-amber-50 text-amber-600"
      >
        <div className="space-y-4">
          <Toggle
            label="Dashboard Alerts"
            sub="Show real-time alerts within the SOC dashboard"
            checked={settings.dashboardAlerts}
            onChange={(v) => update({ dashboardAlerts: v })}
          />
          <Toggle
            label="SOC Escalation Alerts"
            sub="Escalate critical threats to the security operations team"
            checked={settings.socEscalation}
            onChange={(v) => update({ socEscalation: v })}
          />
          <Toggle
            label="Auto Incident Escalation"
            sub="Automatically escalate unresolved incidents after 30 minutes"
            checked={settings.autoEscalation}
            onChange={(v) => update({ autoEscalation: v })}
          />
        </div>
      </SectionCard>

      {/* ── 5. System Health */}
      <SectionCard
        title="System Health"
        subtitle="Real-time status of all platform services"
        icon={Database}
        iconColor="bg-green-50 text-green-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "MongoDB Atlas",                sub: "Primary database cluster" },
            { label: "Trust Intelligence Engine",    sub: "Behavioral anomaly scoring" },
            { label: "Threat Detection Pipeline",    sub: "Alert severity classifier" },
            { label: "API Gateway",                  sub: "REST API layer" },
          ].map((svc) => (
            <div
              key={svc.label}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{svc.label}</p>
                <p className="text-xs text-slate-400">{svc.sub}</p>
              </div>
              <StatusDot ok />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span>Last health check: just now</span>
          <span className="font-medium text-green-600">All systems normal</span>
        </div>
      </SectionCard>

      {/* ── 6. Demo Mode */}
      <SectionCard
        title="Demo Simulation Mode"
        subtitle="Control demonstration scenarios for live presentations and investor demos"
        icon={Play}
        iconColor="bg-purple-50 text-purple-600"
      >
        <Toggle
          label="Demo Simulation Enabled"
          sub="Activates automated employee activity simulation for live demos"
          checked={demoEnabled}
          onChange={setDemoEnabled}
        />
        {demoEnabled && (
          <div className="border-t border-slate-100 pt-4">
            <RadioGroup
              label="Active Scenario"
              options={[
                "Normal Activity",
                "Insider Threat Scenario",
                "Critical Attack Simulation",
                "Data Exfiltration Demo",
              ]}
              value={demoScenario}
              onChange={setDemoScenario}
            />
            <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                Active Scenario
              </p>
              <p className="text-sm font-bold text-purple-900">{demoScenario}</p>
              <p className="text-xs text-purple-600 mt-1">
                {demoScenario === "Normal Activity" && "Simulates routine employee usage patterns with no anomalies."}
                {demoScenario === "Insider Threat Scenario" && "Simulates gradual trust score degradation with suspicious behavioral flags."}
                {demoScenario === "Critical Attack Simulation" && "Triggers critical-severity alerts with bulk download and off-hours access events."}
                {demoScenario === "Data Exfiltration Demo" && "Simulates mass data download events from an isolated endpoint."}
              </p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── 7. Report Exports */}
      <SectionCard
        title="Report Exports"
        subtitle="Generate and download compliance reports and audit logs"
        icon={Download}
        iconColor="bg-slate-100 text-slate-600"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Export Threat Report",        sub: "PDF / CSV", color: "border-red-200 hover:bg-red-50 hover:border-red-300 text-red-700" },
            { label: "Download Activity Logs",      sub: "JSON / CSV", color: "border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-blue-700" },
            { label: "Generate Incident Summary",   sub: "PDF Report", color: "border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700" },
          ].map((btn) => (
            <button
              key={btn.label}
              className={`flex items-center justify-between p-4 rounded-xl border bg-white transition-all group shadow-sm ${btn.color}`}
            >
              <div className="text-left">
                <p className="text-sm font-semibold">{btn.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{btn.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
