"use client";

/**
 * ReasoningPanel — Explainable AI-style reasoning display.
 *
 * Renders the reasoning[] array from the Trust Intelligence Engine
 * in a clean, styled panel with an icon, section header, and
 * line-by-line behavioral analysis bullets.
 *
 * Used in: Threat Center alert drawer, Employee Monitor detail page.
 */

import { BrainCircuit, ChevronRight } from 'lucide-react';

interface ReasoningPanelProps {
  reasoning: string[];
  title?: string;
  compact?: boolean;
}

export default function ReasoningPanel({
  reasoning,
  title = 'Trust Intelligence Reasoning',
  compact = false,
}: ReasoningPanelProps) {
  if (!reasoning || reasoning.length === 0) {
    return (
      <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-sm text-indigo-700 italic">No reasoning available for this alert.</p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className="w-4 h-4 text-indigo-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">{title}</span>
      </div>
      <ul className={`space-y-${compact ? '1' : '2'}`}>
        {reasoning.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-indigo-900 leading-snug">
            <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
