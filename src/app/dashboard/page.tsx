"use client";

import { useState, useEffect } from "react";
import KPIStats from "@/components/KPIStats";
import ActivityFeed from "@/components/ActivityFeed";
import AlertPanel from "@/components/AlertPanel";
import TrustScoreChart from "@/components/TrustScoreChart";
import type { IDashboardStats, IActivityLog, IAlert, IPaginatedResponse } from "@/types";
import { POLLING_INTERVALS } from "@/constants";
import { safeArray } from "@/utils";
import { apiClient } from "@/services/apiClient";

export default function Dashboard() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [alerts, setAlerts] = useState<IAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsData, logsRes, alertsRes] = await Promise.all([
        apiClient.safeGet<IDashboardStats>("/api/dashboard/stats"),
        apiClient.safeGet<IPaginatedResponse<IActivityLog>>("/api/activity", { pageSize: 15 }),
        apiClient.safeGet<IPaginatedResponse<IAlert>>("/api/alerts", { pageSize: 15 }),
      ]);

      if (statsData) setStats(statsData);
      setLogs(safeArray<IActivityLog>(logsRes?.items));
      setAlerts(safeArray<IAlert>(alertsRes?.items));
    } catch (error) {
      console.error("Dashboard fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateActivity = async () => {
    try {
      await apiClient.post("/api/simulate");
      fetchData();
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVALS.DASHBOARD);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
            Real-time insider threat monitoring &amp; analysis
          </p>
        </div>

        <div className="flex gap-3">
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
        <div className="lg:col-span-2 w-full min-w-0">
          <div className="w-full min-w-0 h-[250px] sm:h-[300px] lg:h-[350px]">
            <TrustScoreChart />
          </div>
        </div>

        <div className="lg:col-span-1 h-[350px] w-full min-w-0">
          <AlertPanel alerts={alerts} />
        </div>
      </div>

      <div className="w-full min-w-0 h-[300px] sm:h-[350px] lg:h-[400px]">
        <ActivityFeed logs={logs} />
      </div>
    </div>
  );
}