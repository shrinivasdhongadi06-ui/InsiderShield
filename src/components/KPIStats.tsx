import { Users, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';

export default function KPIStats({ stats }: { stats: any }) {
  const kpis = [
    { label: 'Active Employees', value: stats?.activeEmployees || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Threats Detected', value: stats?.threatsDetected || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Avg Trust Score', value: stats?.avgTrustScore || 0, icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Isolated Sessions', value: stats?.isolatedSessions || 0, icon: UserX, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="glass-panel p-6 flex items-center gap-4 border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-colors">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${kpi.bg}`}>
            <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
          </div>
          <div>
            <div className="text-slate-400 text-sm font-medium">{kpi.label}</div>
            <div className="text-3xl font-bold text-white mt-1">{kpi.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
