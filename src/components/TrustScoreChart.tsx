"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
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
    <div className="glass-panel border border-slate-800 bg-slate-900/40 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Trust Score Evolution</h3>
          <p className="text-xs text-slate-400 mt-1">Average enterprise trust score over last 10 hours</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
          <TrendingDown className="w-3 h-3" />
          -78% today
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Isolation Threshold', fill: '#ef4444', fontSize: 10 }} />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
