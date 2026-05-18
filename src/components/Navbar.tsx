import { Search, Bell, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center text-sm text-slate-500 gap-2">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> SOC Active</span>
        <span className="px-2 text-slate-300">|</span>
        <span>Environment: Production</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search logs, IDs, IPs..." 
            className="bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">Admin Analyst</div>
            <div className="text-xs text-slate-500">Level 4 Clearance</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold shadow-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
