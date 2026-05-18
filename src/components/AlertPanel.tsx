import { formatDistanceToNow } from 'date-fns';
import { AlertOctagon, BrainCircuit } from 'lucide-react';

export default function AlertPanel({ alerts }: { alerts: any[] }) {
  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-xl">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          Recent Threats
        </h3>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200">{alerts?.length || 0} Open</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {alerts?.map((alert, i) => (
          <div key={i} className={`p-4 rounded-lg border shadow-sm ${alert.severity === 'Critical' ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${alert.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                  {alert.severity}
                </span>
                <span className="text-sm font-semibold text-slate-900">{alert.title}</span>
              </div>
              <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
            </div>
            
            <p className="text-xs text-slate-600 mb-3">{alert.description}</p>
            
            <div className="bg-white rounded-md p-3 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-2">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Reasoning
              </div>
              <ul className="space-y-1">
                {alert.reasoning.map((reason: string, rIdx: number) => (
                  <li key={rIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <span className="text-indigo-600 mt-[3px]">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button className="text-[11px] px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm font-medium">Dismiss</button>
              <button className="text-[11px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium">Investigate</button>
            </div>
          </div>
        ))}
        {(!alerts || alerts.length === 0) && (
          <div className="text-center text-slate-500 py-8 text-sm">No active threats detected.</div>
        )}
      </div>
    </div>
  );
}
