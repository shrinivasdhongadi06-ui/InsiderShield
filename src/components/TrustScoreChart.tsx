"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';

const data = [
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
  return (
    <div className="glass-panel p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Trust Score Evolution</h3>
          <p className="text-xs text-slate-500 mt-1">Average enterprise trust score over last 10 hours</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
          <TrendingDown className="w-3 h-3" />
          -78% today
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px]">
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
            <ReferenceLine y={50} stroke="#dc2626" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Isolation Threshold', fill: '#dc2626', fontSize: 10 }} />
            <Area type="natural" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
