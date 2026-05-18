import Link from 'next/link';
import { Shield, LayoutDashboard, Users, AlertTriangle, Activity, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white/90 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Shield className="w-6 h-6 text-blue-600 mr-2" />
        <span className="font-bold text-lg text-slate-900 tracking-tight">InsiderShield</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Monitoring</div>
        
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium transition-colors">
          <LayoutDashboard className="w-5 h-5" />
          Overview
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Users className="w-5 h-5" />
          Employees
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <AlertTriangle className="w-5 h-5" />
          Threat Center
          <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
        </Link>
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Activity className="w-5 h-5" />
          Activity Logs
        </Link>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <Link href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
