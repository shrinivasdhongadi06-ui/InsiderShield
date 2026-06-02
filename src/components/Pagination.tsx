import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { IPaginationMeta } from '@/types';

interface PaginationProps {
  meta: IPaginationMeta | null;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: PaginationProps) {
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-white select-none">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => meta.hasPrev && onPageChange(meta.page - 1)}
          disabled={!meta.hasPrev}
          className="relative inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => meta.hasNext && onPageChange(meta.page + 1)}
          disabled={!meta.hasNext}
          className="relative ml-3 inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{((meta.page - 1) * meta.pageSize) + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(meta.page * meta.pageSize, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{meta.total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm" aria-label="Pagination">
            <button
              onClick={() => meta.hasPrev && onPageChange(meta.page - 1)}
              disabled={!meta.hasPrev}
              className="relative inline-flex items-center rounded-l-lg border border-slate-200 bg-white px-2 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - meta.page) <= 2 || p === 1 || p === meta.totalPages)
              .map((p, idx, arr) => {
                const isSelected = p === meta.page;
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="relative inline-flex items-center border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                        ...
                      </span>
                    )}
                    <button
                      onClick={() => onPageChange(p)}
                      aria-current={isSelected ? 'page' : undefined}
                      className={`relative inline-flex items-center border px-3 py-2 text-xs font-semibold focus:z-20 transition-all ${
                        isSelected
                          ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
            <button
              onClick={() => meta.hasNext && onPageChange(meta.page + 1)}
              disabled={!meta.hasNext}
              className="relative inline-flex items-center rounded-r-lg border border-slate-200 bg-white px-2 py-2 text-slate-400 hover:bg-slate-50 focus:z-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
