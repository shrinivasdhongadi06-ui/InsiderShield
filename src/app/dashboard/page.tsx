"use client";

import { useState, useEffect } from "react";
import KPIStats from "@/components/KPIStats";
import ActivityFeed from "@/components/ActivityFeed";
import AlertPanel from "@/components/AlertPanel";
import TrustScoreChart from "@/components/TrustScoreChart";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
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
      setLogs(logsData);
      setAlerts(alertsData);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Security Operations Center
          </h1>

          <p className="text-sm text-slate-400 mt-1">
            Real-time insider threat monitoring & analysis
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() =>
              fetch("/api/seed").then(() => fetchData())
            }
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-700"
          >
            Reset Environment
          </button>

          <button
            onClick={simulateActivity}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
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