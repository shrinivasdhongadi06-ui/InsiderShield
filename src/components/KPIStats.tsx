import { Users, AlertTriangle, ShieldCheck, UserX } from 'lucide-react';
import type { IDashboardStats } from '@/types';

export default function KPIStats({ stats }: { stats: IDashboardStats | null }) {
  const kpis = [
    { label: 'Active Employees', value: stats?.activeEmployees ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Threats Detected', value: stats?.threatsDetected ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Avg Trust Score', value: stats?.avgTrustScore ?? 0, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Isolated Sessions', value: stats?.isolatedSessions ?? 0, icon: UserX, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {kpis.map((kpi, i) => (
        <div key={i} className="glass-panel p-6 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${kpi.bg}`}>
            <kpi.icon className={`w-7 h-7 ${kpi.color}`} />
          </div>
          <div>
            <div className="text-slate-500 text-sm font-medium">{kpi.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{kpi.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
