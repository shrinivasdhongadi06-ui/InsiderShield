"use client";

import { useState, useEffect } from "react";
import KPIStats from "@/components/KPIStats";
import ActivityFeed from "@/components/ActivityFeed";
import AlertPanel from "@/components/AlertPanel";
import TrustScoreChart from "@/components/TrustScoreChart";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, logsRes, alertsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/activity"),
        fetch("/api/alerts"),
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();
      const alertsData = await alertsRes.json();

      setStats(statsData);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const simulateActivity = async () => {
    try {
      await fetch("/api/simulate", {
        method: "POST",
      });

      fetchData();
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  useEffect(() => {
    // Initial load
    fetchData();

    // Refresh dashboard data every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Security Operations Center
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Real-time insider threat monitoring & analysis
          </p>
        </div>

        <div className="flex gap-3">
          {/* <button
            onClick={() =>
              fetch("/api/seed").then(() => fetchData())
            }
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-all border border-slate-200 shadow-sm"
          >
            Reset Environment
          </button> */}

          <button
            onClick={simulateActivity}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all border border-transparent shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5"
          >
            Force Simulation
          </button>
        </div>
      </div>

      <KPIStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="h-[350px] w-full">
            <TrustScoreChart />
          </div>
        </div>

        <div className="lg:col-span-1 h-[350px]">
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      <div className="h-[400px]">
        <ActivityFeed logs={logs} />
      </div>
    </div>
  );
}