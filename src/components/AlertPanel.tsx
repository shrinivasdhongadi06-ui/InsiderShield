import { formatDistanceToNow } from 'date-fns';
import { AlertOctagon, BrainCircuit } from 'lucide-react';

export default function AlertPanel({ alerts }: { alerts: any[] }) {
  return (
    <div className="glass-panel border border-slate-800 bg-slate-900/40 flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-400" />
          Recent Threats
        </h3>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md">{alerts?.length || 0} Open</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {alerts?.map((alert, i) => (
          <div key={i} className={`p-4 rounded-lg border ${alert.severity === 'Critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-orange-500/5 border-orange-500/20'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {alert.severity}
                </span>
                <span className="text-sm font-semibold text-slate-200">{alert.title}</span>
              </div>
              <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
            </div>
            
            <p className="text-xs text-slate-400 mb-3">{alert.description}</p>
            
            <div className="bg-slate-950/50 rounded-md p-3 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 mb-2">
                <BrainCircuit className="w-3.5 h-3.5" /> AI Reasoning
              </div>
              <ul className="space-y-1">
                {alert.reasoning.map((reason: string, rIdx: number) => (
                  <li key={rIdx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <span className="text-indigo-500 mt-[2px]">•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-3 flex justify-end gap-2">
              <button className="text-[11px] px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Dismiss</button>
              <button className="text-[11px] px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-500 transition-colors">Investigate</button>
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
