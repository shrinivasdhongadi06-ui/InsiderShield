"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Users, AlertTriangle, Activity, Settings, LogOut } from 'lucide-react';

function NavLink({ href, icon: Icon, children, badge }: { href: string; icon: any; children: React.ReactNode; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white/90 backdrop-blur-xl flex flex-col h-screen sticky top-0 z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <Shield className="w-6 h-6 text-blue-600 mr-2" />
        <span className="font-bold text-lg text-slate-900 tracking-tight">InsiderShield</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Monitoring</div>

        <NavLink href="/dashboard" icon={LayoutDashboard}>Overview</NavLink>
        <NavLink href="/dashboard/employees" icon={Users}>Employees</NavLink>
        <NavLink href="/dashboard/threat-center" icon={AlertTriangle}>Threat Center</NavLink>
        <NavLink href="/dashboard/activity-logs" icon={Activity}>Activity Logs</NavLink>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <NavLink href="/dashboard/settings" icon={Settings}>Settings</NavLink>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
