import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

export default function ActivityFeed({ logs }: { logs: any[] }) {
  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-xl">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Live Activity Stream
        </h3>
        <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-md border border-blue-100">Real-time</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {logs?.map((log, i) => (
          <div key={i} className="flex gap-4 items-start relative">
            {i !== logs.length - 1 && <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-slate-200"></div>}
            <div className={`w-[24px] h-[24px] rounded-full flex-shrink-0 z-10 border-2 border-white shadow-sm ${log.riskScore < 0 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <div className="flex-1 pb-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-semibold text-slate-900">{log.employeeId?.name || 'Unknown'}</span>
                  <span className="text-sm text-slate-500 ml-1">performed</span>
                  <span className={`text-sm font-medium ml-1 ${log.riskScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{log.action}</span>
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex gap-3">
                <span>Device: {log.device}</span>
                <span>IP: {log.ipAddress}</span>
              </div>
              {log.riskScore < 0 && (
                <div className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded-md border border-red-100 shadow-sm font-medium">
                  {log.details}
                </div>
              )}
            </div>
          </div>
        ))}
        {(!logs || logs.length === 0) && (
          <div className="text-center text-slate-500 py-8 text-sm">No recent activity detected.</div>
        )}
      </div>
    </div>
  );
}
