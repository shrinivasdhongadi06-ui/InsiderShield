"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { AlertOctagon, BrainCircuit } from "lucide-react";

interface Alert {
  _id?: string;
  severity: string;
  title: string;
  description: string;
  timestamp: string;
  reasoning?: string[];
  employeeId?: { _id?: string; name?: string } | string;
}

export default function AlertPanel({
  alerts,
}: {
  alerts: Alert[] | any;
}) {
  const router = useRouter();
  const safeAlerts: Alert[] = Array.isArray(alerts) ? alerts : [];

  // Track dismissed IDs + which ones are animating out
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  const getId = (alert: Alert, i: number) =>
    alert._id ?? `fallback-${i}`;

  const handleDismiss = (id: string) => {
    // Start fade-out
    setFadingIds((prev) => new Set(prev).add(id));
    // Remove after animation
    setTimeout(() => {
      setDismissedIds((prev) => new Set(prev).add(id));
      setFadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 350);
  };

  const handleInvestigate = (alert: Alert) => {
    const empId =
      typeof alert.employeeId === "object"
        ? alert.employeeId?._id
        : alert.employeeId;
    if (empId) {
      router.push(`/dashboard/employees/${empId}`);
    } else {
      router.push("/dashboard/threat-center");
    }
  };

  const visibleAlerts = safeAlerts.filter(
    (a, i) => !dismissedIds.has(getId(a, i))
  );

  return (
    <div className="glass-panel flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white/50 rounded-t-xl">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          Recent Threats
        </h3>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium border border-slate-200">
          {visibleAlerts.length} Open
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {safeAlerts.map((alert, i) => {
          const id = getId(alert, i);
          if (dismissedIds.has(id)) return null;
          const isFading = fadingIds.has(id);

          return (
            <div
              key={id}
              style={{
                transition: "opacity 0.35s ease, transform 0.35s ease",
                opacity: isFading ? 0 : 1,
                transform: isFading ? "translateX(16px)" : "translateX(0)",
              }}
              className={`p-4 rounded-lg border shadow-sm ${
                alert.severity === "Critical"
                  ? "bg-red-50/50 border-red-100"
                  : "bg-orange-50/50 border-orange-100"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {alert.severity || "Unknown"}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    {alert.title || "Untitled Alert"}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {alert.timestamp
                    ? formatDistanceToNow(new Date(alert.timestamp), {
                        addSuffix: true,
                      })
                    : "Unknown time"}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-3">
                {alert.description || "No description available"}
              </p>

              <div className="bg-white rounded-md p-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 mb-2">
                  <BrainCircuit className="w-3.5 h-3.5" />
                  AI Reasoning
                </div>
                <ul className="space-y-1">
                  {(alert.reasoning || []).map((reason: string, rIdx: number) => (
                    <li
                      key={rIdx}
                      className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed"
                    >
                      <span className="text-indigo-600 mt-[3px]">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => handleDismiss(id)}
                  className="text-[11px] px-3 py-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm font-medium"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleInvestigate(alert)}
                  className="text-[11px] px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm font-medium"
                >
                  Investigate
                </button>
              </div>
            </div>
          );
        })}

        {visibleAlerts.length === 0 && (
          <div className="text-center text-slate-500 py-8 text-sm">
            No active threats detected.
          </div>
        )}
      </div>
    </div>
  );
}