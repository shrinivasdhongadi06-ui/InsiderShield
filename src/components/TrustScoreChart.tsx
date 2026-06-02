"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, ShieldAlert } from 'lucide-react';
import { apiClient } from "@/services/apiClient";
import type { IActivityAnalytics } from "@/types";
import { formatShortDate, safeArray } from "@/utils";
import { DEFAULT_THRESHOLDS } from "@/constants/trustRules";

const MOCK_DATA = [
  { time: '09:00', score: 98 },
  { time: '10:00', score: 98 },
  { time: '11:00', score: 97 },
  { time: '12:00', score: 99 },
  { time: '13:00', score: 95 },
  { time: '14:00', score: 96 },
  { time: '15:00', score: 85 },
  { time: '16:00', score: 70 },
  { time: '17:00', score: 45 },
  { time: '18:00', score: 20 },
];

export default function TrustScoreChart() {
  const [data, setData] = useState<{ time: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropVal, setDropVal] = useState("-0%");
  const [isPositive, setIsPositive] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const isolationThreshold = DEFAULT_THRESHOLDS.ISOLATION;

  useEffect(() => {
    async function load() {
      try {
        const analytics = await apiClient.safeGet<IActivityAnalytics>("/api/activity/analytics");
        if (analytics && Array.isArray(analytics.trustHistory) && analytics.trustHistory.length > 0) {
          const mapped = safeArray(analytics.trustHistory).map((d: any) => ({
            time: formatShortDate(d.date),
            score: Math.round(d.avgTrust),
          }));
          setData(mapped);

          // Calculate score drop or improvement if at least two points exist
          if (mapped.length >= 2) {
            const first = mapped[0].score;
            const last = mapped[mapped.length - 1].score;
            const diff = last - first;
            setDropVal(`${diff >= 0 ? "+" : ""}${diff}% today`);
            setIsPositive(diff >= 0);
            setMinScore(Math.min(...mapped.map((d: { time: string; score: number }) => d.score)));
          }
        } else {
          setData(MOCK_DATA);
        }
      } catch (e) {
        console.error("Failed to load trust score analytics:", e);
        setData(MOCK_DATA);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Trust Score Evolution</h3>
          <p className="text-xs text-slate-500 mt-1">Average enterprise trust score trends</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border font-medium ${
          isPositive
            ? 'text-green-600 bg-green-50 border-green-100'
            : 'text-red-600 bg-red-50 border-red-100'
        }`}>
          <TrendingDown className="w-3 h-3" />
          {dropVal}
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#0f172a', fontWeight: '500' }}
            />
            <ReferenceLine y={isolationThreshold} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: `Isolation Threshold (${isolationThreshold})`, fill: '#dc2626', fontSize: 10 }} />
            <Area type="natural" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
