import React from 'react';

interface TableSkeletonProps {
  cols: number;
  rows?: number;
}

export default function TableSkeleton({ cols, rows = 6 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse border-b border-slate-100 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="py-4 px-4">
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              {c === 0 && <div className="h-2 bg-slate-100 rounded-md w-1/2 mt-1.5" />}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
